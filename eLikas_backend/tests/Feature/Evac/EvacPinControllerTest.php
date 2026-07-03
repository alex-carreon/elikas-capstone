<?php

use App\Models\EvacArea;
use App\Models\Location;
use App\Models\SocialElement;
use App\Models\TargetTable;
use App\Models\User;
use App\Models\UserAuth;
use App\Services\MediaUploadService;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use MatanYadaev\EloquentSpatial\Objects\Point;

/**
 * Evac Pin endpoint tests.
 *
 * Controllers covered:
 *   GetEvacAreasController       GET /api/pins, /api/pins/my-coords,
 *                                    /api/evacpins/users, /api/evacpins/users/history,
 *                                    /api/admin/pins
 *   GetEvacAreaDetailsController GET /api/pins/{id}
 *   StoreEvacuationAreaController    POST /api/pins
 *   UpdateEvacuationAreaController   PUT  /api/pins/{id}
 *   DeleteEvacuationAreaController   PATCH /api/pins/{id}/deactivate
 *                                    PATCH /api/pins/{id}/restore
 *   VerifyEvacuationAreaController   PATCH /api/pins/{id}/verify
 *   CapacityLevelController          GET /api/capacity-levels
 *   EvacTypeController               GET /api/evac-types
 *
 * MediaUploadService is mocked — no SFTP writes.
 * Token helpers are in tests/Pest.php.
 *
 * Required .env.testing:
 *   FIREBASE_TEST_VERIFIED_UID
 *   FIREBASE_TEST_ADMIN_UID
 *   FIREBASE_TEST_GOVOPS_UID
 */

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Resolve a local User from a Firebase UID stored in .env.testing.
 */
function evacUserForUid(string $uid): User
{
    $userAuth = UserAuth::with('user')->where('identity_uid', $uid)->first();

    if (! $userAuth || ! $userAuth->user) {
        test()->fail("No UserAuth row found for Firebase UID [{$uid}]. Ensure this account is registered in the testing DB.");
    }

    return $userAuth->user;
}

/**
 * Create a minimal EvacArea owned by the given user.
 * Uses a real Location row (first barangay-level location found).
 * Coordinates placed in a remote Pacific location to avoid conflicts.
 */
function createEvacPin(User $owner, array $overrides = []): EvacArea
{
    static $offset = 0;
    $offset += 0.001;

    // type_id 1 is assumed to be EvacAreas — adjust if your TargetTables differ
    $socialElement = SocialElement::create([
        'user_id'   => $owner->id,
        'posted_at' => now(),
        'type_id'   => 1,
        'has_media' => false,
    ]);

    $location = Location::where('level_id', 3)->first();

    $lat = round(8.0 + $offset, 6);
    $lng = round(173.0 + $offset, 6);

    $evacType      = \Illuminate\Support\Facades\DB::table('EvacTypes')->first();
    $capacityLevel = \Illuminate\Support\Facades\DB::table('CapacityLevels')->first();

    $pin = EvacArea::create(array_merge([
        'element_id'    => $socialElement->id,
        'location_id'   => $location->id,
        'location'      => new Point($lat, $lng),
        'area_type'     => $evacType->id,
        'address'       => 'Test Address',
        'name'          => 'Test Evac Area',
        'capacity_level'=> $capacityLevel->id,
        'last_updated'  => now(),
        'is_persistent' => false,
        'for_reg_flood' => false,
        'for_heavy_flood'=> false,
        'has_accom'     => false,
        'has_DRRMO'     => false,
        'has_health'    => false,
        'pwd_friendly'  => false,
        'has_catchment' => false,
        'expiry'        => now()->addDays(3),
    ], $overrides));

    return $pin->load('social_element');
}

/**
 * Minimal valid store payload — override fields as needed per test.
 */
function baseStorePayload(array $overrides = []): array
{
    $location      = Location::where('level_id', 3)->first();
    $evacType      = \Illuminate\Support\Facades\DB::table('EvacTypes')->first();
    $capacityLevel = \Illuminate\Support\Facades\DB::table('CapacityLevels')->first();

    return array_merge([
        'name'          => 'New Evac Area',
        'address'       => '123 Test St',
        'lat'           => 14.5995,
        'lng'           => 120.9842,
        'location_id'   => $location->id,
        'area_type'     => $evacType->id,
        'capacity_level'=> $capacityLevel->id,
        'is_persistent' => false,
    ], $overrides);
}

