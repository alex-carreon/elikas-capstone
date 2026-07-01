<?php

use App\Models\FloodLevel;
use App\Models\FloodPath;
use App\Models\SocialElement;
use App\Models\TargetTable;
use App\Models\UserAuth;

/**
 * FloodReminderController tests.
 *
 * Routes (all under firebase.auth, role:1,2,3):
 *   GET   /flood-reminders
 *   PATCH /flood-reminders/remind-later
 *   PATCH /flood-reminders/dismiss
 *
 * The reminder index fires when a path is past its halfway point between
 * last_confirmed and expiry AND has not been dismissed. We control this
 * in tests by setting last_confirmed/expiry to force the halfway condition.
 *
 * Token helpers are defined globally in tests/Pest.php.
 */

// ── Helper ────────────────────────────────────────────────────────────────────

function reminderUser(): \App\Models\User
{
    $uid      = env('FIREBASE_TEST_VERIFIED_UID');
    $userAuth = UserAuth::with('user')->where('identity_uid', $uid)->first();

    if (! $userAuth || ! $userAuth->user) {
        test()->fail("No UserAuth row found for FIREBASE_TEST_VERIFIED_UID [{$uid}].");
    }

    return $userAuth->user;
}

/**
 * Create a FloodPath whose halfway point is already in the past,
 * so the reminder index will include it.
 */
function createRemindablePath(\App\Models\User $user, array $overrides = []): FloodPath
{
    $targetTable = TargetTable::where('table_name', 'FloodPaths')->firstOrFail();
    $floodLevel  = FloodLevel::first();

    $socialElement = SocialElement::create([
        'user_id'   => $user->id,
        'posted_at' => now()->subHours(4),
        'type_id'   => $targetTable->id,
        'has_media' => false,
    ]);

    // last_confirmed 4 hours ago, expiry 4 hours from now → halfway was now()
    // so the condition now()->gte($halfway) is true immediately
    $floodPath = FloodPath::create(array_merge([
        'element_id'       => $socialElement->id,
        'level_id'         => $floodLevel->id,
        'last_confirmed'   => now()->subHours(4),
        'path'             => new \MatanYadaev\EloquentSpatial\Objects\LineString([
            new \MatanYadaev\EloquentSpatial\Objects\Point(1.0001, 170.0001),
            new \MatanYadaev\EloquentSpatial\Objects\Point(1.0002, 170.0002),
        ]),
        'description'      => 'Remindable flood path',
        'upvotes'          => 0,
        'downvotes'        => 0,
        'expiry'           => now()->addHours(4),
        'reminder_sent_at' => null,
        'dismissed_at'     => null,
    ], $overrides));

    return $floodPath->load('socialElement');
}

// ── INDEX ─────────────────────────────────────────────────────────────────────

// TEST 13.1
test('reminder index returns reminders past the halfway point', function () {

    $token = individualToken();
    $user  = reminderUser();

    $fp = createRemindablePath($user);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/flood-reminders');

    $response->assertOk();

    $response->assertJsonStructure([
        'count',
        'reminders',
    ]);

    $ids = collect($response->json('reminders'))->pluck('floodpath_id');
    expect($ids)->toContain($fp->id);
});

// TEST 13.2
test('reminder index does not return paths not yet at halfway point', function () {

    $token = individualToken();
    $user  = reminderUser();

    // last_confirmed just now, expiry 8 hours from now - halfway is 4 hours from now
    $fp = createRemindablePath($user, [
        'last_confirmed' => now(),
        'expiry'         => now()->addHours(8),
    ]);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/flood-reminders');

    $response->assertOk();

    $ids = collect($response->json('reminders'))->pluck('floodpath_id');
    expect($ids)->not->toContain($fp->id);
});

// TEST 13.3
test('reminder index does not return dismissed paths', function () {

    $token = individualToken();
    $user  = reminderUser();

    $fp = createRemindablePath($user, [
        'dismissed_at' => now()->subMinutes(5),
    ]);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/flood-reminders');

    $response->assertOk();

    $ids = collect($response->json('reminders'))->pluck('floodpath_id');
    expect($ids)->not->toContain($fp->id);
});

