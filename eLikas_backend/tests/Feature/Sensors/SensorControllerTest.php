<?php

use App\Models\Location;
use App\Models\Sensor;
use App\Models\SensorLog;
use App\Models\SocialElement;
use App\Models\TargetTable;
use App\Models\User;
use MatanYadaev\EloquentSpatial\Objects\Point;

/**
 * Sensor / SensorLog controller tests.
 *
 * Routes:
 *   GET    /api/public/sensors                    (public)        -> PublicSensorController::index
 *   GET    /api/public/sensors/{sensor}            (public)        -> PublicSensorController::show
 *   POST   /api/sensor-logs                        (public)        -> SensorLogController::store
 *   GET    /api/sensors/{sensor_code}/logs         (role:1,2)      -> SensorLogController::index
 *   GET    /api/sensors                            (role:1,2)      -> SensorController::index
 *   GET    /api/sensors/{sensor}                   (role:1,2)      -> SensorController::show (first match — see note above)
 *   POST   /api/sensors                            (role:2)        -> SensorController::store
 *   PATCH  /api/sensors/{sensor}                   (role:2)        -> SensorController::update
 *   PATCH  /api/sensors/{sensor}/deactivate         (role:2)        -> SensorController::deactivate
 */

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Create a Sensor directly in the DB, owned by the given user.
 */
function createSensor(User $owner, array $overrides = []): Sensor
{
    static $counter = 0;
    $counter++;

    $targetTable = TargetTable::where('table_name', 'Sensors')->firstOrFail();
    $location    = Location::where('level_id', 3)->first();

    $element = SocialElement::create([
        'user_id'   => $owner->id,
        'posted_at' => now(),
        'type_id'   => $targetTable->id,
        'has_media' => false,
    ]);

    return Sensor::create(array_merge([
        'element_id'     => $element->id,
        'sensor_code'    => 'SNS-TEST-' . $counter . '-' . uniqid(),
        'name'           => 'Test Sensor ' . $counter,
        'mount_height'   => 5.0,
        'location'       => new Point(round(12.0 + $counter * 0.001, 6), round(174.0 + $counter * 0.001, 6)),
        'address'        => 'Test Sensor Address ' . $counter,
        'location_id'    => $location->id,
        'yellow_level'   => 1.0,
        'orange_level'   => 2.0,
        'red_level'      => 3.0,
        'last_online'    => now(),
        'current_status' => 'normal',
    ], $overrides));
}

/**
 * Soft-deactivate a sensor's social element (mirrors deactivate()).
 */
function deactivateSensor(Sensor $sensor): Sensor
{
    $sensor->load('social_element');
    $sensor->social_element->deactivated_at = now();
    $sensor->social_element->save();

    return $sensor;
}

/**
 * Create a SensorLog for the given sensor code.
 */
function createSensorLog(string $sensorCode, array $overrides = []): SensorLog
{
    return SensorLog::create(array_merge([
        'sensor_code'      => $sensorCode,
        'water_level'      => 1.5,
        'status_level'     => 'normal',
        'sensor_timestamp' => now(),
        'log_time'         => now(),
    ], $overrides));
}

// ── GET /api/public/sensors ────────────────────────────────────────────────────

// Test 8.1
test('public sensors index returns only active sensors', function () {

    $admin = adminUser();
    $active = createSensor($admin);
    $inactive = createSensor($admin);
    deactivateSensor($inactive);

    $response = $this->getJson('/api/public/sensors');

    $response->assertOk();

    $response->assertJsonStructure([
        '*' => ['id', 'name', 'location', 'barangay', 'lastOnline', 'currentStatus'],
    ]);

    $ids = collect($response->json())->pluck('id');

    expect($ids)->toContain($active->id);
    expect($ids)->not->toContain($inactive->id);
});

// ── GET /api/public/sensors/{sensor} ───────────────────────────────────────────

// Test 8.2
test('public sensor show returns sensor details', function () {

    $admin = adminUser();
    $sensor = createSensor($admin);

    $response = $this->getJson("/api/public/sensors/{$sensor->id}");

    $response->assertOk();
    $response->assertJsonPath('id', $sensor->id);
    $response->assertJsonStructure([
        'id', 'name', 'location', 'address', 'barangay',
        'waterLevel', 'lastOnline', 'currentStatus',
    ]);
});

