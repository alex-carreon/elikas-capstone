<?php

use App\Models\FloodLevel;
use App\Models\FloodPath;
use App\Models\SocialElement;
use App\Models\TargetTable;
use App\Models\User;
use App\Models\UserAuth;

/**
 * FloodPathAdminController tests.
 *
 * Routes:
 *   GET /admin/flood-paths   middleware: firebase.auth, role:1,2
 * *
 * Token helpers (adminToken, govopsToken, individualToken) are in tests/Pest.php.
 */

// ── Helpers ───────────────────────────────────────────────────────────────────

function adminUser(): User
{
    $uid      = env('FIREBASE_TEST_ADMIN_UID');
    $userAuth = UserAuth::with('user')->where('identity_uid', $uid)->first();

    if (! $userAuth || ! $userAuth->user) {
        test()->fail("No UserAuth row found for FIREBASE_TEST_ADMIN_UID [{$uid}].");
    }

    return $userAuth->user;
}

/**
 * Create a FloodPath owned by the given user.
 * Uses a remote Pacific Ocean coordinate to avoid clashing with real data.
 * Increments the coordinate slightly per call using a static counter so
 * multiple paths in one test don't overlap each other.
 */
function createAdminFloodPath(User $user, array $overrides = []): FloodPath
{
    static $offset = 0;
    $offset += 0.001;

    $targetTable = TargetTable::where('table_name', 'FloodPaths')->firstOrFail();
    $floodLevel  = FloodLevel::first();

    $socialElement = SocialElement::create([
        'user_id'   => $user->id,
        'posted_at' => now(),
        'type_id'   => $targetTable->id,
        'has_media' => false,
    ]);

    $lat1 = round(2.0 + $offset, 6);
    $lat2 = round(2.0 + $offset + 0.0001, 6);

    $floodPath = FloodPath::create(array_merge([
        'element_id'     => $socialElement->id,
        'level_id'       => $floodLevel->id,
        'last_confirmed' => now(),
        'path'           => new \MatanYadaev\EloquentSpatial\Objects\LineString([
            new \MatanYadaev\EloquentSpatial\Objects\Point($lat1, 171.0),
            new \MatanYadaev\EloquentSpatial\Objects\Point($lat2, 171.0001),
        ]),
        'description'    => 'Admin test flood path',
        'upvotes'        => 0,
        'downvotes'      => 0,
        'expiry'         => now()->addDays(3),
    ], $overrides));

    return $floodPath->load('socialElement');
}

// ── INDEX ─────────────────────────────────────────────────────────────────────

// TEST 6.4
test('admin flood paths index returns all paths for admin', function () {

    $token = adminToken();
    $user  = adminUser();

    createAdminFloodPath($user);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/admin/flood-paths');

    $response->assertOk();

    $response->assertJsonStructure([
        'count',
        'flood_paths' => [
            '*' => [
                'id',
                'description',
                'level',
                'posted_at',
                'is_expired',
                'is_deactivated',
                'is_user_deactivated',
            ],
        ],
    ]);
});

// TEST 6.5
test('admin flood paths index blocks individual users', function () {

    $token = individualToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/admin/flood-paths');

    $response->assertStatus(403);
});

// TEST 6.6
test('admin flood paths index requires authentication', function () {

    $response = $this->getJson('/api/admin/flood-paths');

    $response->assertStatus(401);
});

// ── FILTER: flood_level_id ────────────────────────────────────────────────────

// TEST 6.7
test('admin index filters by flood_level_id', function () {

    $token = adminToken();
    $user  = adminUser();

    $levels = FloodLevel::orderBy('id')->take(2)->get();

    // Create one path per level
    $fp1 = createAdminFloodPath($user, ['level_id' => $levels[0]->id]);
    $fp2 = createAdminFloodPath($user, ['level_id' => $levels[1]->id]);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson("/api/admin/flood-paths?flood_level_id={$levels[0]->id}");

    $response->assertOk();

    $ids = collect($response->json('flood_paths'))->pluck('id');

    expect($ids)->toContain($fp1->id);
    expect($ids)->not->toContain($fp2->id);
});