// ── CAPACITY LEVELS ───────────────────────────────────────────────────────────

// Test 11.1
test('capacity levels index returns all levels publicly', function () {

    $response = $this->getJson('/api/capacity-levels');

    $response->assertOk();

    $response->assertJsonStructure([
        '*' => ['id', 'capacity_level'],
    ]);
});

// ── EVAC TYPES ────────────────────────────────────────────────────────────────

// TEST 11.2
test('evac types index returns all types publicly', function () {

    $response = $this->getJson('/api/evac-types');

    $response->assertOk();

    $response->assertJsonStructure([
        '*' => ['id', 'evac_type'],
    ]);
});

// ── GET /api/pins (public, optional auth) ─────────────────────────────────────

// TEST 7.1
test('pins index is accessible as guest', function () {

    $response = $this->getJson('/api/pins');

    $response->assertOk();

    $response->assertJsonStructure(['count', 'pins']);
});

// TEST 7.2
test('pins index is accessible with token', function () {

    $token = individualToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/pins');

    $response->assertOk();

    $response->assertJsonStructure([
        'count',
        'pins' => [
            '*' => ['id', 'lat', 'lng', 'my_pin'],
        ],
    ]);
});

// TEST 7.3
test('pins index marks my_pin correctly for owner', function () {

    $token = individualToken();
    $user  = evacUserForUid(env('FIREBASE_TEST_VERIFIED_UID'));
    $pin   = createEvacPin($user);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/pins');

    $response->assertOk();

    $match = collect($response->json('pins'))->firstWhere('id', $pin->id);

    expect($match)->not->toBeNull();
    expect($match['my_pin'])->toBeTrue();
});

// TEST 7.4
test('pins index returns only active pins by default', function () {

    $user        = evacUserForUid(env('FIREBASE_TEST_VERIFIED_UID'));
    $activePin   = createEvacPin($user);
    $deactivated = createEvacPin($user);
    $deactivated->social_element->update(['deactivated_at' => now()]);

    $response = $this->getJson('/api/pins');

    $response->assertOk();

    $ids = collect($response->json('pins'))->pluck('id');

    expect($ids)->toContain($activePin->id);
    expect($ids)->not->toContain($deactivated->id);
});

// TEST 7.5
test('pins index with active=false returns only inactive pins', function () {

    $user        = evacUserForUid(env('FIREBASE_TEST_VERIFIED_UID'));
    $activePin   = createEvacPin($user);
    $deactivated = createEvacPin($user);
    $deactivated->social_element->update(['deactivated_at' => now()]);

    $response = $this->getJson('/api/pins?active=false');

    $response->assertOk();

    $ids = collect($response->json('pins'))->pluck('id');

    expect($ids)->toContain($deactivated->id);
    expect($ids)->not->toContain($activePin->id);
});

// TEST 7.6
test('pins index rejects invalid active value', function () {

    $response = $this->getJson('/api/pins?active=maybe');

    $response->assertStatus(422);

    $response->assertJson(['error' => 'Invalid active value. Use true or false.']);
});

// TEST 7.7
test('pins index filters by role', function () {

    $indivUser = evacUserForUid(env('FIREBASE_TEST_VERIFIED_UID'));
    $adminUser = evacUserForUid(env('FIREBASE_TEST_ADMIN_UID'));

    $indivPin = createEvacPin($indivUser);
    $adminPin = createEvacPin($adminUser);

    $response = $this->getJson('/api/pins?role=indiv');

    $response->assertOk();

    $ids = collect($response->json('pins'))->pluck('id');

    expect($ids)->toContain($indivPin->id);
    expect($ids)->not->toContain($adminPin->id);
});

// TEST 7.8
test('pins index rejects invalid role value', function () {

    $response = $this->getJson('/api/pins?role=superuser');

    $response->assertStatus(422);

    $response->assertJson(['error' => 'Invalid role filter. Accepted values: admin, govop, indiv']);
});

// TEST 7.9
test('pins index filters by is_persistent', function () {

    $user       = evacUserForUid(env('FIREBASE_TEST_VERIFIED_UID'));
    $persistent = createEvacPin($user, ['is_persistent' => true, 'expiry' => null]);
    $adhoc      = createEvacPin($user, ['is_persistent' => false]);

    $response = $this->getJson('/api/pins?is_persistent=true');

    $response->assertOk();

    $ids = collect($response->json('pins'))->pluck('id');

    expect($ids)->toContain($persistent->id);
    expect($ids)->not->toContain($adhoc->id);
});

