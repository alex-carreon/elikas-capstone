<?php

use App\Mail\VerifyEmailMail;
use App\Models\Location;
use App\Models\PhoneNumber;
use App\Models\User;
use App\Models\UserAuth;
use Illuminate\Support\Facades\Mail;


/**
 * ProfileController tests.
 *
 * Routes (all under firebase.auth, role:1,2,3):
 *   GET   /api/profile
 *   PUT   /api/profile
 *   PATCH /api/profile/deactivate
 *   PATCH /api/profile/change-email
 *
 * changeEmail hits real Firebase (updateUser + getEmailVerificationLink)
 * using the same real-token approach as AuthControllerTest.
 *
 * Token helpers (individualToken, adminToken, govopsToken) are in tests/Pest.php.
 *
 * Required .env.testing:
 *   FIREBASE_TEST_VERIFIED_UID
 *   FIREBASE_TEST_VERIFIED_REFRESH_TOKEN
 *   FIREBASE_TEST_ADMIN_UID
 *   FIREBASE_TEST_GOVOPS_UID
 */

// ── GET /api/profile ──────────────────────────────────────────────────────────

// Test 1.1
test('profile returns authenticated users data', function () {

    $token = individualToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/profile');

    $response->assertOk();

    $response->assertJsonStructure([
        'id', 'username', 'email', 'avatar_seed', 'role',
        'first_name', 'last_name', 'phone', 'is_verified',
        'location', 'point_person', 'point_person_position',
        'created_at', 'deactivated_at',
    ]);
});

// Test 1.2
test('profile returns the authenticated users own information', function () {

    $token = individualToken();
    $user = evacUserForUid(env('FIREBASE_TEST_VERIFIED_UID'));

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/profile');

    $response->assertOk();

    $response->assertJson([
        'id' => $user->id,
        'username' => $user->username,
        'email' => $user->email,
    ]);
});

// Test 1.3
test('profile requires authentication', function () {

    $response = $this->getJson('/api/profile');

    $response->assertStatus(401);
});

// Test 1.4
test('profile returns govops point person fields', function () {

    $token = govopsToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->getJson('/api/profile');

    $response->assertOk();

    // govOp may or may not have point_person set, but keys must be present
    expect($response->json())->toHaveKeys(['point_person', 'point_person_position']);
});

// ── PUT /api/profile ──────────────────────────────────────────────────────────

// Test 2.1
test('individual user can update username and avatar_seed', function () {

    $token = individualToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->putJson('/api/profile', [
        'username'    => 'updateduser',
        'avatar_seed' => 'SEED1234',
    ]);

    $response->assertOk();

    $response->assertJson(['message' => 'Profile updated successfully']);
});

// Test 2.2
test('individual user can update first and last name', function () {

    $token = individualToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->putJson('/api/profile', [
        'first_name' => 'UpdatedFirst',
        'last_name'  => 'UpdatedLast',
    ]);

    $response->assertOk();

    $response->assertJson(['message' => 'Profile updated successfully']);
});

// Test 2.3
test('individual user can update phone number', function () {

    $token = individualToken();
    $uid   = env('FIREBASE_TEST_VERIFIED_UID');
    $user  = UserAuth::with('user')->where('identity_uid', $uid)->firstOrFail()->user;

    // Use a phone number unique enough not to clash with other users
    $newPhone = '09' . rand(100000000, 999999999);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->putJson('/api/profile', [
        'phone' => $newPhone,
    ]);

    $response->assertOk();
});

// Test 2.4
test('update profile rejects duplicate phone number', function () {

    $token = individualToken();
    $uid   = env('FIREBASE_TEST_VERIFIED_UID');
    $user  = UserAuth::with('user')->where('identity_uid', $uid)->firstOrFail()->user;

    // Plant a phone number owned by a different user
    $otherUser = User::factory()->create();
    PhoneNumber::updateOrCreate(
        ['user_id' => $otherUser->id],
        ['phone_no' => '09111111111', 'is_verified' => false]
    );

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->putJson('/api/profile', [
        'phone' => '09111111111',
    ]);

    $response->assertStatus(422);

    $response->assertJsonPath('errors.phone.0', 'This phone number is already in use.');
});

// Test 2.5
test('individual user cannot update govop fields', function () {

    $token = individualToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->putJson('/api/profile', [
        'point_person'          => 'Some Person',
        'point_person_position' => 'Chief',
    ]);

    $response->assertStatus(422);

    $response->assertJsonPath('errors.point_person.0',
        'This field cannot be updated by individual users.'
    );
});

// Test 2.6
test('govop user cannot update individual fields', function () {

    $token = govopsToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->putJson('/api/profile', [
        'first_name' => 'Blocked',
    ]);

    $response->assertStatus(422);

    $response->assertJsonPath('errors.first_name.0',
        'This field cannot be updated by government operators.'
    );
});

// Test 2.7
test('govop user can update point person fields', function () {

    $token = govopsToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->putJson('/api/profile', [
        'point_person'          => 'Juan dela Cruz',
        'point_person_position' => 'Barangay Captain',
    ]);

    $response->assertOk();

    $response->assertJson(['message' => 'Profile updated successfully']);
});