// ── FILTER: is_expired ────────────────────────────────────────────────────────

// TEST 6.8
test('admin index filters expired paths with is_expired=true', function () {

    $token = adminToken();
    $user  = adminUser();

    $expired    = createAdminFloodPath($user, ['expiry' => now()->subHour()]);
    $notExpired = createAdminFloodPath($user, ['expiry' => now()->addDays(3)]);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/admin/flood-paths?is_expired=true');

    $response->assertOk();

    $ids = collect($response->json('flood_paths'))->pluck('id');

    expect($ids)->toContain($expired->id);
    expect($ids)->not->toContain($notExpired->id);
});

// TEST 6.9
test('admin index filters active paths with is_expired=false', function () {

    $token = adminToken();
    $user  = adminUser();

    $expired    = createAdminFloodPath($user, ['expiry' => now()->subHour()]);
    $notExpired = createAdminFloodPath($user, ['expiry' => now()->addDays(3)]);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/admin/flood-paths?is_expired=false');

    $response->assertOk();

    $ids = collect($response->json('flood_paths'))->pluck('id');

    expect($ids)->not->toContain($expired->id);
    expect($ids)->toContain($notExpired->id);
});

// ── FILTER: is_deactivated ────────────────────────────────────────────────────

// TEST 6.10
test('admin index filters deactivated paths with is_deactivated=true', function () {

    $token = adminToken();
    $user  = adminUser();

    $active      = createAdminFloodPath($user);
    $deactivated = createAdminFloodPath($user);
    $deactivated->socialElement->update(['deactivated_at' => now()]);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/admin/flood-paths?is_deactivated=true');

    $response->assertOk();

    $ids = collect($response->json('flood_paths'))->pluck('id');

    expect($ids)->toContain($deactivated->id);
    expect($ids)->not->toContain($active->id);
});

// TEST 6.11
test('admin index filters active paths with is_deactivated=false', function () {

    $token = adminToken();
    $user  = adminUser();

    $active      = createAdminFloodPath($user);
    $deactivated = createAdminFloodPath($user);
    $deactivated->socialElement->update(['deactivated_at' => now()]);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/admin/flood-paths?is_deactivated=false');

    $response->assertOk();

    $ids = collect($response->json('flood_paths'))->pluck('id');

    expect($ids)->toContain($active->id);
    expect($ids)->not->toContain($deactivated->id);
});

// TEST 6.12
test('admin index marks is_user_deactivated true when owner account is deactivated', function () {

    $token = adminToken();
    $user  = adminUser();

    // Create a second throwaway user via factory and deactivate them
    $deactivatedUser = User::factory()->create(['deactivated_at' => now()]);
    $fp = createAdminFloodPath($deactivatedUser);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/admin/flood-paths?is_deactivated=true');

    $response->assertOk();

    $match = collect($response->json('flood_paths'))->firstWhere('id', $fp->id);

    expect($match)->not->toBeNull();
    expect($match['is_user_deactivated'])->toBeTrue();
});

// ── COMBINED FILTERS ──────────────────────────────────────────────────────────

// TEST 6.13
test('admin index supports combining flood_level_id and is_expired filters', function () {

    $token = adminToken();
    $user  = adminUser();

    $level = FloodLevel::first();

    $match    = createAdminFloodPath($user, [
        'level_id' => $level->id,
        'expiry'   => now()->subHour(),
    ]);

    $noMatch = createAdminFloodPath($user, [
        'level_id' => $level->id,
        'expiry'   => now()->addDays(3),
    ]);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson("/api/admin/flood-paths?flood_level_id={$level->id}&is_expired=true");

    $response->assertOk();

    $ids = collect($response->json('flood_paths'))->pluck('id');

    expect($ids)->toContain($match->id);
    expect($ids)->not->toContain($noMatch->id);
});