// TEST 7.10
test('pins index filters by barangay', function () {

    $user      = evacUserForUid(env('FIREBASE_TEST_VERIFIED_UID'));
    $locations = Location::where('level_id', 3)->take(2)->get();

    $pin1 = createEvacPin($user, ['location_id' => $locations[0]->id]);
    $pin2 = createEvacPin($user, ['location_id' => $locations[1]->id]);

    $response = $this->getJson("/api/pins?barangay={$locations[0]->id}");

    $response->assertOk();

    $ids = collect($response->json('pins'))->pluck('id');

    expect($ids)->toContain($pin1->id);
    expect($ids)->not->toContain($pin2->id);
});

// TEST 7.11
test('pins index filters by search term', function () {

    $user = evacUserForUid(env('FIREBASE_TEST_VERIFIED_UID'));

    createEvacPin($user, ['name' => 'Unique Searchable Name XYZ']);

    $response = $this->getJson('/api/pins?search=Unique+Searchable+Name+XYZ');

    $response->assertOk();

    expect($response->json('count'))->toBeGreaterThanOrEqual(1);
});

// ── GET /api/pins/my-coords (auth required, role:1,2,3) ───────────────────────

// TEST 7.12
test('my-coords returns only the authenticated users pins', function () {

    $token     = individualToken();
    $user      = evacUserForUid(env('FIREBASE_TEST_VERIFIED_UID'));
    $otherUser = evacUserForUid(env('FIREBASE_TEST_ADMIN_UID'));

    $myPin    = createEvacPin($user);
    $otherPin = createEvacPin($otherUser);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/pins/my-coords');

    $response->assertOk();

    $ids = collect($response->json('pins'))->pluck('id');

    expect($ids)->toContain($myPin->id);
    expect($ids)->not->toContain($otherPin->id);
});

// Test 7.13
test('my-coords response shape includes status and location fields', function () {

    $token = individualToken();
    $user  = evacUserForUid(env('FIREBASE_TEST_VERIFIED_UID'));

    createEvacPin($user);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/pins/my-coords');

    $response->assertOk();

    $response->assertJsonStructure([
        'count',
        'pins' => [
            '*' => ['id', 'lat', 'lng', 'location_id', 'location_name', 'is_persistent', 'status', 'my_pin'],
        ],
    ]);
});

// Test 7.14
test('my-coords requires authentication', function () {

    $response = $this->getJson('/api/pins/my-coords');

    $response->assertStatus(401);
});

// ── GET /api/evacpins/users & /api/evacpins/users/history (auth required) ─────

// Test 12.1
test('evac history requires authentication', function () {

    $response = $this->getJson('/api/evacpins/users');

    $response->assertStatus(401);
});

// Test 12.2
test('evac history returns only the authenticated users pins', function () {

    $token     = individualToken();
    $user      = evacUserForUid(env('FIREBASE_TEST_VERIFIED_UID'));
    $otherUser = evacUserForUid(env('FIREBASE_TEST_ADMIN_UID'));

    $myPin    = createEvacPin($user);
    $otherPin = createEvacPin($otherUser);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/evacpins/users');

    $response->assertOk();

    $ids = collect($response->json('pins'))->pluck('id');

    expect($ids)->toContain($myPin->id);
    expect($ids)->not->toContain($otherPin->id);
});

// Test 12.3
test('evac history response shape includes deactivation and expiry fields', function () {

    $token = individualToken();
    $user  = evacUserForUid(env('FIREBASE_TEST_VERIFIED_UID'));

    createEvacPin($user);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/evacpins/users');

    $response->assertOk();

    $response->assertJsonStructure([
        'count',
        'pins' => [
            '*' => [
                'id', 'name', 'address', 'is_persistent', 'expiry',
                'is_expired', 'is_deactivated', 'is_user_deactivated',
                'deactivated_at', 'posted_at', 'my_pin',
            ],
        ],
    ]);
});