// Test 8.3
test('public sensor show returns 404 for deactivated sensor', function () {

    $admin = adminUser();
    $sensor = createSensor($admin);
    deactivateSensor($sensor);

    $response = $this->getJson("/api/public/sensors/{$sensor->id}");

    $response->assertNotFound();
    $response->assertJson(['error' => 'Sensor is deactivated']);
});

// Test 8.4
test('public sensor show returns 404 for non-existent sensor', function () {

    $response = $this->getJson('/api/public/sensors/999999');

    $response->assertNotFound();
});

// ── POST /api/sensor-logs (public) ─────────────────────────────────────────────

// Test 8.5
test('anyone can submit a sensor log for an existing sensor', function () {

    $admin = adminUser();
    $sensor = createSensor($admin);

    $payload = [
        'sensorCode'      => $sensor->sensor_code,
        'waterLevel'      => 1.75,
        'sensorTimestamp' => now()->toIso8601String(),
    ];

    $response = $this->postJson('/api/sensor-logs', $payload);

    $response->assertStatus(210);
    $response->assertJsonPath('data.sensorCode', $sensor->sensor_code);

    $this->assertDatabaseHas('SensorLogs', [
        'sensor_code' => $sensor->sensor_code,
    ]);
});

// Test 8.6
test('sensor log submission fails when sensor_code does not exist', function () {

    $payload = [
        'sensorCode'      => 'NON-EXISTENT-CODE',
        'waterLevel'      => 1.0,
        'sensorTimestamp' => now()->toIso8601String(),
    ];

    $response = $this->postJson('/api/sensor-logs', $payload);

    $response->assertStatus(500);
});

// Test 8.7
test('sensor log submission fails validation when fields are missing', function () {

    $response = $this->postJson('/api/sensor-logs', []);

    $response->assertStatus(500);
});

// Test 8.8
test('sensor log submission rejects zero or negative water level', function () {

    $admin = adminUser();
    $sensor = createSensor($admin);

    $payload = [
        'sensorCode'      => $sensor->sensor_code,
        'waterLevel'      => 0,
        'sensorTimestamp' => now()->toIso8601String(),
    ];

    $response = $this->postJson('/api/sensor-logs', $payload);

    $response->assertStatus(500);
});

// ── GET /api/sensors/{sensor_code}/logs (role:1,2) ─────────────────────────────

// Test 8.9
test('govops can fetch logs for a sensor', function () {

    $token = govopsToken();
    $admin = adminUser();
    $sensor = createSensor($admin);
    createSensorLog($sensor->sensor_code);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson("/api/sensors/{$sensor->sensor_code}/logs");

    $response->assertOk();

    $response->assertJsonStructure([
        'data' => [
            '*' => ['waterLevel', 'statusLevel', 'sensorTimestamp', 'logTime'],
        ],
    ]);
});

// Test 8.10
test('sensor logs returns 404 for a sensor code that does not exist', function () {

    $token = govopsToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/sensors/NON-EXISTENT-CODE/logs');

    $response->assertNotFound();
});

// Test 8.11
test('individual user cannot fetch sensor logs', function () {

    $token = individualToken();
    $admin = adminUser();
    $sensor = createSensor($admin);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson("/api/sensors/{$sensor->sensor_code}/logs");

    $response->assertForbidden();
});

// ── GET /api/sensors (role:1,2) ─────────────────────────────────────────────────

// Test 8.12
test('admin can list sensors', function () {

    $token = adminToken();
    $admin = adminUser();
    createSensor($admin);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/sensors');

    $response->assertOk();

    $response->assertJsonStructure([
        'data' => [
            '*' => ['id', 'sensorCode', 'name', 'lastOnline', 'mountHeight', 'location', 'address'],
        ],
    ]);
});

// Test 8.13
test('individual user cannot list sensors', function () {

    $token = individualToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/sensors');

    $response->assertForbidden();
});

// ── GET /api/sensors/{sensor} (role:1,2 — first matching route wins) ──────────

