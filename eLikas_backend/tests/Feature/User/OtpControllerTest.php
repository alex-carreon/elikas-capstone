<?php

use App\Models\PhoneNumber;
use App\Models\UserAuth;

/**
 * OtpController tests.
 *
 * Routes (all under firebase.auth, role:1,2,3):
 *   POST /api/otp/send
 *   POST /api/otp/verify
 *
 * OtpService runs in mock mode during tests — no real SMS is sent.
 * Ensure your .env.testing has:
 *   IPROGSMS_MOCK=true   (or set services.iprogsms.mock = true in config/services.php)
 *
 * In mock mode:
 *   - sendOtp always succeeds with OTP code '000000'
 *   - verifyOtp accepts any OTP and marks the phone verified in the DB
 *
 * Token helpers are in tests/Pest.php.
 */

// ── POST /api/otp/send ────────────────────────────────────────────────────────

// Test 10.1
test('otp send returns success in mock mode', function () {

    $token = individualToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson('/api/otp/send', [
        'phone_number' => '09171234567',
    ]);

    $response->assertOk();

    $response->assertJsonStructure(['message', 'data']);

    $response->assertJsonPath('data.otp_code', '000000');
});

// Test 10.2
test('otp send requires phone_number', function () {

    $token = individualToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson('/api/otp/send', []);

    $response->assertStatus(422);

    $response->assertJsonValidationErrors(['phone_number']);
});

// Test 10.3
test('otp send rejects expires_in_minutes above 60', function () {

    $token = individualToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson('/api/otp/send', [
        'phone_number'       => '09171234567',
        'expires_in_minutes' => 61,
    ]);

    $response->assertStatus(422);

    $response->assertJsonValidationErrors(['expires_in_minutes']);
});

// Test 10.4
test('otp send requires authentication', function () {

    $response = $this->postJson('/api/otp/send', [
        'phone_number' => '09171234567',
    ]);

    $response->assertStatus(401);
});

// ── POST /api/otp/verify ──────────────────────────────────────────────────────

// Test 11.1
test('otp verify succeeds in mock mode and marks phone verified', function () {

    $token = individualToken();
    $uid   = env('FIREBASE_TEST_VERIFIED_UID');
    $user  = UserAuth::with('user')->where('identity_uid', $uid)->firstOrFail()->user;

    $phone = '09' . rand(100000000, 999999999);

    // Seed a phone number row so markPhoneVerified has something to update
    PhoneNumber::updateOrCreate(
        ['user_id' => $user->id],
        ['phone_no' => $phone, 'is_verified' => false]
    );

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson('/api/otp/verify', [
        'phone_number' => $phone,
        'otp'          => '000000',
    ]);

    $response->assertOk();

    $response->assertJson([
        'message'     => 'OTP verified successfully (mock)',
        'is_verified' => true,
    ]);

    // Confirm the phone row was marked verified in the DB
    $this->assertDatabaseHas('PhoneNumbers', [
        'phone_no'    => $phone,
        'is_verified' => true,
    ]);
});

// Test 11.2
test('otp verify requires phone_number and otp', function () {

    $token = individualToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson('/api/otp/verify', []);

    $response->assertStatus(422);

    $response->assertJsonValidationErrors(['phone_number', 'otp']);
});

// Test 11.3
test('otp verify returns 422 for wrong otp code', function () {

    // Mock mode accepts any OTP, so we target-mock OtpService just for this
    // test to simulate a failed verification (wrong code submitted by user).
    $this->mock(\App\Services\OtpService::class, function ($mock) {
        $mock->shouldReceive('verifyOtp')
            ->once()
            ->andReturn([
                'success' => false,
                'message' => 'OTP verification failed.',
            ]);
    });

    $token = individualToken();

    $response = $this->withHeaders([
        'Authorization' => "Bearer {$token}",
    ])->postJson('/api/otp/verify', [
        'phone_number' => '09171234567',
        'otp'          => '999999', // wrong code
    ]);

    $response->assertStatus(422);

    $response->assertJson(['message' => 'OTP verification failed.']);
});

// Test 11.4
test('otp verify requires authentication', function () {

    $response = $this->postJson('/api/otp/verify', [
        'phone_number' => '09171234567',
        'otp'          => '000000',
    ]);

    $response->assertStatus(401);
});