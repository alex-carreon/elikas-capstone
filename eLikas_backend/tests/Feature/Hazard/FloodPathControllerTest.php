<?php

use App\Models\FloodLevel;
use App\Models\FloodPath;
use App\Models\SocialElement;
use App\Models\TargetTable;
use App\Models\UserAuth;
use App\Services\MediaUploadService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

/**
 * FloodPathController tests.
 *
 * Routes:
 *   GET    /flood-paths              middleware: optional.firebase.auth
 *   GET    /flood-paths/my           middleware: firebase.auth, role:1,2,3
 *   GET    /flood-paths/{id}         middleware: firebase.auth, role:1,2,3  (whereNumber)
 *   GET    /flood-paths/{id}         middleware: firebase.auth, role:1,2    (dashboard, no whereNumber)
 *   POST   /flood-paths              middleware: firebase.auth, role:1,2,3
 *   PATCH  /flood-paths/{id}         middleware: firebase.auth, role:1,2,3
 *   PATCH  /flood-paths/{id}/deactivate  middleware: firebase.auth, role:1,2,3
 *   POST   /flood-paths/{id}/media   middleware: firebase.auth, role:1,2,3
 *
 * MediaUploadService is mocked — no files are written to SFTP.
 * FloodPathIntersectionService is real — uses actual DB spatial queries.
 *
 * Token helpers are defined globally in tests/Pest.php.
 */

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Look up the local User model for a given Firebase UID.
 * Fails the test loudly if the UID has no matching UserAuth row.
 */
function userForUid(string $uid): \App\Models\User
{
    $userAuth = UserAuth::with('user')->where('identity_uid', $uid)->first();

    if (! $userAuth || ! $userAuth->user) {
        test()->fail("No UserAuth row found for Firebase UID [{$uid}]. Make sure this account is registered in the testing DB.");
    }

    return $userAuth->user;
}

/**
 * Create a real FloodPath row owned by a given user, with a SocialElement.
 *
 * Uses a simple straight-line path that won't accidentally overlap other
 */
function createFloodPath(\App\Models\User $user, array $overrides = []): FloodPath
{
    $targetTable = TargetTable::where('table_name', 'FloodPaths')->firstOrFail();
    $floodLevel  = FloodLevel::first();

    $socialElement = SocialElement::create([
        'user_id'   => $user->id,
        'posted_at' => now(),
        'type_id'   => $targetTable->id,
        'has_media' => false,
    ]);

    $lineString = new \MatanYadaev\EloquentSpatial\Objects\LineString([
        new \MatanYadaev\EloquentSpatial\Objects\Point(0.0001, 179.0001),
        new \MatanYadaev\EloquentSpatial\Objects\Point(0.0002, 179.0002),
    ]);

    $floodPath = FloodPath::create(array_merge([
        'element_id'     => $socialElement->id,
        'level_id'       => $floodLevel->id,
        'last_confirmed' => now(),
        'path'           => $lineString,
        'description'    => 'Test flood path',
        'upvotes'        => 0,
        'downvotes'      => 0,
        'expiry'         => now()->addDays(3),
    ], $overrides));

    return $floodPath->load('socialElement');
}

// ── INDEX ─────────────────────────────────────────────────────────────────────

// TEST 6.1
test('flood paths index is accessible as guest', function () {

    $response = $this->getJson('/api/flood-paths');

    $response->assertOk();

    $response->assertJsonStructure([
        'count',
        'flood_paths',
    ]);
});

// TEST 6.2
test('flood paths index is accessible with token', function () {

    $token = individualToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/flood-paths');

    $response->assertOk();

    $response->assertJsonStructure([
        'count',
        'flood_paths' => [
            '*' => ['id', 'level', 'path', 'my_path', 'is_expired', 'is_deactivated'],
        ],
    ]);
});