// Test 12.4
test('evac history filters by is_persistent', function () {

    $token      = individualToken();
    $user       = evacUserForUid(env('FIREBASE_TEST_VERIFIED_UID'));
    $persistent = createEvacPin($user, ['is_persistent' => true, 'expiry' => null]);
    $adhoc      = createEvacPin($user, ['is_persistent' => false]);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/evacpins/users?is_persistent=true');

    $response->assertOk();

    $ids = collect($response->json('pins'))->pluck('id');

    expect($ids)->toContain($persistent->id);
    expect($ids)->not->toContain($adhoc->id);
});

// ── GET /api/pins/{id} (public, optional auth) ────────────────────────────────

// Test 7.14
test('pin detail returns full info for a valid id', function () {

    $user = evacUserForUid(env('FIREBASE_TEST_VERIFIED_UID'));
    $pin  = createEvacPin($user);

    $response = $this->getJson("/api/pins/{$pin->id}");

    $response->assertOk();

    $response->assertJsonStructure([
        'id', 'name', 'address', 'description', 'coordinates',
        'location_id', 'area_type_id', 'area_type',
        'capacity_level_id', 'capacity_name',
        'is_persistent', 'for_reg_flood', 'for_heavy_flood',
        'has_accom', 'has_DRRMO', 'has_health', 'pwd_friendly', 'has_catchment',
        'toilet_count', 'kitchen_count', 'child_prayer_count', 'breastfeed_count',
        'other_facilities', 'contact_person', 'contact_number',
        'is_deactivated', 'is_expired', 'expiry', 'expiry_label',
        'deactivated_at', 'last_updated',
        'verified_by' => ['gov_op_id', 'username'],
        'posted_by'   => ['user_id', 'username', 'posted_at'],
        'is_own_pin', 'media', 'last_confirmed',
    ]);

    $response->assertJsonPath('id', $pin->id);
});

// Test 7.15
test('pin detail returns 404 for missing pin', function () {

    $response = $this->getJson('/api/pins/999999');

    $response->assertNotFound();

    $response->assertJson(['error' => 'Evacuation area not found']);
});

// Test 7.16
test('pin detail marks is_own_pin correctly for owner', function () {

    $token = individualToken();
    $user  = evacUserForUid(env('FIREBASE_TEST_VERIFIED_UID'));
    $pin   = createEvacPin($user);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson("/api/pins/{$pin->id}");

    $response->assertOk();

    $response->assertJsonPath('is_own_pin', true);
});

// Test 7.17
test('pin detail expiry_label shows correct message for active pin', function () {

    $user = evacUserForUid(env('FIREBASE_TEST_VERIFIED_UID'));
    $pin  = createEvacPin($user, ['expiry' => now()->addDays(5)]);

    $response = $this->getJson("/api/pins/{$pin->id}");

    $response->assertOk();

    // 5 days from now -> "Expires in 5 days"
    expect($response->json('expiry_label'))->toContain('Expires in');
});


// Test 7.18
test('pin detail expiry_label shows Expired for past expiry', function () {

    $user = evacUserForUid(env('FIREBASE_TEST_VERIFIED_UID'));
    $pin  = createEvacPin($user, ['expiry' => now()->subDay()]);

    $response = $this->getJson("/api/pins/{$pin->id}");

    $response->assertOk();

    $response->assertJsonPath('expiry_label', 'Expired');
});

// ── GET /api/admin/pins (admin only) ─────────────────────────────────────────

// Test 
test('admin pins index returns all pins for admin', function () {

    $token = adminToken();
    $user  = evacUserForUid(env('FIREBASE_TEST_ADMIN_UID'));

    createEvacPin($user);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/admin/pins');

    $response->assertOk();

    $response->assertJsonStructure(['count', 'pins']);
});

test('admin pins index blocks individual users', function () {

    $token = individualToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/admin/pins');

    $response->assertStatus(403);
});

test('admin pins index blocks govops users', function () {

    $token = govopsToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/admin/pins');

    $response->assertStatus(403);
});

test('admin pins index filters by is_deactivated=true', function () {

    $token       = adminToken();
    $user        = evacUserForUid(env('FIREBASE_TEST_ADMIN_UID'));
    $active      = createEvacPin($user);
    $deactivated = createEvacPin($user);
    $deactivated->social_element->update(['deactivated_at' => now()]);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/admin/pins?is_deactivated=true');

    $response->assertOk();

    $ids = collect($response->json('pins'))->pluck('id');

    expect($ids)->toContain($deactivated->id);
    expect($ids)->not->toContain($active->id);
});

