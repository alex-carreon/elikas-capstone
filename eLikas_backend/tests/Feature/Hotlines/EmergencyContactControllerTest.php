<?php

use App\Models\EmergencyContact;
use App\Models\Location;
use App\Models\SocialElement;
use App\Models\TargetTable;
use App\Models\User;
use App\Models\UserAuth;

/**
 * EmergencyContactController tests.
 *
 * Routes:
 *   GET    /api/emergency-contacts                         (public)          -> index
 *   GET    /api/emergency-contacts/{id}                     (public)          -> show
 *   GET    /api/admin/emergency-contacts                    (role:1)          -> indexAdmin
 *   POST   /api/emergency-contacts                          (role:1,2)        -> store
 *   PATCH  /api/emergency-contacts/{id}                      (role:1,2)        -> update
 *   PATCH  /api/emergency-contacts/{id}/deactivate           (role:1,2)        -> destroy
 *   PATCH  /api/emergency-contacts/{id}/restore              (role:1,2)        -> restore
 *   GET    /api/emergency-contacts/location/{location_id}    (role:1,2,3)      -> getByLocationId
 */

/**
 * Create an EmergencyContact directly in the DB, owned by the given user.
 */
function createEmergencyContact(User $owner, array $overrides = []): EmergencyContact
{
    static $counter = 0;
    $counter++;

    $targetTable = TargetTable::where('table_name', 'EmergencyContacts')->firstOrFail();
    $location    = Location::where('level_id', 3)->first();

    $element = SocialElement::create([
        'user_id'   => $owner->id,
        'posted_at' => now(),
        'type_id'   => $targetTable->id,
        'has_media' => false,
    ]);

    return EmergencyContact::create(array_merge([
        'element_id'     => $element->id,
        'location_id'    => $location->id,
        'name'           => 'Test Emergency Contact ' . $counter,
        'phone_number'   => '028123456' . $counter,
        'mobile_number'  => '0917123456' . $counter,
        'address'        => 'Test Address ' . $counter,
    ], $overrides));
}

/**
 * Soft-deactivate a contact's social element (mirrors destroy()).
 */
function deactivateContact(EmergencyContact $contact): EmergencyContact
{
    $contact->load('social_element');
    $contact->social_element->deactivated_at = now('UTC');
    $contact->social_element->save();

    return $contact;
}

// ── GET /api/emergency-contacts (public index) ─────────────────────────────────

// Test 1.1
test('public index returns only active emergency contacts', function () {

    $admin = adminUser();
    $active = createEmergencyContact($admin);
    $inactive = createEmergencyContact($admin);
    deactivateContact($inactive);

    $response = $this->getJson('/api/emergency-contacts');

    $response->assertOk();

    $response->assertJsonStructure([
        'emergency_contacts' => [
            '*' => [
                'id', 'location_id', 'location_name', 'name', 'address',
                'phone_number', 'mobile_number', 'last_updated',
                'posted_by', 'is_deactivated', 'deactivated_at',
            ],
        ],
    ]);

    $ids = collect($response->json('emergency_contacts'))->pluck('id');

    expect($ids)->toContain($active->id);
    expect($ids)->not->toContain($inactive->id);
});

// Test 1.2
test('public index filters by location_id', function () {

    $admin = adminUser();
    $location = Location::where('level_id', 3)->first();
    $contact = createEmergencyContact($admin, ['location_id' => $location->id]);

    $response = $this->getJson("/api/emergency-contacts?location_id={$location->id}");

    $response->assertOk();

    collect($response->json('emergency_contacts'))->each(function ($c) use ($location) {
        expect($c['location_id'])->toBe($location->id);
    });
});

// ── GET /api/emergency-contacts/{id} (public show) ─────────────────────────────

// Test 1.3
test('show returns an active emergency contact', function () {

    $admin = adminUser();
    $contact = createEmergencyContact($admin);

    $response = $this->getJson("/api/emergency-contacts/{$contact->id}");

    $response->assertOk();
    $response->assertJsonPath('emergency_contact.id', $contact->id);
});

// Test 1.4
test('show returns 404 for a deactivated emergency contact', function () {

    $admin = adminUser();
    $contact = createEmergencyContact($admin);
    deactivateContact($contact);

    $response = $this->getJson("/api/emergency-contacts/{$contact->id}");

    $response->assertNotFound();
    $response->assertJson(['error' => 'Emergency contact not found']);
});

// Test 1.5
test('show returns 404 for a non-existent emergency contact', function () {

    $response = $this->getJson('/api/emergency-contacts/999999');

    $response->assertNotFound();
});

// ── GET /api/admin/emergency-contacts (admin only) ─────────────────────────────

// Test 1.6
test('admin index includes deactivated contacts', function () {

    $token = adminToken();
    $admin = adminUser();
    $inactive = createEmergencyContact($admin);
    deactivateContact($inactive);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/admin/emergency-contacts');

    $response->assertOk();

    $ids = collect($response->json('emergency_contacts'))->pluck('id');

    expect($ids)->toContain($inactive->id);
});