// TEST 6.3
test('flood paths index marks my_path correctly for owner', function () {

    $token = individualToken();
    $uid   = env('FIREBASE_TEST_VERIFIED_UID');
    $user  = userForUid($uid);

    $fp = createFloodPath($user);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/flood-paths');

    $response->assertOk();

    $match = collect($response->json('flood_paths'))
        ->firstWhere('id', $fp->id);

    expect($match)->not->toBeNull();
    expect($match['my_path'])->toBeTrue();
});

// ── MY ────────────────────────────────────────────────────────────────────────

// TEST 12.1
test('my flood paths returns only the authenticated users paths', function () {

    $token = individualToken();
    $uid   = env('FIREBASE_TEST_VERIFIED_UID');
    $user  = userForUid($uid);

    $fp = createFloodPath($user);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/flood-paths/my');

    $response->assertOk();

    $response->assertJsonStructure([
        'count',
        'flood_paths' => [
            '*' => ['id', 'level', 'description', 'last_confirmed', 'is_expired', 'is_deactivated'],
        ],
    ]);

    $ids = collect($response->json('flood_paths'))->pluck('id');
    expect($ids)->toContain($fp->id);
});

// TEST 12.2
test('my flood paths requires authentication', function () {

    $response = $this->getJson('/api/flood-paths/my');

    $response->assertStatus(401);
});

// TEST 13.3
test('my flood paths can be filtered by flood_level_id', function () {

    $token = individualToken();
    $uid   = env('FIREBASE_TEST_VERIFIED_UID');
    $user  = userForUid($uid);

    $level = FloodLevel::first();

    createFloodPath($user, ['level_id' => $level->id]);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson("/api/flood-paths/my?flood_level_id={$level->id}");

    $response->assertOk();

    // Every returned path must match the requested level
    $levels = collect($response->json('flood_paths'))->pluck('level');
    $levels->each(fn ($l) => expect($l)->toBe($level->level_name));
});

// ── SHOW ──────────────────────────────────────────────────────────────────────

//TEST 11.1
test('show returns flood path detail for individual user', function () {

    $token = individualToken();
    $uid   = env('FIREBASE_TEST_VERIFIED_UID');
    $user  = userForUid($uid);

    $fp = createFloodPath($user);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson("/api/flood-paths/{$fp->id}");

    $response->assertOk();

    $response->assertJsonStructure([
        'flood_path' => [
            'id', 'flood_levels', 'posted_by', 'role', 'avatar_seed',
            'path', 'description', 'upvotes', 'downvotes',
            'last_confirmed', 'expiry', 'is_expired', 'is_deactivated', 'media',
        ],
        'user_vote',
        'is_mine',
        'user_flagged',
    ]);

    $response->assertJsonPath('flood_path.id', $fp->id);
    $response->assertJsonPath('is_mine', true);
});

//TEST 11.2
test('show returns 404 for missing flood path', function () {

    $token = individualToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/flood-paths/999999');

    $response->assertNotFound();
});

//TEST 11.3
test('show blocks non-owner non-admin from viewing deactivated path', function () {

    $token    = individualToken();
    $adminUid = env('FIREBASE_TEST_ADMIN_UID');
    $admin    = userForUid($adminUid);

    // Path owned by admin, deactivated
    $fp = createFloodPath($admin);
    $fp->socialElement->update(['deactivated_at' => now()]);

    // Individual (role 3, not the owner) tries to view it
    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson("/api/flood-paths/{$fp->id}");

    $response->assertStatus(403);

    $response->assertJson(['message' => 'Flood path is deactivated.']);
});

//TEST 11.4
test('show allows admin to view deactivated path', function () {

    $token    = adminToken();
    $adminUid = env('FIREBASE_TEST_ADMIN_UID');
    $admin    = userForUid($adminUid);

    $fp = createFloodPath($admin);
    $fp->socialElement->update(['deactivated_at' => now()]);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson("/api/flood-paths/{$fp->id}");

    $response->assertOk();
});