test('admin pins index filters by is_expired=true', function () {

    $token      = adminToken();
    $user       = evacUserForUid(env('FIREBASE_TEST_ADMIN_UID'));
    $expired    = createEvacPin($user, ['expiry' => now()->subHour()]);
    $notExpired = createEvacPin($user, ['expiry' => now()->addDays(3)]);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/admin/pins?is_expired=true');

    $response->assertOk();

    $ids = collect($response->json('pins'))->pluck('id');

    expect($ids)->toContain($expired->id);
    expect($ids)->not->toContain($notExpired->id);
});

test('admin pins index filters by status=active', function () {

    $token       = adminToken();
    $user        = evacUserForUid(env('FIREBASE_TEST_ADMIN_UID'));
    $active      = createEvacPin($user);
    $deactivated = createEvacPin($user);
    $deactivated->social_element->update(['deactivated_at' => now()]);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/admin/pins?status=active');

    $response->assertOk();

    $ids = collect($response->json('pins'))->pluck('id');

    expect($ids)->toContain($active->id);
    expect($ids)->not->toContain($deactivated->id);
});

test('admin pins index rejects invalid status value', function () {

    $token = adminToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/admin/pins?status=unknown');

    $response->assertStatus(422);

    $response->assertJson(['error' => 'Invalid status value. Use active or inactive.']);
});

test('admin pins index filters by is_user_deactivated=true', function () {

    $token          = adminToken();
    $deactivatedOwner = User::factory()->create(['deactivated_at' => now()]);
    $pin            = createEvacPin($deactivatedOwner);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/admin/pins?is_user_deactivated=true');

    $response->assertOk();

    $ids = collect($response->json('pins'))->pluck('id');

    expect($ids)->toContain($pin->id);
});

// ── POST /api/pins (auth required, role:1,2,3) ────────────────────────────────

// Test 6.1
test('store creates evacuation area without media', function () {

    $this->mock(MediaUploadService::class);

    $token = individualToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson('/api/pins', baseStorePayload());

    $response->assertCreated();

    $response->assertJsonStructure(['message', 'pin_id', 'element_id', 'media_path']);

    $response->assertJson(['message' => 'Evacuation area created successfully']);
});

// Test 6.2
test('store creates evacuation area with media', function () {

    $this->mock(MediaUploadService::class, function ($mock) {
        $mock->shouldReceive('upload')
            ->once()
            ->andReturn('evac-areas/test-image.jpg');
    });

    Storage::fake('sftp');

    $token = individualToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson('/api/pins', array_merge(
        baseStorePayload(),
        ['file' => UploadedFile::fake()->image('evac.jpg')]
    ));

    $response->assertCreated();
});

// Test 6.3
test('store pin requires authentication', function () {

    $response = $this->postJson('/api/pins', []);

    $response->assertStatus(401);
});

// Test 6.4
test('store pin validates required fields', function () {

    $token = individualToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson('/api/pins', []);

    $response->assertStatus(422);

    $response->assertJsonValidationErrors([
        'name', 'address', 'lat', 'lng', 'location_id', 'area_type', 'capacity_level',
    ]);
});

// Test 6.5
test('store rejects past expiry date', function () {

    $this->mock(MediaUploadService::class);

    $token = individualToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson('/api/pins', baseStorePayload([
        'expiry' => now('Asia/Manila')->subDay()->toDateTimeString(),
    ]));

    $response->assertStatus(422);

    $response->assertJsonValidationErrors(['expiry']);
});

// ── PUT /api/pins/{id} (auth required, role:1,2,3) ────────────────────────────

// Test 2.1
test('update allows owner to change their pin details', function () {

    $token = individualToken();
    $user  = evacUserForUid(env('FIREBASE_TEST_VERIFIED_UID'));
    $pin   = createEvacPin($user);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->putJson("/api/pins/{$pin->id}", [
        'name' => 'Updated Name',
    ]);

    $response->assertOk();

    $response->assertJson(['message' => 'Evacuation area updated successfully']);
});

// Test 2.2
test('update blocks individual from editing another users pin', function () {

    $token     = individualToken();
    $otherUser = evacUserForUid(env('FIREBASE_TEST_ADMIN_UID'));
    $pin       = createEvacPin($otherUser);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->putJson("/api/pins/{$pin->id}", [
        'name' => 'Hijacked Name',
    ]);

    $response->assertStatus(403);

    $response->assertJson(['error' => 'Forbidden. You may only update your own evacuation area pins']);
});

