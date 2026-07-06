<?php

use App\Models\Comment;
use App\Models\EvacArea;
use App\Models\Flag;
use App\Models\FlagReason;
use App\Models\SocialElement;
use App\Models\TargetTable;
use App\Models\User;
use App\Models\UserAuth;
use App\Services\MediaUploadService;
use App\Services\ModerationService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use MatanYadaev\EloquentSpatial\Objects\Point;

/**
 * EvacComments controller tests.
 *
 * Routes (all under firebase.auth, role:1,2,3):
 *   GET  /api/evac-areas/{evacAreaId}/comments
 *   POST /api/evac-areas/{evacAreaId}/comments
 *   GET  /api/comments/{id}
 *
 * ModerationService is mocked — no OpenAI calls.
 * MediaUploadService is mocked — no SFTP writes.
 * Token helpers are in tests/Pest.php.
 */

// ── Helpers ───────────────────────────────────────────────────────────────────

function commentUser(): User
{
    $uid = env('FIREBASE_TEST_VERIFIED_UID');
    $auth = UserAuth::with('user')->where('identity_uid', $uid)->first();

    if (! $auth || ! $auth->user) {
        test()->fail("No UserAuth row for FIREBASE_TEST_VERIFIED_UID [{$uid}].");
    }

    return $auth->user;
}

function otherCommentUser(): User
{
    $uid = env('FIREBASE_TEST_ADMIN_UID');
    $auth = UserAuth::with('user')->where('identity_uid', $uid)->first();

    if (! $auth || ! $auth->user) {
        test()->fail("No UserAuth row for FIREBASE_TEST_ADMIN_UID [{$uid}].");
    }

    return $auth->user;
}

/**
 * Create a minimal EvacArea owned by the given user.
 */
function commentEvacPin(User $owner): EvacArea
{
    static $offset = 0;
    $offset += 0.001;

    $socialElement = SocialElement::create([
        'user_id'   => $owner->id,
        'posted_at' => now(),
        'type_id'   => 1,
        'has_media' => false,
    ]);

    $location      = \App\Models\Location::where('level_id', 3)->first();
    $evacType      = \Illuminate\Support\Facades\DB::table('EvacTypes')->first();
    $capacityLevel = \Illuminate\Support\Facades\DB::table('CapacityLevels')->first();

    $pin = EvacArea::create([
        'element_id'     => $socialElement->id,
        'location_id'    => $location->id,
        'location'       => new Point(round(12.0 + $offset, 6), round(174.0 + $offset, 6)),
        'area_type'      => $evacType->id,
        'address'        => 'Comment Test Address',
        'name'           => 'Comment Test Evac Area',
        'description'    => 'Comment test description',
        'capacity_level' => $capacityLevel->id,
        'last_updated'   => now(),
        'is_persistent'  => false,
        'for_reg_flood'  => false,
        'for_heavy_flood'=> false,
        'has_accom'      => false,
        'has_DRRMO'      => false,
        'has_health'     => false,
        'pwd_friendly'   => false,
        'has_catchment'  => false,
        'expiry'         => now()->addDays(3),
    ]);

    return $pin->load('social_element');
}

/**
 * Create a Comment on a given EvacArea owned by the given user.
 */
function createComment(User $author, EvacArea $evacArea, array $overrides = []): Comment
{
    $targetTable = TargetTable::where('table_name', 'Comments')->firstOrFail();

    $socialElement = SocialElement::create([
        'user_id'   => $author->id,
        'posted_at' => now(),
        'type_id'   => $targetTable->id,
        'has_media' => false,
    ]);

    return Comment::create(array_merge([
        'element_id' => $socialElement->id,
        'parent_id'  => $evacArea->element_id,
        'content'    => 'Test comment content',
        'upvotes'    => 0,
        'downvotes'  => 0,
    ], $overrides));
}

// ── GET /api/evac-areas/{evacAreaId}/comments ─────────────────────────────────

// Test 6.1
test('comments index returns all active comments for evac area', function () {

    $token = individualToken();
    $user  = commentUser();
    $pin   = commentEvacPin($user);

    createComment($user, $pin);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson("/api/evac-areas/{$pin->id}/comments");

    $response->assertOk();

    $response->assertJsonStructure([
        'count',
        'comments' => [
            '*' => [
                'id', 'content', 'upvotes', 'downvotes',
                'user_vote', 'user_flag',
                'posted_by' => ['id', 'role', 'username', 'avatar_seed'],
                'is_mine', 'posted_at', 'has_media', 'media', 'deactivated_at',
            ],
        ],
    ]);
});

// Test 6.2
test('comments index marks is_mine correctly for comment owner', function () {

    $token = individualToken();
    $user  = commentUser();
    $pin   = commentEvacPin($user);
    $comment = createComment($user, $pin);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson("/api/evac-areas/{$pin->id}/comments");

    $response->assertOk();

    $match = collect($response->json('comments'))->firstWhere('id', $comment->id);

    expect($match)->not->toBeNull();
    expect($match['is_mine'])->toBeTrue();
});

// Test 6.3
test('comments index excludes deactivated comments', function () {

    $token = individualToken();
    $user  = commentUser();
    $pin   = commentEvacPin($user);

    $active      = createComment($user, $pin, ['content' => 'Active comment']);
    $deactivated = createComment($user, $pin, ['content' => 'Deactivated comment']);
    $deactivated->load('element');
    $deactivated->element->update(['deactivated_at' => now()]);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson("/api/evac-areas/{$pin->id}/comments");

    $response->assertOk();

    $ids = collect($response->json('comments'))->pluck('id');

    expect($ids)->toContain($active->id);
    expect($ids)->not->toContain($deactivated->id);
});