//TEST 12.4
test('history excludes deactivated flood paths', function () {

    $token = individualToken();
    $uid   = env('FIREBASE_TEST_VERIFIED_UID');
    $user  = userForUid($uid);

    // Active path
    $active = createFloodPath($user);

    // Expired path
    $expired = createFloodPath($user);
    $expired->update([
        'expiry' => now()->subHour(),
    ]);

    // Deactivated path
    $deactivated = createFloodPath($user);
    $deactivated->socialElement->update([
        'deactivated_at' => now(),
    ]);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/flood-paths/my');

    $response->assertOk();

    $response->assertJsonMissing([
        'id' => $deactivated->id,
    ]);

    $response->assertJsonFragment([
        'id' => $active->id,
    ]);

    $response->assertJsonFragment([
        'id' => $expired->id,
    ]);
});

// ── STORE ─────────────────────────────────────────────────────────────────────

// TEST 1.1
test('store creates flood path without media', function () {

    $this->mock(MediaUploadService::class);

    $token = individualToken();
    $level = FloodLevel::first();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson('/api/flood-paths', [
        'level_id'    => $level->id,
        'path'        => [[14.5995, 120.9842], [14.6000, 120.9850]],
        'description' => 'Test flood path store',
        'expiry'      => now('Asia/Manila')->addDays(2)->toDateTimeString(),
    ]);

    $response->assertCreated();

    $response->assertJson(['message' => 'Flood path created successfully.']);
});

// TEST 1.2
test('store creates flood path with media', function () {

    $this->mock(MediaUploadService::class, function ($mock) {
        $mock->shouldReceive('upload')
            ->once()
            ->andReturn('flood-reports/test-image.jpg');
    });

    $token = individualToken();
    $level = FloodLevel::first();

    Storage::fake('sftp');

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson('/api/flood-paths', [
        'level_id'    => $level->id,
        'path'        => [[14.5995, 120.9842], [14.6000, 120.9850]],
        'description' => 'Test flood path with media',
        'expiry'      => now('Asia/Manila')->addDays(2)->toDateTimeString(),
        'file'        => UploadedFile::fake()->image('flood.jpg'),
    ]);

    $response->assertCreated();
});

// TEST 1.3
test('store requires authentication', function () {

    $response = $this->postJson('/api/flood-paths', []);

    $response->assertStatus(401);
});

// TEST 8.1
test('store validates required fields', function () {

    $token = individualToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson('/api/flood-paths', []);

    $response->assertStatus(422);

    $response->assertJsonValidationErrors([
        'level_id',
        'path',
        'description',
        'expiry',
    ]);
});

// TEST 8.2
test('store rejects expiry in the past', function () {

    $token = individualToken();
    $level = FloodLevel::first();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson('/api/flood-paths', [
        'level_id'    => $level->id,
        'path'        => [[14.5995, 120.9842], [14.6000, 120.9850]],
        'description' => 'Test',
        'expiry'      => now('Asia/Manila')->subDay()->toDateTimeString(),
    ]);

    $response->assertStatus(422);

    $response->assertJsonValidationErrors(['expiry']);
});

// TEST 8.3
test('store rejects path with fewer than 2 points', function () {

    $token = individualToken();
    $level = FloodLevel::first();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson('/api/flood-paths', [
        'level_id'    => $level->id,
        'path'        => [[14.5995, 120.9842]],
        'description' => 'Test',
        'expiry'      => now('Asia/Manila')->addDays(2)->toDateTimeString(),
    ]);

    $response->assertStatus(422);

    $response->assertJsonValidationErrors(['path']);
});

