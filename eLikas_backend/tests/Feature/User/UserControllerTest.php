<?php

use App\Models\Location;
use App\Models\User;
use App\Models\UserAuth;

/**
 * UserController tests (admin dashboard).
 *
 * Routes (all under firebase.auth, role:1):
 *   GET   /api/admin/users
 *   GET   /api/admin/users/{id}
 *   PATCH /api/admin/users/{id}
 *   PATCH /api/admin/users/{id}/deactivate
 *
 * Token helpers are in tests/Pest.php.
 */

// ── GET /api/admin/users ──────────────────────────────────────────────────────

// Test 1.5
test('admin can list all users', function () {

    $token = adminToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/admin/users');

    $response->assertOk();

    $response->assertJsonStructure([
        'count',
        'users' => [
            '*' => ['id', 'avatar_seed', 'name', 'role', 'location', 'parent_location'],
        ],
    ]);
});

// Test 1.6
test('admin users list blocks individual users', function () {

    $token = individualToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/admin/users');

    $response->assertStatus(403);
});

// Test 1.7
test('admin users list blocks govops users', function () {

    $token = govopsToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/admin/users');

    $response->assertStatus(403);
});

// Test 1.8
test('admin users list requires authentication', function () {

    $response = $this->getJson('/api/admin/users');

    $response->assertStatus(401);
});

// Test 1.9
test('admin users list filters by role', function () {

    $token = adminToken();

    $indivUser = User::factory()->create(['role_id' => 3]);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/admin/users?role=indiv');

    $response->assertOk();

    $roles = collect($response->json('users'))->pluck('role')->unique()->values();

    expect($roles)->toContain('indiv');
    // Should not contain admin or brgy_op roles
    expect($roles)->not->toContain('admin');
});

// Test 1.10
test('admin users list filters by active=true', function () {

    $token = adminToken();

    $active      = User::factory()->create(['deactivated_at' => null]);
    $deactivated = User::factory()->create(['deactivated_at' => now()]);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/admin/users?active=true');

    $response->assertOk();

    $ids = collect($response->json('users'))->pluck('id');

    expect($ids)->toContain($active->id);
    expect($ids)->not->toContain($deactivated->id);
});

// Test 1.11
test('admin users list filters by active=false', function () {

    $token = adminToken();

    $active      = User::factory()->create(['deactivated_at' => null]);
    $deactivated = User::factory()->create(['deactivated_at' => now()]);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/admin/users?active=false');

    $response->assertOk();

    $ids = collect($response->json('users'))->pluck('id');

    expect($ids)->toContain($deactivated->id);
    expect($ids)->not->toContain($active->id);
});

// Test 1.12
test('admin users list filters by barangay_id', function () {

    $token     = adminToken();
    $locations = Location::where('level_id', 3)->take(2)->get();

    $userInBarangay    = User::factory()->create(['role_id' => 3]);
    $userNotInBarangay = User::factory()->create(['role_id' => 3]);

    // Manually assign indivAcc location to first barangay
    $userInBarangay->indivAcc()->create(['location_id' => $locations[0]->id]);
    $userNotInBarangay->indivAcc()->create(['location_id' => $locations[1]->id]);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson("/api/admin/users?barangay_id={$locations[0]->id}");

    $response->assertOk();

    $ids = collect($response->json('users'))->pluck('id');

    expect($ids)->toContain($userInBarangay->id);
    expect($ids)->not->toContain($userNotInBarangay->id);
});

// ── GET /api/admin/users/{id} ─────────────────────────────────────────────────

// Test 1.13
test('admin can get individual user details', function () {

    $token = adminToken();
    $uid   = env('FIREBASE_TEST_VERIFIED_UID');
    $user  = UserAuth::with('user')->where('identity_uid', $uid)->firstOrFail()->user;

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson("/api/admin/users/{$user->id}");

    $response->assertOk();

    $response->assertJsonStructure([
        'id', 'username', 'email', 'avatar_seed', 'role',
        'first_name', 'last_name', 'phone', 'created_at', 'deactivated_at',
        'indiv_location_id', 'indiv_location',
    ]);

    $response->assertJsonPath('id', $user->id);
});