// Test 2.7
test('update allows admin to edit any pin', function () {

    $token = adminToken();
    $user  = evacUserForUid(env('FIREBASE_TEST_VERIFIED_UID'));
    $pin   = createEvacPin($user);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->putJson("/api/pins/{$pin->id}", [
        'name' => 'Admin Updated Name',
    ]);

    $response->assertOk();
});

// Test 2.3
test('update returns 404 for missing pin', function () {

    $token = individualToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->putJson('/api/pins/999999', ['name' => 'Ghost']);

    $response->assertNotFound();
});

// Test 2.4
test('update rejects expiry change on non-persistent pin', function () {

    $token = individualToken();
    $user  = evacUserForUid(env('FIREBASE_TEST_VERIFIED_UID'));
    $pin   = createEvacPin($user, ['is_persistent' => false]);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->putJson("/api/pins/{$pin->id}", [
        'expiry' => now('Asia/Manila')->addDays(5)->toDateTimeString(),
    ]);

    $response->assertStatus(422);

    $response->assertJsonStructure(['error']);
});

// Test 2.5
test('update allows expiry change on persistent pin', function () {

    $token = individualToken();
    $user  = evacUserForUid(env('FIREBASE_TEST_VERIFIED_UID'));
    $pin   = createEvacPin($user, ['is_persistent' => true, 'expiry' => now()->addDays(1)]);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->putJson("/api/pins/{$pin->id}", [
        'expiry' => now('Asia/Manila')->addDays(10)->toDateTimeString(),
    ]);

    $response->assertOk();
});

// Test 2.6
test('update rejects partial lat/lng', function () {

    $token = individualToken();
    $user  = evacUserForUid(env('FIREBASE_TEST_VERIFIED_UID'));
    $pin   = createEvacPin($user);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->putJson("/api/pins/{$pin->id}", [
        'lat' => 14.5995,
        // lng intentionally omitted
    ]);

    $response->assertStatus(422);

    $response->assertJson(['error' => 'Both lat and lng are required when updating location']);
});

// Test 2.7
test('update pin requires authentication', function () {

    $response = $this->putJson('/api/pins/1', []);

    $response->assertStatus(401);
});

// ── PATCH /api/pins/{id}/deactivate (auth required, role:1,2,3) ───────────────

// Test 3.1
test('deactivate soft-deletes an owned pin', function () {

    $token = individualToken();
    $user  = evacUserForUid(env('FIREBASE_TEST_VERIFIED_UID'));
    $pin   = createEvacPin($user);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->patchJson("/api/pins/{$pin->id}/deactivate");

    $response->assertOk();

    $response->assertJsonStructure([
        'message', 'pin_id', 'element_id', 'deactivated_at',
        'deactivated_by' => ['name'],
    ]);

    $response->assertJson(['message' => 'Evacuation area deactivated successfully']);
});

// Test 3.2
test('deactivate blocks individual from deactivating another users pin', function () {

    $token     = individualToken();
    $otherUser = evacUserForUid(env('FIREBASE_TEST_ADMIN_UID'));
    $pin       = createEvacPin($otherUser);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->patchJson("/api/pins/{$pin->id}/deactivate");

    $response->assertStatus(403);

    $response->assertJson(['error' => 'Forbidden. You may only deactivate your own evacuation area pins']);
});

// Test 3.3
test('deactivate allows admin to deactivate any pin', function () {

    $token = adminToken();
    $user  = evacUserForUid(env('FIREBASE_TEST_VERIFIED_UID'));
    $pin   = createEvacPin($user);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->patchJson("/api/pins/{$pin->id}/deactivate");

    $response->assertOk();
});

// Test 3.4
test('deactivate returns 404 for already-deactivated pin', function () {

    $token = individualToken();
    $user  = evacUserForUid(env('FIREBASE_TEST_VERIFIED_UID'));
    $pin   = createEvacPin($user);
    $pin->social_element->update(['deactivated_at' => now()]);

    // Query in controller does whereNull(deactivated_at) before find,
    // so an already-deactivated pin returns 404
    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->patchJson("/api/pins/{$pin->id}/deactivate");

    $response->assertNotFound();
});

// Test 3.5
test('deactivate requires authentication', function () {

    $response = $this->patchJson('/api/pins/1/deactivate');

    $response->assertStatus(401);
});

