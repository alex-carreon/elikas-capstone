<?php

use App\Mail\ContentFlaggedMail;
use App\Mail\ContentRejectedMail;
use App\Models\Admin;
use App\Models\Comment;
use App\Models\EvacArea;
use App\Models\Flag;
use App\Models\FlagReason;
use App\Models\FloodPath;
use App\Models\Location;
use App\Models\ModerationLog;
use App\Models\SocialElement;
use App\Models\TargetTable;
use App\Models\User;
use App\Models\UserAuth;
use Illuminate\Support\Facades\Mail;
use MatanYadaev\EloquentSpatial\Objects\Point;

/**
 * Flag and admin flag moderation tests.
 *
 * Controllers covered:
 *   FlagCommentController  POST /api/comments/{commentId}/flag
 *                          GET  /api/flag-reasons
 *   FlagFloodController    POST /api/flood-paths/{floodPathId}/flag
 *   AdminFlagController    GET  /api/admin/comments/flags
 *                          GET  /api/admin/comments/flags/{commentId}
 *                          GET  /api/admin/flood-paths/flags
 *                          GET  /api/admin/flood-paths/flags/{floodPathId}
 *                          PATCH /api/admin/flags/{elementId}/approve
 *                          PATCH /api/admin/flags/{elementId}/reject
 *   CommentsAdminController GET /api/admin/evac-areas/{evacAreaId}/comments
 *                            GET /api/admin/comments/{id}
 *                            PATCH /api/admin/comments/{id}
 *                            PATCH /api/admin/comments/{id}/deactivate
 *
 * Mail is faked. Token helpers are in tests/Pest.php.
 */

// ── Helpers ───────────────────────────────────────────────────────────────────

function flagIndivUser(): User
{
    return UserAuth::with('user')
        ->where('identity_uid', env('FIREBASE_TEST_VERIFIED_UID'))
        ->firstOrFail()->user;
}

function flagAdminUser(): User
{
    return UserAuth::with('user')
        ->where('identity_uid', env('FIREBASE_TEST_ADMIN_UID'))
        ->firstOrFail()->user;
}

function flagOtherUser(): User
{
    return UserAuth::with('user')
        ->where('identity_uid', env('FIREBASE_TEST_GOVOPS_UID'))
        ->firstOrFail()->user;
}

function firstFlagReason(): FlagReason
{
    $reason = FlagReason::first();

    if (! $reason) {
        test()->fail('No FlagReason rows in DB — seed at least one before running flag tests.');
    }

    return $reason;
}