// Test 2.8
test('update profile rejects duplicate username', function () {

    $token = individualToken();

    // Seed a user that already owns this username
    User::factory()->create(['username' => 'alreadytaken']);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->putJson('/api/profile', [
        'username' => 'alreadytaken',
    ]);

    $response->assertStatus(422);

    $response->assertJsonValidationErrors(['username']);
});

// Test 2.9
test('update profile requires authentication', function () {

    $response = $this->putJson('/api/profile', ['username' => 'ghost']);

    $response->assertStatus(401);
});

// Test 9
test('update profile rejects fields exceeding maximum length', function () {

    $token = individualToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->putJson('/api/profile', [
        'username'   => str_repeat('a', 21), // max 20
        'first_name' => str_repeat('a', 51), // max 50
        'last_name'  => str_repeat('a', 51), // max 50
        'phone'      => str_repeat('1', 13), // max 12
    ]);

    $response->assertStatus(422);

    $response->assertJsonValidationErrors([
        'username',
        'first_name',
        'last_name',
        'phone',
    ]);
});

// Test 3
test('update profile rejects invalid field types', function () {

    $token = individualToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->putJson('/api/profile', [
        'location_id' => 'not-an-integer',
    ]);

    $response->assertStatus(422);

    $response->assertJsonValidationErrors([
        'location_id',
    ]);
});

// ── PATCH /api/profile/deactivate ─────────────────────────────────────────────

// Test 13.1
test('user can only deactivate their own account', function () {

    $token = individualToken();
    $uid   = env('FIREBASE_TEST_VERIFIED_UID');

    $me = UserAuth::with('user')
        ->where('identity_uid', $uid)
        ->firstOrFail()
        ->user;

    // Another user that should remain active
    $otherUser = User::factory()->create([
        'deactivated_at' => null,
    ]);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->patchJson('/api/profile/deactivate');

    $response->assertOk();

    $me->refresh();
    $otherUser->refresh();

    expect($me->deactivated_at)->not->toBeNull();
    expect($otherUser->deactivated_at)->toBeNull();
});

// Test 13.2
test('deactivate self requires authentication', function () {

    $response = $this->patchJson('/api/profile/deactivate');

    $response->assertStatus(401);
});

// ── PATCH /api/profile/change-email ──────────────────────────────────────────

// Test 6.1
test('change email updates email and sends verification', function () {

    Mail::fake();

    $token = individualToken();

    // Use a real alternate email that your Firebase test account can be
    // temporarily updated to. The Firebase Admin SDK will update the account
    // email — DatabaseTransactions rolls the DB row back, but Firebase does not
    // roll back, so after this test the Firebase account will have a new email.
    // Use an email you control and can reset manually if needed.
    $newEmail = env('FIREBASE_TEST_CHANGE_EMAIL_TARGET');

    if (! $newEmail) {
        test()->fail('Set FIREBASE_TEST_CHANGE_EMAIL_TARGET in .env.testing — the email to update the verified test account to during changeEmail tests.');
    }

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->patchJson('/api/profile/change-email', [
        'email' => $newEmail,
    ]);

    $response->assertOk();

    $response->assertJsonStructure(['message', 'email']);

    $response->assertJson([
        'message' => 'Email updated successfully. Verification email sent.',
    ]);

    Mail::assertSent(VerifyEmailMail::class);
});

// Test 8
test('change email rejects same email as current', function () {

    $token = individualToken();
    $uid   = env('FIREBASE_TEST_VERIFIED_UID');
    $user  = UserAuth::with('user')->where('identity_uid', $uid)->firstOrFail()->user;

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->patchJson('/api/profile/change-email', [
        'email' => $user->email,
    ]);

    $response->assertStatus(422);
    $response->assertJsonValidationErrors('email');

    $response->assertJsonFragment([
        'message' => 'The email has already been taken.',
    ]);
});

// Test 7
test('change email rejects duplicate email already in use', function () {

    $token = individualToken();

    $existing = User::factory()->create(['email' => 'taken@example.com']);

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->patchJson('/api/profile/change-email', [
        'email' => 'taken@example.com',
    ]);

    $response->assertStatus(422);

    $response->assertJsonValidationErrors(['email']);
});

// Test 6.2
test('change email requires authentication', function () {

    $response = $this->patchJson('/api/profile/change-email', [
        'email' => 'new@example.com',
    ]);

    $response->assertStatus(401);
});

// Test 6.3
test('change email sends verification email', function () {

    Mail::fake();

    $token = individualToken();

    $uid = env('FIREBASE_TEST_VERIFIED_UID');
    $user = UserAuth::with('user')->where('identity_uid', $uid)->firstOrFail()->user;

    $newEmail = 'verification-test@example.com';

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->patchJson('/api/profile/change-email', [
        'email' => $newEmail,
    ]);

    $response->assertOk();

    Mail::assertSent(VerifyEmailMail::class, function ($mail) use ($newEmail) {
        return $mail->hasTo($newEmail);
    });
});