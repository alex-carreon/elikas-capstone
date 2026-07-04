<?php

use App\Models\Feedback;
use App\Models\User;
use App\Models\UserAuth;

/**
 * FeedbackController tests.
 *
 * Routes:
 *   POST /api/feedback              middleware: firebase.auth, role:1,2,3
 *   GET  /api/admin/feedback        middleware: firebase.auth, role:1
 *   GET  /api/admin/feedback/{id}   middleware: firebase.auth, role:1
 *
 * destroy is excluded per spec.
 *
 * Token helpers are in tests/Pest.php.
 */

// ── Helper ────────────────────────────────────────────────────────────────────

/**
 * Create a Feedback row owned by the given user.
 */
function createFeedback(User $user, array $overrides = []): Feedback
{
    return Feedback::create(array_merge([
        'user_id' => $user->id,
        'rating'  => 4.0,
        'message' => 'Test feedback message',
        'sent_at' => now(),
    ], $overrides));
}

// ── POST /api/feedback ────────────────────────────────────────────────────────

// Test 1.1
test('individual user can submit feedback', function () {

    $token = individualToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson('/api/feedback', [
        'rating'  => 4.5,
        'message' => 'Great app!',
    ]);

    $response->assertCreated();

    $response->assertJsonStructure([
        'message',
        'feedback' => ['id', 'rating', 'message', 'sent_at', 'submitted_by'],
    ]);

    $response->assertJson(['message' => 'Feedback submitted successfully']);
});

// Test 1.2
test('govops user can submit feedback', function () {

    $token = govopsToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson('/api/feedback', [
        'rating' => 3.5,
    ]);

    $response->assertCreated();
});

// Test 4
test('store allows feedback without a message', function () {

    $token = individualToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson('/api/feedback', [
        'rating' => 3.0,
    ]);

    $response->assertCreated();

    $response->assertJsonPath('feedback.message', null);
});

// Test 1.3
test('store requires rating', function () {

    $token = individualToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson('/api/feedback', [
        'message' => 'No rating here',
    ]);

    $response->assertStatus(422);

    $response->assertJsonValidationErrors(['rating']);
});

// Test 4.1
test('store rejects rating below 0.5', function () {

    $token = individualToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson('/api/feedback', [
        'rating' => 0.4,
    ]);

    $response->assertStatus(422);

    $response->assertJsonValidationErrors(['rating']);
});

// Test 4.2
test('store rejects rating above 5', function () {

    $token = individualToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson('/api/feedback', [
        'rating' => 5.5,
    ]);

    $response->assertStatus(422);

    $response->assertJsonValidationErrors(['rating']);
});

// Test 2
test('store creates multiple records for the same user without overwriting', function () {

    $token = individualToken();
    $uid   = env('FIREBASE_TEST_VERIFIED_UID');
    $user  = UserAuth::with('user')->where('identity_uid', $uid)->firstOrFail()->user;

    $countBefore = Feedback::where('user_id', $user->id)->count();

    $this->withHeaders(['Authorization' => "Bearer {$token}"])
        ->postJson('/api/feedback', ['rating' => 3.0]);

    $this->withHeaders(['Authorization' => "Bearer {$token}"])
        ->postJson('/api/feedback', ['rating' => 4.5]);

    $countAfter = Feedback::where('user_id', $user->id)->count();

    expect($countAfter)->toBe($countBefore + 2);
});

// Test 1.4
test('store feedback requires authentication', function () {

    $response = $this->postJson('/api/feedback', ['rating' => 4.0]);

    $response->assertStatus(401);
});

// ── GET /api/admin/feedback ───────────────────────────────────────────────────

// Test 5.1
test('admin can list all feedback', function () {

    $token = adminToken();
    $user  = UserAuth::with('user')
        ->where('identity_uid', env('FIREBASE_TEST_VERIFIED_UID'))
        ->firstOrFail()->user;

    createFeedback($user);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/admin/feedback');

    $response->assertOk();

    $response->assertJsonStructure([
        'count',
        'rating_options',
        'feedback' => [
            '*' => ['id', 'rating', 'message', 'sent_at', 'submitted_by'],
        ],
    ]);
});

// Test 5.2
test('admin feedback index blocks individual users', function () {

    $token = individualToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/admin/feedback');

    $response->assertStatus(403);
});

// Test 5.3
test('admin feedback index blocks govops users', function () {

    $token = govopsToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/admin/feedback');

    $response->assertStatus(403);
});

// Test 5.4
test('admin feedback index requires authentication', function () {

    $response = $this->getJson('/api/admin/feedback');

    $response->assertStatus(401);
});

// ── FILTER: id ────────────────────────────────────────────────────────────────

// Test 6.1
test('admin feedback index filters by id', function () {

    $token = adminToken();
    $user  = UserAuth::with('user')
        ->where('identity_uid', env('FIREBASE_TEST_VERIFIED_UID'))
        ->firstOrFail()->user;

    $fb1 = createFeedback($user);
    $fb2 = createFeedback($user);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson("/api/admin/feedback?id={$fb1->id}");

    $response->assertOk();

    $ids = collect($response->json('feedback'))->pluck('id');

    expect($ids)->toContain($fb1->id);
    expect($ids)->not->toContain($fb2->id);
});

// ── FILTER: message ───────────────────────────────────────────────────────────