// Test 1.7
test('admin index filters by is_deactivated', function () {

    $token = adminToken();
    $admin = adminUser();
    $active = createEmergencyContact($admin);
    $inactive = createEmergencyContact($admin);
    deactivateContact($inactive);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/admin/emergency-contacts?is_deactivated=true');

    $response->assertOk();

    $ids = collect($response->json('emergency_contacts'))->pluck('id');

    expect($ids)->toContain($inactive->id);
    expect($ids)->not->toContain($active->id);
});

// Test 1.8
test('admin index is forbidden for non-admin roles', function () {

    $token = govopsToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/admin/emergency-contacts');

    $response->assertForbidden();
});

// ── POST /api/emergency-contacts (govop or admin) ──────────────────────────────

// Test 4.1
test('govop can create an emergency contact', function () {

    $token = govopsToken();
    $location = Location::where('level_id', 3)->first();

    $payload = [
        'location_id'    => $location->id,
        'name'           => 'Brgy Hall Hotline ' . uniqid(),
        'phone_number'   => '028123456',
        'mobile_number'  => '09171234567',
        'address'        => '123 Test St.',
    ];

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson('/api/emergency-contacts', $payload);

    $response->assertCreated();
    $response->assertJsonPath('emergency_contact.name', $payload['name']);

    $this->assertDatabaseHas('EmergencyContacts', [
        'name' => $payload['name'],
        'address' => $payload['address'],
    ]);
});

// Test 4.2
test('store fails validation when required fields are missing', function () {

    $token = govopsToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson('/api/emergency-contacts', []);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(
        ['location_id', 'name', 'address'],
        'details'
    );
});

// Test 4.3
test('store fails when name is not unique', function () {

    $token = govopsToken();
    $admin = adminUser();
    $existing = createEmergencyContact($admin);
    $location = Location::where('level_id', 3)->first();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson('/api/emergency-contacts', [
        'location_id' => $location->id,
        'name'        => $existing->name,
        'address'     => 'Some address',
    ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors(['name'], 'details');
});

// Test 4.4
test('individual user cannot create an emergency contact', function () {

    $token = individualToken();
    $location = Location::where('level_id', 3)->first();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson('/api/emergency-contacts', [
        'location_id' => $location->id,
        'name'        => 'Should Not Be Created ' . uniqid(),
        'address'     => 'Some address',
    ]);

    $response->assertForbidden();
});

// ── PATCH /api/emergency-contacts/{id} (update) ────────────────────────────────

// Test 5.1
test('govop can update an emergency contact', function () {

    $token = govopsToken();
    $admin = adminUser();
    $contact = createEmergencyContact($admin);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->patchJson("/api/emergency-contacts/{$contact->id}", [
        'address' => 'Updated Address',
    ]);

    $response->assertOk();
    $response->assertJsonPath('emergency_contact.address', 'Updated Address');
});

// Test 5.2
test('update returns 422 when no valid fields are provided', function () {

    $token = govopsToken();
    $admin = adminUser();
    $contact = createEmergencyContact($admin);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->patchJson("/api/emergency-contacts/{$contact->id}", []);

    $response->assertStatus(422);
});

// Test 5.3
test('update returns 404 for deactivated emergency contact', function () {

    $token = govopsToken();
    $admin = adminUser();
    $contact = createEmergencyContact($admin);
    deactivateContact($contact);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->patchJson("/api/emergency-contacts/{$contact->id}", [
        'address' => 'Updated Address',
    ]);

    $response->assertNotFound();
});

// ── PATCH /api/emergency-contacts/{id}/deactivate ──────────────────────────────

// Test 5.4
test('govop can deactivate an emergency contact', function () {

    $token = govopsToken();
    $admin = adminUser();
    $contact = createEmergencyContact($admin);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->patchJson("/api/emergency-contacts/{$contact->id}/deactivate");

    $response->assertOk();
    $response->assertJsonPath('is_deactivated', true);

    $contact->load('social_element');
    expect($contact->social_element->deactivated_at)->not->toBeNull();
});

// Test 5.5
test('deactivate returns 404 for non-existent contact', function () {

    $token = govopsToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->patchJson('/api/emergency-contacts/999999/deactivate');

    $response->assertNotFound();
});

// ── PATCH /api/emergency-contacts/{id}/restore ─────────────────────────────────

// Test 5.6
test('govop can restore a deactivated emergency contact', function () {

    $token = govopsToken();
    $admin = adminUser();
    $contact = createEmergencyContact($admin);
    deactivateContact($contact);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->patchJson("/api/emergency-contacts/{$contact->id}/restore");

    $response->assertOk();
    $response->assertJsonPath('emergency_contact.is_deactivated', false);

    $contact->load('social_element');
    expect($contact->social_element->deactivated_at)->toBeNull();
});

// Test 5.7
test('restoring an already active contact returns already active message', function () {

    $token = govopsToken();
    $admin = adminUser();
    $contact = createEmergencyContact($admin);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->patchJson("/api/emergency-contacts/{$contact->id}/restore");

    $response->assertOk();
    $response->assertJsonPath('message', 'Emergency contact is already active');
});