function flagEvacPin(User $owner): EvacArea
{
    static $offset = 0;
    $offset += 0.001;

    $socialElement = SocialElement::create([
        'user_id'   => $owner->id,
        'posted_at' => now(),
        'type_id'   => 1,
        'has_media' => false,
    ]);

    $location      = Location::where('level_id', 3)->first();
    $evacType      = \Illuminate\Support\Facades\DB::table('EvacTypes')->first();
    $capacityLevel = \Illuminate\Support\Facades\DB::table('CapacityLevels')->first();

    $pin = EvacArea::create([
        'element_id'     => $socialElement->id,
        'location_id'    => $location->id,
        'location'       => new Point(round(15.0 + $offset, 6), round(175.0 + $offset, 6)),
        'area_type'      => $evacType->id,
        'address'        => 'Flag Test Address',
        'name'           => 'Flag Test Evac Area',
        'description'    => 'Flag test description',
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

function flagComment(User $author, EvacArea $pin, string $content = 'Flaggable comment'): Comment
{
    $targetTable = TargetTable::where('table_name', 'Comments')->firstOrFail();

    $socialElement = SocialElement::create([
        'user_id'   => $author->id,
        'posted_at' => now(),
        'type_id'   => $targetTable->id,
        'has_media' => false,
    ]);

    return Comment::create([
        'element_id' => $socialElement->id,
        'parent_id'  => $pin->element_id,
        'content'    => $content,
        'upvotes'    => 0,
        'downvotes'  => 0,
    ]);
}

function flagFloodPath(User $owner): FloodPath
{
    static $offset = 0;
    $offset += 0.001;

    $targetTable = TargetTable::where('table_name', 'FloodPaths')->firstOrFail();

    $socialElement = SocialElement::create([
        'user_id'   => $owner->id,
        'posted_at' => now(),
        'type_id'   => $targetTable->id,
        'has_media' => false,
    ]);

    $level = \App\Models\FloodLevel::first();

    return FloodPath::create([
        'element_id'     => $socialElement->id,
        'level_id'       => $level->id,
        'last_confirmed' => now(),
        'path'           => new \MatanYadaev\EloquentSpatial\Objects\LineString([
            new Point(round(20.0 + $offset, 6), 176.0),
            new Point(round(20.0 + $offset + 0.0001, 6), 176.0001),
        ]),
        'description'    => 'Flag test flood path',
        'upvotes'        => 0,
        'downvotes'      => 0,
        'expiry'         => now()->addDays(3),
    ]);
}

// ── GET /api/flag-reasons ─────────────────────────────────────────────────────

// Test 5.1
test('flag reasons are returned for authenticated users', function () {

    $token = individualToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/flag-reasons');

    $response->assertOk();

    $response->assertJsonStructure([
        'reasons' => [
            '*' => ['id', 'reason_label'],
        ],
    ]);
});

// Test 5.2
test('flag reasons requires authentication', function () {

    $response = $this->getJson('/api/flag-reasons');

    $response->assertStatus(401);
});

// ── POST /api/comments/{commentId}/flag ───────────────────────────────────────

// Test 1.1
test('user can flag another users comment', function () {

    Mail::fake();

    $flagger = flagIndivUser();
    $author  = flagOtherUser();
    $pin     = flagEvacPin($author);
    $comment = flagComment($author, $pin);
    $reason  = firstFlagReason();

    $token = individualToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson("/api/comments/{$comment->id}/flag", [
        'reason_id' => $reason->id,
    ]);

    $response->assertCreated();

    $response->assertJson(['message' => 'Comment flagged successfully.']);
});

// Test 1.2
test('flag comment sends email when threshold is reached', function () {

    Mail::fake();

    $author  = flagOtherUser();
    $pin     = flagEvacPin($author);
    $comment = flagComment($author, $pin);
    $reason  = firstFlagReason();

    // Pre-seed 2 flags so the next one hits the threshold of 3
    $dummyUsers = User::factory()->count(2)->create();

    foreach ($dummyUsers as $dummyUser) {
        Flag::create([
            'user_id'    => $dummyUser->id,
            'element_id' => $comment->element_id,
            'reason_id'  => $reason->id,
            'flagged_at' => now(),
            'is_approved'=> null,
        ]);
    }

    $token = individualToken();

    $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson("/api/comments/{$comment->id}/flag", [
        'reason_id' => $reason->id,
    ]);

    Mail::assertSent(ContentFlaggedMail::class);
});

// Test 3
test('user cannot flag their own comment', function () {

    Mail::fake();

    $user    = flagIndivUser();
    $pin     = flagEvacPin($user);
    $comment = flagComment($user, $pin);
    $reason  = firstFlagReason();

    $token = individualToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson("/api/comments/{$comment->id}/flag", [
        'reason_id' => $reason->id,
    ]);

    $response->assertStatus(403);

    $response->assertJson(['message' => 'You cannot flag your own comment.']);
});

// Test 2
test('user cannot flag the same comment twice', function () {

    Mail::fake();

    $flagger = flagIndivUser();
    $author  = flagOtherUser();
    $pin     = flagEvacPin($author);
    $comment = flagComment($author, $pin);
    $reason  = firstFlagReason();

    // First flag
    Flag::create([
        'user_id'    => $flagger->id,
        'element_id' => $comment->element_id,
        'reason_id'  => $reason->id,
        'flagged_at' => now(),
        'is_approved'=> null,
    ]);

    $token = individualToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson("/api/comments/{$comment->id}/flag", [
        'reason_id' => $reason->id,
    ]);

    $response->assertStatus(409);

    $response->assertJson(['message' => 'You have already flagged this comment.']);
});

// Test 4
test('flag comment returns 404 for missing comment', function () {

    Mail::fake();

    $token  = individualToken();
    $reason = firstFlagReason();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson('/api/comments/999999/flag', [
        'reason_id' => $reason->id,
    ]);

    $response->assertNotFound();
});

// Test 5.3
test('flag comment requires reason_id', function () {

    Mail::fake();

    $author  = flagOtherUser();
    $pin     = flagEvacPin($author);
    $comment = flagComment($author, $pin);

    $token = individualToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson("/api/comments/{$comment->id}/flag", []);

    $response->assertStatus(422);

    $response->assertJsonValidationErrors(['reason_id']);
});

// Test 1.3
test('flag comment requires authentication', function () {

    $response = $this->postJson('/api/comments/1/flag', ['reason_id' => 1]);

    $response->assertStatus(401);
});

// ── POST /api/flood-paths/{floodPathId}/flag ──────────────────────────────────

// Test 1.1
test('user can flag another users flood path', function () {

    Mail::fake();

    $author = flagOtherUser();
    $fp     = flagFloodPath($author);
    $reason = firstFlagReason();

    $token = individualToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson("/api/flood-paths/{$fp->id}/flag", [
        'reason_id' => $reason->id,
    ]);

    $response->assertCreated();

    $response->assertJson(['message' => 'Flood path flagged successfully.']);
});

// Test 1.2
test('flag flood path sends email when threshold is reached', function () {

    Mail::fake();

    $author = flagOtherUser();
    $fp     = flagFloodPath($author);
    $reason = firstFlagReason();

    $dummyUsers = User::factory()->count(2)->create();

    foreach ($dummyUsers as $dummyUser) {
        Flag::create([
            'user_id'    => $dummyUser->id,
            'element_id' => $fp->element_id,
            'reason_id'  => $reason->id,
            'flagged_at' => now(),
            'is_approved'=> null,
        ]);
    }

    $token = individualToken();

    $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson("/api/flood-paths/{$fp->id}/flag", [
        'reason_id' => $reason->id,
    ]);

    Mail::assertSent(ContentFlaggedMail::class);
});

// Test 3
test('user cannot flag their own flood path', function () {

    Mail::fake();

    $user   = flagIndivUser();
    $fp     = flagFloodPath($user);
    $reason = firstFlagReason();

    $token = individualToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson("/api/flood-paths/{$fp->id}/flag", [
        'reason_id' => $reason->id,
    ]);

    $response->assertStatus(403);

    $response->assertJson(['message' => 'You cannot flag your own flood path.']);
});

// Test 2
test('user cannot flag the same flood path twice', function () {

    Mail::fake();

    $flagger = flagIndivUser();
    $author  = flagOtherUser();
    $fp      = flagFloodPath($author);
    $reason  = firstFlagReason();

    Flag::create([
        'user_id'    => $flagger->id,
        'element_id' => $fp->element_id,
        'reason_id'  => $reason->id,
        'flagged_at' => now(),
        'is_approved'=> null,
    ]);

    $token = individualToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson("/api/flood-paths/{$fp->id}/flag", [
        'reason_id' => $reason->id,
    ]);

    $response->assertStatus(409);

    $response->assertJson(['message' => 'You have already flagged this flood path.']);
});

// Test 4.1
test('cannot flag a deactivated flood path', function () {

    Mail::fake();

    $author = flagOtherUser();
    $fp     = flagFloodPath($author);
    $fp->load('socialElement');
    $fp->socialElement->update(['deactivated_at' => now()]);

    $reason = firstFlagReason();
    $token  = individualToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson("/api/flood-paths/{$fp->id}/flag", [
        'reason_id' => $reason->id,
    ]);

    $response->assertStatus(403);

    $response->assertJson(['message' => 'Flood path is no longer active.']);
});

// Test 4.2
test('flag flood path returns 404 for missing flood path', function () {

    Mail::fake();

    $token  = individualToken();
    $reason = firstFlagReason();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson('/api/flood-paths/999999/flag', [
        'reason_id' => $reason->id,
    ]);

    $response->assertNotFound();
});

// Test 1.3
test('flag flood path requires authentication', function () {

    $response = $this->postJson('/api/flood-paths/1/flag', ['reason_id' => 1]);

    $response->assertStatus(401);
});

// ── GET /api/admin/comments/flags ─────────────────────────────────────────────

// Test 6.1
test('admin can list flagged comments', function () {

    $token = adminToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/admin/comments/flags');

    $response->assertOk();

    $response->assertJsonStructure(['count', 'flags']);
});

// Test 6.2
test('admin comment flags can filter by type=manual', function () {

    $token  = adminToken();
    $author = flagOtherUser();
    $pin    = flagEvacPin($author);
    $comment = flagComment($author, $pin);
    $reason = firstFlagReason();

    Flag::create([
        'user_id'    => flagIndivUser()->id,
        'element_id' => $comment->element_id,
        'reason_id'  => $reason->id,
        'flagged_at' => now(),
        'is_approved'=> null,
    ]);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/admin/comments/flags?type=manual');

    $response->assertOk();

    $elementIds = collect($response->json('flags'))->pluck('element_id');

    expect($elementIds)->toContain($comment->element_id);
});

// Test 6.3
test('admin comment flags can filter by type=moderation', function () {

    $token   = adminToken();
    $author  = flagOtherUser();
    $pin     = flagEvacPin($author);
    $comment = flagComment($author, $pin);

    ModerationLog::create([
        'element_id'  => $comment->element_id,
        'created_at'  => now(),
        'is_approved' => null,
    ]);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/admin/comments/flags?type=moderation');

    $response->assertOk();

    $elementIds = collect($response->json('flags'))->pluck('element_id');

    expect($elementIds)->toContain($comment->element_id);
});

// Test 6.4
test('admin comment flags blocks individual users', function () {

    $token = individualToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/admin/comments/flags');

    $response->assertStatus(403);
});

// ── GET /api/admin/comments/flags/{commentId} ─────────────────────────────────

// Test 7.1
test('admin can view flagged comment detail', function () {

    $token   = adminToken();
    $author  = flagOtherUser();
    $pin     = flagEvacPin($author);
    $comment = flagComment($author, $pin);
    $reason  = firstFlagReason();

    Flag::create([
        'user_id'    => flagIndivUser()->id,
        'element_id' => $comment->element_id,
        'reason_id'  => $reason->id,
        'flagged_at' => now(),
        'is_approved'=> null,
    ]);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson("/api/admin/comments/flags/{$comment->id}");

    $response->assertOk();

    $response->assertJsonStructure([
        'comment' => [
            'id', 'element_id', 'evac_area', 'posted_by',
            'content', 'upvotes', 'downvotes', 'posted_at', 'media',
            'flag_info' => [
                'flag_count',
                'manual' => ['flag_count', 'reasons'],
                'ai_moderation',
            ],
        ],
    ]);
});

// Test 7.2
test('admin comment flag detail returns 404 for missing comment', function () {

    $token = adminToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/admin/comments/flags/999999');

    $response->assertNotFound();
});

// ── GET /api/admin/flood-paths/flags ──────────────────────────────────────────

// Test 8.1
test('admin can list flagged flood paths', function () {

    $token  = adminToken();
    $author = flagOtherUser();
    $fp     = flagFloodPath($author);
    $reason = firstFlagReason();

    Flag::create([
        'user_id'    => flagIndivUser()->id,
        'element_id' => $fp->element_id,
        'reason_id'  => $reason->id,
        'flagged_at' => now(),
        'is_approved'=> null,
    ]);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/admin/flood-paths/flags');

    $response->assertOk();

    $response->assertJsonStructure(['count', 'flags']);
});


// ── GET /api/admin/flood-paths/flags/{floodPathId} ────────────────────────────

// Test 9.1
test('admin can view flagged flood path detail', function () {

    $token  = adminToken();
    $author = flagOtherUser();
    $fp     = flagFloodPath($author);
    $reason = firstFlagReason();

    Flag::create([
        'user_id'    => flagIndivUser()->id,
        'element_id' => $fp->element_id,
        'reason_id'  => $reason->id,
        'flagged_at' => now(),
        'is_approved'=> null,
    ]);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson("/api/admin/flood-paths/flags/{$fp->id}");

    $response->assertOk();

    $response->assertJsonStructure([
        'flood_path' => [
            'id', 'element_id', 'flood_level', 'posted_by',
            'path', 'description', 'upvotes', 'downvotes',
            'is_expired', 'is_deactivated', 'media',
            'flag_info' => ['type', 'flag_count', 'reasons', 'ai_moderation'],
        ],
    ]);
});

// Test 9.2
test('admin flood path flag detail returns 404 for missing flood path', function () {

    $token = adminToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/admin/flood-paths/flags/999999');

    $response->assertNotFound();
});

// ── PATCH /api/admin/flags/{elementId}/approve ────────────────────────────────

// Test 10.1
test('admin can approve a flagged element', function () {

    $token   = adminToken();
    $admin   = flagAdminUser();
    $author  = flagOtherUser();
    $pin     = flagEvacPin($author);
    $comment = flagComment($author, $pin);
    $reason  = firstFlagReason();

    Flag::create([
        'user_id'    => flagIndivUser()->id,
        'element_id' => $comment->element_id,
        'reason_id'  => $reason->id,
        'flagged_at' => now(),
        'is_approved'=> null,
    ]);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->patchJson("/api/admin/flags/{$comment->element_id}/approve");

    $response->assertOk();

    $response->assertJson(['message' => 'Content approved and flags cleared.']);

    // All flags for this element should now have is_approved = true
    $pending = Flag::where('element_id', $comment->element_id)
        ->whereNull('is_approved')
        ->count();

    expect($pending)->toBe(0);
});

// Test 10.2
test('approve requires admin account record', function () {

    // govops has no Admin row — should get 403
    $token   = govopsToken();
    $author  = flagOtherUser();
    $pin     = flagEvacPin($author);
    $comment = flagComment($author, $pin);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->patchJson("/api/admin/flags/{$comment->element_id}/approve");

    // role:1 middleware blocks govops before even reaching the controller
    $response->assertStatus(403);
});

// ── PATCH /api/admin/flags/{elementId}/reject ─────────────────────────────────

// Test 11.1
test('admin can reject a flagged element and deactivates it', function () {

    Mail::fake();

    $token   = adminToken();
    $author  = flagOtherUser();
    $pin     = flagEvacPin($author);
    $comment = flagComment($author, $pin);
    $reason  = firstFlagReason();

    Flag::create([
        'user_id'    => flagIndivUser()->id,
        'element_id' => $comment->element_id,
        'reason_id'  => $reason->id,
        'flagged_at' => now(),
        'is_approved'=> null,
    ]);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->patchJson("/api/admin/flags/{$comment->element_id}/reject");

    $response->assertOk();

    $response->assertJson(['message' => 'Content rejected and deactivated.']);

    // SocialElement should be deactivated
    $element = SocialElement::find($comment->element_id);
    expect($element->deactivated_at)->not->toBeNull();

    // All flags resolved
    $pending = Flag::where('element_id', $comment->element_id)
        ->whereNull('is_approved')
        ->count();

    expect($pending)->toBe(0);
});

// Test 11.2
test('reject sends ContentRejectedMail to content owner', function () {

    Mail::fake();

    $token   = adminToken();
    $author  = flagOtherUser();
    $pin     = flagEvacPin($author);
    $comment = flagComment($author, $pin);
    $reason  = firstFlagReason();

    Flag::create([
        'user_id'    => flagIndivUser()->id,
        'element_id' => $comment->element_id,
        'reason_id'  => $reason->id,
        'flagged_at' => now(),
        'is_approved'=> null,
    ]);

    $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->patchJson("/api/admin/flags/{$comment->element_id}/reject");

    Mail::assertSent(ContentRejectedMail::class);
});

// Test 11.3
test('reject returns 404 for missing element', function () {

    Mail::fake();

    $token = adminToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->patchJson('/api/admin/flags/999999/reject');

    $response->assertNotFound();
});

// ── GET /api/admin/evac-areas/{evacAreaId}/comments ───────────────────────────

// Test 8.1
test('admin can list all comments for an evac area including deactivated', function () {

    $token   = adminToken();
    $author  = flagOtherUser();
    $pin     = flagEvacPin($author);
    $active  = flagComment($author, $pin, 'Active comment');
    $deactivated = flagComment($author, $pin, 'Deactivated comment');
    $deactivated->load('element');
    $deactivated->element->update(['deactivated_at' => now()]);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson("/api/admin/evac-areas/{$pin->id}/comments");

    $response->assertOk();

    $response->assertJsonStructure([
        'count',
        'comments' => [
            '*' => [
                'id', 'content', 'is_flagged',
                'commented_by', 'posted_at', 'is_deactivated', 'media',
            ],
        ],
    ]);

    $ids = collect($response->json('comments'))->pluck('id');

    // Admin sees both active and deactivated
    expect($ids)->toContain($active->id);
    expect($ids)->toContain($deactivated->id);
});

// Test 8.2
test('admin evac comments returns 404 for missing evac area', function () {

    $token = adminToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/admin/evac-areas/999999/comments');

    $response->assertNotFound();
});

// ── GET /api/admin/comments/{id} ──────────────────────────────────────────────

// Test 9.1
test('admin can view a single comment detail', function () {

    $token   = adminToken();
    $author  = flagOtherUser();
    $pin     = flagEvacPin($author);
    $comment = flagComment($author, $pin);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson("/api/admin/comments/{$comment->id}");

    $response->assertOk();

    $response->assertJsonStructure([
        'comment' => [
            'id', 'evac_area', 'posted_by', 'content',
            'upvotes', 'downvotes', 'posted_at', 'is_deactivated', 'media',
        ],
    ]);

    $response->assertJsonPath('comment.id', $comment->id);
});

// Test 9.2
test('admin comment show returns 404 for missing comment', function () {

    $token = adminToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/admin/comments/999999');

    $response->assertNotFound();
});

// ── PATCH /api/admin/comments/{id} ────────────────────────────────────────────

// Test 10.1
test('admin can update comment content', function () {

    $token   = adminToken();
    $author  = flagOtherUser();
    $pin     = flagEvacPin($author);
    $comment = flagComment($author, $pin);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->patchJson("/api/admin/comments/{$comment->id}", [
        'content' => 'Admin-edited content.',
    ]);

    $response->assertOk();

    $response->assertJson([
        'message'    => 'Comment updated successfully.',
        'comment_id' => $comment->id,
    ]);
});

// Test 10.2
test('admin update comment requires content', function () {

    $token   = adminToken();
    $author  = flagOtherUser();
    $pin     = flagEvacPin($author);
    $comment = flagComment($author, $pin);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->patchJson("/api/admin/comments/{$comment->id}", []);

    $response->assertStatus(422);

    $response->assertJsonValidationErrors(['content']);
});

// Test 10.3
test('admin update returns 404 for deactivated comment', function () {

    $token   = adminToken();
    $author  = flagOtherUser();
    $pin     = flagEvacPin($author);
    $comment = flagComment($author, $pin);
    $comment->load('element');
    $comment->element->update(['deactivated_at' => now()]);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->patchJson("/api/admin/comments/{$comment->id}", [
        'content' => 'Should fail.',
    ]);

    $response->assertNotFound();
});

// ── PATCH /api/admin/comments/{id}/deactivate ─────────────────────────────────

// Test 11.1
test('admin can deactivate a comment', function () {

    $token   = adminToken();
    $author  = flagOtherUser();
    $pin     = flagEvacPin($author);
    $comment = flagComment($author, $pin);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->patchJson("/api/admin/comments/{$comment->id}/deactivate");

    $response->assertOk();

    $response->assertJsonStructure([
        'message', 'deactivated_at',
        'deactivated_by' => ['id', 'role_id'],
    ]);

    $response->assertJson(['message' => 'Comment deactivated successfully.']);
});

// Test 11.2
test('admin deactivate returns 404 for already-deactivated comment', function () {

    $token   = adminToken();
    $author  = flagOtherUser();
    $pin     = flagEvacPin($author);
    $comment = flagComment($author, $pin);
    $comment->load('element');
    $comment->element->update(['deactivated_at' => now()]);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->patchJson("/api/admin/comments/{$comment->id}/deactivate");

    $response->assertNotFound();
});

// Test 11.3
test('admin deactivate requires authentication', function () {

    $response = $this->patchJson('/api/admin/comments/1/deactivate');

    $response->assertStatus(401);
});