// Test 6.2
test('admin feedback index filters by message keyword', function () {

    $token = adminToken();
    $user  = UserAuth::with('user')
        ->where('identity_uid', env('FIREBASE_TEST_VERIFIED_UID'))
        ->firstOrFail()->user;

    $match   = createFeedback($user, ['message' => 'Unique keyword XYZZY in message']);
    $noMatch = createFeedback($user, ['message' => 'Completely different text']);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/admin/feedback?message=XYZZY');

    $response->assertOk();

    $ids = collect($response->json('feedback'))->pluck('id');

    expect($ids)->toContain($match->id);
    expect($ids)->not->toContain($noMatch->id);
});

// ── FILTER: rating ────────────────────────────────────────────────────────────

// Test 6.3
test('admin feedback index filters by rating step', function () {

    $token = adminToken();
    $user  = UserAuth::with('user')
        ->where('identity_uid', env('FIREBASE_TEST_VERIFIED_UID'))
        ->firstOrFail()->user;

    $four    = createFeedback($user, ['rating' => 4.0]);
    $twoHalf = createFeedback($user, ['rating' => 2.5]);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/admin/feedback?rating=4.0');

    $response->assertOk();

    $ids = collect($response->json('feedback'))->pluck('id');

    expect($ids)->toContain($four->id);
    expect($ids)->not->toContain($twoHalf->id);
});

// ── FILTER: range ─────────────────────────────────────────────────────────────

// Test 6.4
test('admin feedback index filters by range=past_week', function () {

    $token = adminToken();
    $user  = UserAuth::with('user')
        ->where('identity_uid', env('FIREBASE_TEST_VERIFIED_UID'))
        ->firstOrFail()->user;

    $recent = createFeedback($user, ['sent_at' => now()->subDays(3)]);
    $old    = createFeedback($user, ['sent_at' => now()->subDays(30)]);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/admin/feedback?range=past_week');

    $response->assertOk();

    $ids = collect($response->json('feedback'))->pluck('id');

    expect($ids)->toContain($recent->id);
    expect($ids)->not->toContain($old->id);
});

// Test 6.5
test('admin feedback index filters by range=monthly', function () {

    $token = adminToken();
    $user  = UserAuth::with('user')
        ->where('identity_uid', env('FIREBASE_TEST_VERIFIED_UID'))
        ->firstOrFail()->user;

    $recent = createFeedback($user, ['sent_at' => now()->subDays(15)]);
    $old    = createFeedback($user, ['sent_at' => now()->subDays(60)]);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/admin/feedback?range=monthly');

    $response->assertOk();

    $ids = collect($response->json('feedback'))->pluck('id');

    expect($ids)->toContain($recent->id);
    expect($ids)->not->toContain($old->id);
});

// Test 6.6
test('admin feedback index filters by range=quarterly', function () {

    $token = adminToken();
    $user  = UserAuth::with('user')
        ->where('identity_uid', env('FIREBASE_TEST_VERIFIED_UID'))
        ->firstOrFail()->user;

    $recent = createFeedback($user, ['sent_at' => now()->subDays(45)]);
    $old    = createFeedback($user, ['sent_at' => now()->subDays(120)]);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/admin/feedback?range=quarterly');

    $response->assertOk();

    $ids = collect($response->json('feedback'))->pluck('id');

    expect($ids)->toContain($recent->id);
    expect($ids)->not->toContain($old->id);
});

// ── FILTER: role ──────────────────────────────────────────────────────────────

// Test 6.7
test('admin feedback index filters by role=indiv', function () {

    $token      = adminToken();
    $indivUser  = UserAuth::with('user')
        ->where('identity_uid', env('FIREBASE_TEST_VERIFIED_UID'))
        ->firstOrFail()->user;
    $govopsUser = UserAuth::with('user')
        ->where('identity_uid', env('FIREBASE_TEST_GOVOPS_UID'))
        ->firstOrFail()->user;

    $indivFb  = createFeedback($indivUser);
    $govopsFb = createFeedback($govopsUser);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/admin/feedback?role=indiv');

    $response->assertOk();

    $ids = collect($response->json('feedback'))->pluck('id');

    expect($ids)->toContain($indivFb->id);
    expect($ids)->not->toContain($govopsFb->id);
});

// Test 6.8
test('admin feedback index filters by role=brgy', function () {

    $token      = adminToken();
    $indivUser  = UserAuth::with('user')
        ->where('identity_uid', env('FIREBASE_TEST_VERIFIED_UID'))
        ->firstOrFail()->user;
    $govopsUser = UserAuth::with('user')
        ->where('identity_uid', env('FIREBASE_TEST_GOVOPS_UID'))
        ->firstOrFail()->user;

    $indivFb  = createFeedback($indivUser);
    $govopsFb = createFeedback($govopsUser);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/admin/feedback?role=brgy');

    $response->assertOk();

    $ids = collect($response->json('feedback'))->pluck('id');

    expect($ids)->toContain($govopsFb->id);
    expect($ids)->not->toContain($indivFb->id);
});

// Test 6.9
test('admin feedback index rejects invalid role filter', function () {

    $token = adminToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/admin/feedback?role=superuser');

    $response->assertStatus(422);

    $response->assertJson(['error' => 'Invalid role filter. Accepted values: brgy, indiv']);
});