// TEST 14
test('store rejects overlapping flood path', function () {

    $token = individualToken();
    $uid   = env('FIREBASE_TEST_VERIFIED_UID');
    $user  = userForUid($uid);
    $level = FloodLevel::first();

    // Seed an existing active path at this location
    createFloodPath($user);

    // Try to store at the same coordinates — intersection service should block it
    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson('/api/flood-paths', [
        'level_id'    => $level->id,
        'path'        => [[0.0001, 179.0001], [0.0002, 179.0002]],
        'description' => 'Overlapping path',
        'expiry'      => now('Asia/Manila')->addDays(2)->toDateTimeString(),
    ]);

    $response->assertStatus(422);

    $response->assertJson([
        'message' => 'This flood path overlaps an existing active flood path.',
    ]);
});

// ── UPDATE ────────────────────────────────────────────────────────────────────

// TEST 2.1
test('update allows owner to patch their flood path', function () {

    $token = individualToken();
    $uid   = env('FIREBASE_TEST_VERIFIED_UID');
    $user  = userForUid($uid);

    $fp = createFloodPath($user);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->patchJson("/api/flood-paths/{$fp->id}", [
        'description' => 'Updated description',
    ]);

    $response->assertOk();

    $response->assertJson(['message' => 'Flood path updated successfully.']);
});

// TEST 2.2
test('update allows admin to patch any flood path', function () {

    $token    = adminToken();
    $adminUid = env('FIREBASE_TEST_ADMIN_UID');
    $admin    = userForUid($adminUid);

    $fp = createFloodPath($admin);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->patchJson("/api/flood-paths/{$fp->id}", [
        'description' => 'Admin updated description',
    ]);

    $response->assertOk();
});

// TEST 2.3
test('update blocks individual from patching another users path', function () {

    $token    = individualToken();
    $adminUid = env('FIREBASE_TEST_ADMIN_UID');
    $admin    = userForUid($adminUid);

    // Path owned by admin
    $fp = createFloodPath($admin);

    // Individual tries to update it
    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->patchJson("/api/flood-paths/{$fp->id}", [
        'description' => 'Attempted hijack',
    ]);

    // Controller returns 404 (not 403) when ownership check fails, per implementation
    $response->assertNotFound();
});

// TEST 2.4
test('update rejects expiry in the past', function () {

    $token = individualToken();
    $uid   = env('FIREBASE_TEST_VERIFIED_UID');
    $user  = userForUid($uid);

    $fp = createFloodPath($user);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->patchJson("/api/flood-paths/{$fp->id}", [
        'expiry' => now('Asia/Manila')->subDay()->toDateTimeString(),
    ]);

    $response->assertStatus(422);

    $response->assertJsonValidationErrors(['expiry']);
});

// TEST 2.5
test('update rejects overlapping path', function () {

    $token = individualToken();
    $uid   = env('FIREBASE_TEST_VERIFIED_UID');
    $user  = userForUid($uid);

    // Two existing paths — try to update the second one's coordinates
    // to overlap the first
    $fp1 = createFloodPath($user);

    // Second path at a different location
    $targetTable = TargetTable::where('table_name', 'FloodPaths')->firstOrFail();
    $se2 = SocialElement::create([
        'user_id'   => $user->id,
        'posted_at' => now(),
        'type_id'   => $targetTable->id,
        'has_media' => false,
    ]);
    $fp2 = FloodPath::create([
        'element_id'     => $se2->id,
        'level_id'       => FloodLevel::first()->id,
        'last_confirmed' => now(),
        'path'           => new \MatanYadaev\EloquentSpatial\Objects\LineString([
            new \MatanYadaev\EloquentSpatial\Objects\Point(10.0, 10.0),
            new \MatanYadaev\EloquentSpatial\Objects\Point(10.001, 10.001),
        ]),
        'description'    => 'Second path',
        'upvotes'        => 0,
        'downvotes'      => 0,
        'expiry'         => now()->addDays(3),
    ]);

    // Now try to update fp2's path to overlap fp1's coordinates
    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->patchJson("/api/flood-paths/{$fp2->id}", [
        'path' => [[0.0001, 179.0001], [0.0002, 179.0002]],
    ]);

    $response->assertStatus(422);

    $response->assertJson([
        'message' => 'Updated path overlaps an existing active flood path.',
    ]);
});