// Test 6.4
test('comments index returns 404 for missing evac area', function () {

    $token = individualToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/evac-areas/999999/comments');

    $response->assertNotFound();

    $response->assertJson(['message' => 'Evacuation area not found.']);
});

// Test 6.5
test('comments index requires authentication', function () {

    $response = $this->getJson('/api/evac-areas/1/comments');

    $response->assertStatus(401);
});

// ── GET /api/comments/{id} ────────────────────────────────────────────────────

// Test 6.6
test('comment show returns vote and flag data', function () {

    $token = individualToken();
    $user  = commentUser();
    $pin   = commentEvacPin($user);
    $comment = createComment($user, $pin);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson("/api/comments/{$comment->id}");

    $response->assertOk();

    $response->assertJsonStructure([
        'vote', 'downvote', 'user_vote', 'user_flagged',
    ]);
});

// Test 6.7
test('comment show returns 404 for missing comment', function () {

    $token = individualToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/comments/999999');

    $response->assertNotFound();

    $response->assertJson(['message' => 'Comment not found.']);
});

// Test 6.8
test('comment show requires authentication', function () {

    $response = $this->getJson('/api/comments/1');

    $response->assertStatus(401);
});

// ── POST /api/evac-areas/{evacAreaId}/comments ────────────────────────────────

// Test 1.1
test('user can post a text comment', function () {

    $this->mock(ModerationService::class, function ($mock) {
        $mock->shouldReceive('moderate')
            ->once()
            ->andReturn(['flagged' => false]);
    });

    $token = individualToken();
    $user  = commentUser();
    $pin   = commentEvacPin($user);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson("/api/evac-areas/{$pin->id}/comments", [
        'content' => 'This is a test comment.',
    ]);

    $response->assertCreated();

    $response->assertJsonStructure(['message', 'comment_id', 'element_id', 'moderation']);

    $response->assertJson(['message' => 'Comment created successfully.']);
});

// Test 1.2
test('user can post a comment with media only', function () {

    $this->mock(ModerationService::class, function ($mock) {
        // No text content = moderation is skipped
        $mock->shouldNotReceive('moderate');
    });

    $this->mock(MediaUploadService::class, function ($mock) {
        $mock->shouldReceive('upload')
            ->once()
            ->andReturn('comments/test-image.jpg');
    });

    Storage::fake('sftp');

    $token = individualToken();
    $user  = commentUser();
    $pin   = commentEvacPin($user);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson("/api/evac-areas/{$pin->id}/comments", [
        'file' => UploadedFile::fake()->image('comment.jpg'),
    ]);

    $response->assertCreated();
});

// Test 1.3
test('store rejects comment with neither content nor media', function () {

    $token = individualToken();
    $user  = commentUser();
    $pin   = commentEvacPin($user);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson("/api/evac-areas/{$pin->id}/comments", [
        'content' => '   ', // whitespace only
    ]);

    $response->assertStatus(422);

    $response->assertJson(['message' => 'Comment must contain text or media.']);
});

// Test 1.4
test('user cannot post a comment with an unsupported file type', function () {

    $this->mock(MediaUploadService::class, function ($mock) {
        $mock->shouldNotReceive('upload');
    });

    $this->mock(ModerationService::class, function ($mock) {
        $mock->shouldNotReceive('moderate');
    });

    Storage::fake('sftp');

    $token = individualToken();
    $user  = commentUser();
    $pin   = commentEvacPin($user);

    $file = UploadedFile::fake()->create(
        'malware.pdf',
        100,
        'application/pdf'
    );

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson("/api/evac-areas/{$pin->id}/comments", [
        'file' => $file,
    ]);

    $response
        ->assertStatus(422)
        ->assertJsonValidationErrors('file');
});

// Test 7
test('store returns 404 for missing evac area', function () {

    $this->mock(ModerationService::class);

    $token = individualToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson('/api/evac-areas/999999/comments', [
        'content' => 'Hello.',
    ]);

    $response->assertNotFound();

    $response->assertJson(['message' => 'Evacuation area not found.']);
});

// Test 4
test('store flagged comment still saves but moderation result is included', function () {

    $this->mock(ModerationService::class, function ($mock) {
        $mock->shouldReceive('moderate')
            ->once()
            ->andReturn(['flagged' => true]);
    });

    $token = individualToken();
    $user  = commentUser();
    $pin   = commentEvacPin($user);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson("/api/evac-areas/{$pin->id}/comments", [
        'content' => 'Potentially bad content.',
    ]);

    // Comment is still created — moderation does not block it
    $response->assertCreated();

    $response->assertJsonPath('moderation.flagged', true);
    $response->assertJsonPath('moderation.log_created', true);
});

// Test 1.5
test('store rejects content exceeding 1000 characters', function () {

    $token = individualToken();
    $user  = commentUser();
    $pin   = commentEvacPin($user);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson("/api/evac-areas/{$pin->id}/comments", [
        'content' => str_repeat('a', 1001),
    ]);

    $response->assertStatus(422);

    $response->assertJsonValidationErrors(['content']);
});

// Test 1.6
test('store comment requires authentication', function () {

    $response = $this->postJson('/api/evac-areas/1/comments', [
        'content' => 'Hello.',
    ]);

    $response->assertStatus(401);
});