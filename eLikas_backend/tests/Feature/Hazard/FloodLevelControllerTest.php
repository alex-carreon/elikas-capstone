<?php

use App\Models\FloodLevel;

/**
 * FloodLevelController tests.
 *
 * Routes:
 *   GET    /flood-levels        middleware: firebase.auth, role:1,2,3
 *   GET    /flood-levels/{id}   middleware: firebase.auth, role:1,2,3 
 *   POST   /flood-levels        middleware: firebase.auth, role:1,2
 *   PATCH  /flood-levels/{id}   middleware: firebase.auth, role:1,2
 *
 * index/show are dropdown helpers used by all authenticated roles.
 * store/update are skipped per spec (done via SQL scripts by admin).
 *
 * Token helpers are defined globally in tests/Pest.php.
 */

//---- INDEX ----

// TEST 7.1
test('flood levels index returns all levels', function () {

    $token = individualToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/flood-levels');

    $response->assertOk();

    $response->assertJsonStructure([
        'flood_levels' => [
            '*' => ['id', 'level_name', 'description'],
        ],
    ]);
});

// TEST 7.2
test('flood levels index requires authentication', function () {

    $response = $this->getJson('/api/flood-levels');

    $response->assertStatus(401);
});

//---- SHOW ----

// TEST 7.3
test('flood level show returns correct level', function () {

    $token = adminToken();

    $level = FloodLevel::first();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson("/api/flood-levels/{$level->id}");

    $response->assertOk();

    $response->assertJsonStructure([
        'flood_level' => ['id', 'level_name', 'description'],
    ]);

    $response->assertJsonPath('flood_level.id', $level->id);
});

// TEST 7.4
test('flood level show returns 404 for missing level', function () {

    $token = adminToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/flood-levels/999999');

    $response->assertNotFound();

    $response->assertJsonStructure(['message']);
});