// ── PATCH /api/pins/{id}/restore (auth required, role:1,2,3) ─────────────────

// Test 10
test('restore reactivates an owned deactivated pin', function () {

    $token = individualToken();
    $user  = evacUserForUid(env('FIREBASE_TEST_VERIFIED_UID'));
    $pin   = createEvacPin($user);
    $pin->social_element->update(['deactivated_at' => now()]);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->patchJson("/api/pins/{$pin->id}/restore");

    $response->assertOk();

    $response->assertJson([
        'message'        => 'Evacuation area restored successfully',
        'deactivated_at' => null,
    ]);
});

test('restore clears expiry if it has already passed', function () {

    $token = individualToken();
    $user  = evacUserForUid(env('FIREBASE_TEST_VERIFIED_UID'));

    // Expired and deactivated pin
    $pin = createEvacPin($user, ['expiry' => now()->subHour()]);
    $pin->social_element->update(['deactivated_at' => now()]);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->patchJson("/api/pins/{$pin->id}/restore");

    $response->assertOk();

    $response->assertJsonPath('expiry', null);
});

test('restore blocks individual from restoring another users pin', function () {

    $token     = individualToken();
    $otherUser = evacUserForUid(env('FIREBASE_TEST_ADMIN_UID'));
    $pin       = createEvacPin($otherUser);
    $pin->social_element->update(['deactivated_at' => now()]);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->patchJson("/api/pins/{$pin->id}/restore");

    $response->assertStatus(403);
});

test('restore returns 404 for missing pin', function () {

    $token = individualToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->patchJson('/api/pins/999999/restore');

    $response->assertNotFound();
});

test('restore requires authentication', function () {

    $response = $this->patchJson('/api/pins/1/restore');

    $response->assertStatus(401);
});

// ── PATCH /api/pins/{id}/verify (auth required, role:1,2) ────────────────────

// Test 8.1
test('govops can verify a pin', function () {

    $token     = govopsToken();
    $pinOwner  = evacUserForUid(env('FIREBASE_TEST_VERIFIED_UID'));
    $pin       = createEvacPin($pinOwner);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->patchJson("/api/pins/{$pin->id}/verify", [
        'verified' => true,
    ]);

    $response->assertOk();

    $response->assertJson(['message' => 'Evacuation area verified successfully']);

    $response->assertJsonStructure([
        'message', 'pin_id',
        'verified_by' => ['barangay'],
    ]);
});

// Test 9
test('govops can remove verification from a pin', function () {

    $token    = govopsToken();
    $pinOwner = evacUserForUid(env('FIREBASE_TEST_VERIFIED_UID'));
    $pin      = createEvacPin($pinOwner);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->patchJson("/api/pins/{$pin->id}/verify", [
        'verified' => false,
    ]);

    $response->assertOk();

    $response->assertJson([
        'message'     => 'Verification mark removed',
        'verified_by' => null,
    ]);
});

// Test 8.2
test('verify blocks individual users', function () {

    $token    = individualToken();
    $pinOwner = evacUserForUid(env('FIREBASE_TEST_VERIFIED_UID'));
    $pin      = createEvacPin($pinOwner);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->patchJson("/api/pins/{$pin->id}/verify", [
        'verified' => true,
    ]);

    $response->assertStatus(403);
});

// Test 8.3
test('verify requires the verified field', function () {

    $token    = govopsToken();
    $pinOwner = evacUserForUid(env('FIREBASE_TEST_VERIFIED_UID'));
    $pin      = createEvacPin($pinOwner);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->patchJson("/api/pins/{$pin->id}/verify", []);

    $response->assertStatus(422);

    $response->assertJsonValidationErrors(['verified']);
});

// Test 8.4
test('verify returns 404 for deactivated pin', function () {

    $token    = govopsToken();
    $pinOwner = evacUserForUid(env('FIREBASE_TEST_VERIFIED_UID'));
    $pin      = createEvacPin($pinOwner);
    $pin->social_element->update(['deactivated_at' => now()]);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->patchJson("/api/pins/{$pin->id}/verify", [
        'verified' => true,
    ]);

    $response->assertNotFound();
});

// Test 8.5
test('verify requires authentication', function () {

    $response = $this->patchJson('/api/pins/1/verify', ['verified' => true]);

    $response->assertStatus(401);
});