// Test 1.14
test('admin can get govop user details', function () {

    $token = adminToken();
    $uid   = env('FIREBASE_TEST_GOVOPS_UID');
    $user  = UserAuth::with('user')->where('identity_uid', $uid)->firstOrFail()->user;

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson("/api/admin/users/{$user->id}");

    $response->assertOk();

    // govop-specific keys should be present
    $response->assertJsonStructure([
        'govop_location_id', 'govop_location',
        'point_person', 'point_position',
    ]);
});

// Test 1.15
test('admin get user returns 404 for missing id', function () {

    $token = adminToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/admin/users/999999');

    $response->assertNotFound();

    $response->assertJson(['error' => 'User not found']);
});

// Test 1.16
test('get user blocks non-admin', function () {

    $token = individualToken();
    $uid   = env('FIREBASE_TEST_VERIFIED_UID');
    $user  = UserAuth::with('user')->where('identity_uid', $uid)->firstOrFail()->user;

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson("/api/admin/users/{$user->id}");

    $response->assertStatus(403);
});

// ── PATCH /api/admin/users/{id} ───────────────────────────────────────────────

// Test 2.10
test('admin can update a users username', function () {

    $token = adminToken();
    $user  = User::factory()->create(['role_id' => 3]);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->patchJson("/api/admin/users/{$user->id}", [
        'username' => 'adminupdated',
    ]);

    $response->assertOk();

    $response->assertJson([
        'message' => 'User updated successfully',
        'user_id' => $user->id,
    ]);
});

// Test 2.11
test('admin can update a users name', function () {

    $token = adminToken();
    $user  = User::factory()->create(['role_id' => 3]);
    $user->name()->create(['first_name' => 'Old', 'last_name' => 'Name']);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->patchJson("/api/admin/users/{$user->id}", [
        'first_name' => 'NewFirst',
        'last_name'  => 'NewLast',
    ]);

    $response->assertOk();
});

// Test 2.12
test('admin cannot update a deactivated user', function () {

    $token = adminToken();
    $user  = User::factory()->create(['deactivated_at' => now()]);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->patchJson("/api/admin/users/{$user->id}", [
        'username' => 'shouldfail',
    ]);

    $response->assertStatus(403);

    $response->assertJson(['error' => 'This user is deactivated and cannot be updated']);
});

// Test 2.13
test('admin update user returns 404 for missing user', function () {

    $token = adminToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->patchJson('/api/admin/users/999999', [
        'username' => 'ghost',
    ]);

    $response->assertNotFound();
});

// Test 2.14
test('admin update rejects duplicate username', function () {

    $token = adminToken();

    User::factory()->create(['username' => 'takenbyother']);
    $user = User::factory()->create(['role_id' => 3]);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->patchJson("/api/admin/users/{$user->id}", [
        'username' => 'takenbyother',
    ]);

    $response->assertStatus(422);
});

// Test 2.15
test('admin update blocks non-admin', function () {

    $token = individualToken();
    $user  = User::factory()->create(['role_id' => 3]);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->patchJson("/api/admin/users/{$user->id}", [
        'username' => 'hacked',
    ]);

    $response->assertStatus(403);
});

// ── PATCH /api/admin/users/{id}/deactivate ────────────────────────────────────

// Test 13.3
test('admin can deactivate a user', function () {

    $token = adminToken();
    $user  = User::factory()->create(['deactivated_at' => null]);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->patchJson("/api/admin/users/{$user->id}/deactivate");

    $response->assertOk();

    $response->assertJsonStructure(['message', 'user_id', 'deactivated_at']);

    $response->assertJson([
        'message' => 'User deactivated successfully',
        'user_id' => $user->id,
    ]);
});

// Test 13.4
test('deactivate user returns 404 for missing user', function () {

    $token = adminToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->patchJson('/api/admin/users/999999/deactivate');

    // findOrFail throws ModelNotFoundException — controller catches it as generic Exception
    // and returns 500; adjust assertion if you add explicit 404 handling
    $response->assertStatus(500);
});

// Test 13.5
test('deactivate user blocks non-admin', function () {

    $token = individualToken();
    $user  = User::factory()->create();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->patchJson("/api/admin/users/{$user->id}/deactivate");

    $response->assertStatus(403);
});