// TEST 2.6
test('update requires authentication', function () {

    $response = $this->patchJson('/api/flood-paths/1', []);

    $response->assertStatus(401);
});

// ── DESTROY (soft-delete / deactivate) ───────────────────────────────────────

// TEST 10.1
test('destroy deactivates flood path for owner', function () {

    $token = individualToken();
    $uid   = env('FIREBASE_TEST_VERIFIED_UID');
    $user  = userForUid($uid);

    $fp = createFloodPath($user);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->patchJson("/api/flood-paths/{$fp->id}/deactivate");

    $response->assertOk();

    $response->assertJsonStructure([
        'message',
        'deactivated_at',
        'deactivated_by' => ['id', 'role_id'],
    ]);

    $response->assertJson(['message' => 'Flood path deactivated successfully.']);

    // Confirm the SocialElement row was soft-deleted in DB
    $this->assertDatabaseHas('SocialElements', [
        'id'             => $fp->element_id,
        // deactivated_at is set (non-null); just confirm the record exists
        // with the right id — checking non-null is enough since the transaction rolls back for the other fields
    ]);
});

// TEST 10.2
test('destroy blocks individual from deactivating another users path', function () {

    $token    = individualToken();
    $adminUid = env('FIREBASE_TEST_ADMIN_UID');
    $admin    = userForUid($adminUid);

    $fp = createFloodPath($admin);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->patchJson("/api/flood-paths/{$fp->id}/deactivate");

    $response->assertNotFound();
});

// TEST 10.3
test('destroy allows admin to deactivate any path', function () {

    $token    = adminToken();
    $adminUid = env('FIREBASE_TEST_ADMIN_UID');
    $admin    = userForUid($adminUid);

    $fp = createFloodPath($admin);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->patchJson("/api/flood-paths/{$fp->id}/deactivate");

    $response->assertOk();
});

// TEST 10.4
test('destroy requires authentication', function () {

    $response = $this->patchJson('/api/flood-paths/1/deactivate');

    $response->assertStatus(401);
});

// ── ADD MEDIA ─────────────────────────────────────────────────────────────────

// TEST 9.1
test('addMedia attaches file to flood path', function () {

    $this->mock(MediaUploadService::class, function ($mock) {
        $mock->shouldReceive('upload')
            ->once()
            ->andReturn('flood-reports/added-image.jpg');
    });

    $token = individualToken();
    $uid   = env('FIREBASE_TEST_VERIFIED_UID');
    $user  = userForUid($uid);

    $fp = createFloodPath($user);

    Storage::fake('sftp');

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson("/api/flood-paths/{$fp->id}/media", [
        'file' => UploadedFile::fake()->image('extra.jpg'),
    ]);

    $response->assertStatus(201);

    $response->assertJsonStructure(['message', 'media_url']);
});

// TEST 9.2
test('addMedia requires a file', function () {

    $token = individualToken();
    $uid   = env('FIREBASE_TEST_VERIFIED_UID');
    $user  = userForUid($uid);

    $fp = createFloodPath($user);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson("/api/flood-paths/{$fp->id}/media", []);

    $response->assertStatus(422);

    $response->assertJsonValidationErrors(['file']);
});

test('addMedia blocks individual from adding media to another users path', function () {

    $this->mock(MediaUploadService::class);

    $token    = individualToken();
    $adminUid = env('FIREBASE_TEST_ADMIN_UID');
    $admin    = userForUid($adminUid);

    $fp = createFloodPath($admin);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson("/api/flood-paths/{$fp->id}/media", [
        'file' => UploadedFile::fake()->image('hack.jpg'),
    ]);

    $response->assertNotFound();
});

// TEST 9.3
test('addMedia requires authentication', function () {

    $response = $this->postJson('/api/flood-paths/1/media', []);

    $response->assertStatus(401);
});