// Test 8.14
test('govops can view a single sensor', function () {

    $token = govopsToken();
    $admin = adminUser();
    $sensor = createSensor($admin);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson("/api/sensors/{$sensor->id}");

    $response->assertOk();
    $response->assertJsonPath('id', $sensor->id);
});

// Test 8.15
// NOTE: this documents *current* behavior given the duplicate route registration
// described above — role 3 hits the role:1,2-guarded route first and is
// forbidden, even though a later role:1,2,3 route exists for this same URI.
test('individual user is currently forbidden from viewing a single sensor', function () {

    $token = individualToken();
    $admin = adminUser();
    $sensor = createSensor($admin);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson("/api/sensors/{$sensor->id}");

    $response->assertForbidden();
});

// ── POST /api/sensors (role:2 only) ────────────────────────────────────────────

// Test 8.16
test('govops can create a sensor', function () {

    $token = govopsToken();
    $location = Location::where('level_id', 3)->first();

    $payload = [
        'name'         => 'New Sensor ' . uniqid(),
        'mountHeight'  => 5.0,
        'location'     => [12.123456, 174.123456],
        'address'      => 'Somewhere near the creek',
        'locationId'   => $location->id,
        'yellowLevel'  => 1.0,
        'orangeLevel'  => 2.0,
        'redLevel'     => 3.0,
    ];

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson('/api/sensors', $payload);

    $response->assertOk();
    $response->assertJsonPath('name', $payload['name']);
});

// Test 8.17
test('admin cannot create a sensor (govops-only route)', function () {

    $token = adminToken();
    $location = Location::where('level_id', 3)->first();

    $payload = [
        'name'         => 'Should Not Be Created ' . uniqid(),
        'mountHeight'  => 5.0,
        'location'     => [12.123456, 174.123456],
        'address'      => 'Somewhere',
        'locationId'   => $location->id,
        'yellowLevel'  => 1.0,
        'orangeLevel'  => 2.0,
        'redLevel'     => 3.0,
    ];

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson('/api/sensors', $payload);

    $response->assertForbidden();
});

// Test 8.18
test('store sensor fails validation when level ordering is invalid', function () {

    $token = govopsToken();
    $location = Location::where('level_id', 3)->first();

    $payload = [
        'name'         => 'Bad Levels Sensor ' . uniqid(),
        'mountHeight'  => 5.0,
        'location'     => [12.123456, 174.123456],
        'address'      => 'Somewhere',
        'locationId'   => $location->id,
        'yellowLevel'  => 3.0, // invalid: yellow should be < orange
        'orangeLevel'  => 2.0,
        'redLevel'     => 4.0,
    ];

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson('/api/sensors', $payload);

    $response->assertStatus(422);
});

// ── PATCH /api/sensors/{sensor} (role:2 only) ──────────────────────────────────

// Test 8.19
test('govops can update a sensor', function () {

    $token = govopsToken();
    $admin = adminUser();
    $sensor = createSensor($admin);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->patchJson("/api/sensors/{$sensor->id}", [
        'address' => 'Updated Sensor Address',
    ]);

    $response->assertOk();
    $response->assertJsonPath('address', 'Updated Sensor Address');
});

// Test 8.20
test('update sensor fails when resulting level order is invalid', function () {

    $token = govopsToken();
    $admin = adminUser();
    $sensor = createSensor($admin); // yellow:1, orange:2, red:3, mount:5

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->patchJson("/api/sensors/{$sensor->id}", [
        'redLevel' => 0.5, // now less than orange_level (2.0)
    ]);

    $response->assertStatus(422);
});

// ── PATCH /api/sensors/{sensor}/deactivate (role:2 only) ──────────────────────

// Test 8.21
test('govops can deactivate a sensor', function () {

    $token = govopsToken();
    $admin = adminUser();
    $sensor = createSensor($admin);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->patchJson("/api/sensors/{$sensor->id}/deactivate");

    $response->assertOk();
    $response->assertJson(['message' => 'Sensor deactivated successfully']);

    $sensor->load('social_element');
    expect($sensor->social_element->deactivated_at)->not->toBeNull();
});

// Test 8.22
test('deactivate returns 500 for non-existent sensor', function () {

    $token = govopsToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->patchJson('/api/sensors/999999/deactivate');

    $response->assertStatus(500);
});