<?php

use App\Models\Location;

/**
 * LocationsController tests.
 *
 * Routes (public, no auth):
 *   GET /api/locations/cities
 *   GET /api/locations/barangays
 *   GET /api/locations/barangays?city_id={id}
 */

// ── GET /api/locations/cities ─────────────────────────────────────────────────

test('cities index returns all cities publicly', function () {

    $response = $this->getJson('/api/locations/cities');

    $response->assertOk();

    $response->assertJsonStructure([
        'Cities' => [
            '*' => ['id', 'name', 'parent_id'],
        ],
    ]);
});

test('cities index returns results ordered by name', function () {

    $response = $this->getJson('/api/locations/cities');

    $response->assertOk();

    $names = collect($response->json('Cities'))->pluck('name')->values()->all();

    $sorted = collect($names)->sort()->values()->all();

    expect($names)->toBe($sorted);
});

// ── GET /api/locations/barangays ──────────────────────────────────────────────

test('barangays index returns all barangays publicly', function () {

    $response = $this->getJson('/api/locations/barangays');

    $response->assertOk();

    $response->assertJsonStructure([
        'count',
        'Barangays' => [
            '*' => ['id', 'name', 'parent_id'],
        ],
    ]);
});

test('barangays can be filtered by city_id', function () {

    // Pick a real city from the DB
    $city = Location::whereHas('locationLevel', fn ($q) => $q->where('level_name', 'City'))
        ->first();

    $response = $this->getJson("/api/locations/barangays?city_id={$city->id}");

    $response->assertOk();

    // Every returned barangay must belong to this city (parent_id === city->id)
    $parentIds = collect($response->json('Barangays'))->pluck('parent_id')->unique()->values();

    foreach ($parentIds as $parentId) {
        expect($parentId)->toBe($city->id);
    }
});