// TEST 13.4
test('reminder index does not return expired paths', function () {

    $token = individualToken();
    $user  = reminderUser();

    $fp = createRemindablePath($user, [
        'last_confirmed' => now()->subHours(10),
        'expiry'         => now()->subHours(2), // already expired
    ]);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/flood-reminders');

    $response->assertOk();

    $ids = collect($response->json('reminders'))->pluck('floodpath_id');
    expect($ids)->not->toContain($fp->id);
});

// TEST 13.5
test('reminder index does not return paths snoozed within the last hour', function () {

    $token = individualToken();
    $user  = reminderUser();

    // reminder_sent_at is recent (30 min ago) — still within the 1-hour snooze window
    $fp = createRemindablePath($user, [
        'reminder_sent_at' => now()->subMinutes(30),
    ]);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/flood-reminders');

    $response->assertOk();

    $ids = collect($response->json('reminders'))->pluck('floodpath_id');
    expect($ids)->not->toContain($fp->id);
});

// TEST 13.6
test('reminder index requires authentication', function () {

    $response = $this->getJson('/api/flood-reminders');

    $response->assertStatus(401);
});

// ── REMIND LATER ──────────────────────────────────────────────────────────────

// TEST 14.1
test('remind later snoozes the given flood paths', function () {

    $token = individualToken();
    $user  = reminderUser();

    $fp = createRemindablePath($user);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson('/api/flood-reminders/remind-later', [
        'ids' => [$fp->id],
    ]);

    $response->assertOk();

    $response->assertJson([
        'message' => 'You will be reminded again in an hour.',
        'updated' => 1,
    ]);
});

// TEST 14.2
test('remind later only updates paths owned by the authenticated user', function () {

    $token    = individualToken();
    $adminUid = env('FIREBASE_TEST_ADMIN_UID');
    $admin    = UserAuth::with('user')
        ->where('identity_uid', $adminUid)
        ->firstOrFail()
        ->user;

    // Path owned by admin — individual should not be able to snooze it
    $fp = createRemindablePath($admin);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson('/api/flood-reminders/remind-later', [
        'ids' => [$fp->id],
    ]);

    $response->assertOk();

    // updated should be 0 since the individual doesn't own this path
    $response->assertJson(['updated' => 0]);
});

// TEST 14.3
test('remind later requires ids field', function () {

    $token = individualToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson('/api/flood-reminders/remind-later', []);

    $response->assertStatus(422);

    $response->assertJsonValidationErrors(['ids']);
});

// TEST 14.4
test('remind later requires authentication', function () {

    $response = $this->postJson('/api/flood-reminders/remind-later', [
        'ids' => [1],
    ]);

    $response->assertStatus(401);
});

// ── DISMISS ───────────────────────────────────────────────────────────────────

// TEST 15.1
test('dismiss reminder sets dismissed_at on the given flood paths', function () {

    $token = individualToken();
    $user  = reminderUser();

    $fp = createRemindablePath($user);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson('/api/flood-reminders/dismiss', [
        'ids' => [$fp->id],
    ]);

    $response->assertOk();

    $response->assertJson([
        'message' => 'Reminder dismissed.',
        'updated' => 1,
    ]);
});

// TEST 15.2
test('dismiss only affects paths owned by the authenticated user', function () {

    $token    = individualToken();
    $adminUid = env('FIREBASE_TEST_ADMIN_UID');
    $admin    = UserAuth::with('user')
        ->where('identity_uid', $adminUid)
        ->firstOrFail()
        ->user;

    $fp = createRemindablePath($admin);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson('/api/flood-reminders/dismiss', [
        'ids' => [$fp->id],
    ]);

    $response->assertOk();

    $response->assertJson(['updated' => 0]);
});

// TEST 15.3
test('dismiss requires ids field', function () {

    $token = individualToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson('/api/flood-reminders/dismiss', []);

    $response->assertStatus(422);

    $response->assertJsonValidationErrors(['ids']);
});

// TEST 15.4
test('dismiss requires authentication', function () {

    $response = $this->postJson('/api/flood-reminders/dismiss', [
        'ids' => [1],
    ]);

    $response->assertStatus(401);
});