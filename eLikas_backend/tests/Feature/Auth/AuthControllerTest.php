<?php

use App\Mail\ForgotPasswordMail;
use App\Mail\VerifyEmailMail;
use App\Models\Location;
use App\Models\User;
use App\Models\UserAuth;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Mail;

 

//----REGISTER----
// TEST 1
test('user can register successfully', function () {

    Mail::fake();

    $location = Location::where('level_id', 3)->first();

    $response = $this->postJson('/api/auth/register', [
        'username' => 'kurttest',
        'email' => 'pesting@gmail.com',
        'first_name' => 'kurt',
        'last_name' => 'andrei',
        'phone' => '09171234567',
        'firebase_uid' => 'TDfpcldrRxZWyC8yPShuaESwZ843',
        'location_id' => $location->id,
        'avatar_seed' => 'ABC12345',
    ]);

    $response->assertCreated();

    $response->assertJsonStructure([
        'message',
        'user_id',
    ]);

    $this->assertDatabaseHas('Users', [
        'username' => 'kurttest',
        'email' => 'pesting@gmail.com',
        'role_id' => 3,
    ]);

    $user = \App\Models\User::where('email', 'pesting@gmail.com')->first();

    $this->assertDatabaseHas('UserAuth', [
        'user_id' => $user->id,
        'identity_uid' => 'TDfpcldrRxZWyC8yPShuaESwZ843',
    ]);

    $this->assertDatabaseHas('Names', [
        'user_id' => $user->id,
        'first_name' => 'kurt',
        'last_name' => 'andrei',
    ]);

    $this->assertDatabaseHas('PhoneNumbers', [
        'user_id' => $user->id,
        'phone_no' => '09171234567',
    ]);

    $this->assertDatabaseHas('IndivAccs', [
        'user_id' => $user->id,
        'location_id' => $location->id,
    ]);

    Mail::assertSent(VerifyEmailMail::class);

    if ($response->status() !== 201) {
        dd($response->json());
    }
});

// TEST 5.1
test('registration requires required fields', function () {
 
    $response = $this->postJson('/api/auth/register', []);
 
    $response->assertStatus(422);
 
    $response->assertJsonValidationErrors([
        'username',
        'email',
        'first_name',
        'last_name',
        'firebase_uid',
        'location_id',
        'avatar_seed',
    ]);
 
});

// TEST 5.2
test('registration fails with invalid firebase uid', function () {
 
    $location = Location::where('level_id', 3)->first();
 
    $response = $this->postJson('/api/auth/register', [
        'username' => 'baduidtest',
        'email' => 'baduid@gmail.com',
        'first_name' => 'bad',
        'last_name' => 'uid',
        'firebase_uid' => 'this-uid-does-not-exist-in-firebase-12345',
        'location_id' => $location->id,
        'avatar_seed' => 'BADUID01',
    ]);
 
    $response->assertStatus(401);
 
    $response->assertJson([
        'error' => 'Invalid Firebase user',
    ]);
 
    // Confirm nothing was written to the DB (the failure happens before the transaction)
    $this->assertDatabaseMissing('Users', [
        'email' => 'baduid@gmail.com',
    ]);
});

// TEST 6.1
test('registration fails if user registers an existing email', function () {
 
    Mail::fake();
 
    $location = Location::where('level_id', 3)->first();
 
    // Existing user already in DB
    User::factory()->create([
        'email' => 'duplicate@gmail.com',
        'role_id' => 3,
    ]);
 
    $response = $this->postJson('/api/auth/register', [
        'username' => 'newusername',
        'email' => 'duplicate@gmail.com',
        'first_name' => 'new',
        'last_name' => 'user',
        'firebase_uid' => 'TDfpcldrRxZWyC8yPShuaESwZ843',
        'location_id' => $location->id,
        'avatar_seed' => 'DUPEMAIL',
    ]);
 
    $response->assertStatus(422);
 
    $response->assertJsonValidationErrors(['email']);
 
    Mail::assertNotSent(VerifyEmailMail::class);
});

// TEST 6.2
test('registration fails if user registers an existing username', function () {
 
    Mail::fake();
 
    $location = Location::where('level_id', 3)->first();
 
    User::factory()->create([
        'username' => 'takenusername',
        'role_id' => 3,
    ]);
 
    $response = $this->postJson('/api/auth/register', [
        'username' => 'takenusername',
        'email' => 'freshemail@gmail.com',
        'first_name' => 'new',
        'last_name' => 'user',
        'firebase_uid' => 'TDfpcldrRxZWyC8yPShuaESwZ843',
        'location_id' => $location->id,
        'avatar_seed' => 'DUPEUSER',
    ]);
 
    $response->assertStatus(422);
 
    $response->assertJsonValidationErrors(['username']);
 
    Mail::assertNotSent(VerifyEmailMail::class);
});


//----LOGIN----

// Test 7.1
test('login requires bearer token', function () {
 
    $response = $this->postJson('/api/auth/login');
 
    $response->assertStatus(401);
 
    $response->assertJson([
        'error' => 'No token provided',
    ]);
});

// Test 2.2
test('user can login successfully', function () {
 
    $idToken = individualToken();
 
    $response = $this->withHeaders([
        'Authorization' => "Bearer {$idToken}",
    ])->postJson('/api/auth/login');
 
    $response->assertOk();
 
    $response->assertJsonStructure([
        'user_id',
        'username',
        'email',
        'role',
    ]);
});

 

// Test 8
test('login fails when email is not verified', function () {
 
    $idToken = unverifiedTestIdToken();
 
    $response = $this->withHeaders([
        'Authorization' => "Bearer {$idToken}",
    ])->postJson('/api/auth/login');
 
    $response->assertStatus(403);
 
    $response->assertJson([
        'error' => 'Email not verified',
    ]);
});

// Test 9
test('login fails when account is deactivated', function () {
 
    $idToken = individualToken();
 
    $verifiedUid = env('FIREBASE_TEST_VERIFIED_UID');
 
    if (! $verifiedUid) {
        $this->fail('Set FIREBASE_TEST_VERIFIED_UID in .env.testing (the Firebase UID for the verified test account) to run this test.');
    }
 
    $userAuth = UserAuth::where('identity_uid', $verifiedUid)->first();
 
    expect($userAuth)->not->toBeNull();
    expect($userAuth->user)->not->toBeNull();
 
    $userAuth->user->update(['deactivated_at' => now()]);
 
    $response = $this->withHeaders([
        'Authorization' => "Bearer {$idToken}",
    ])->postJson('/api/auth/login');
 
    $response->assertStatus(403);
 
    $response->assertJson([
        'error' => 'Account disabled',
    ]);
 
    $userAuth->user->update(['deactivated_at' => null]);
});

// Test 7
test('login fails when token is invalid', function () {
 
    $response = $this->withHeaders([
        'Authorization' => 'Bearer this-is-not-a-real-firebase-token',
    ])->postJson('/api/auth/login');
 
    $response->assertStatus(401);
 
    $response->assertJsonStructure([
        'error',
        'details',
    ]);
});
 

//----LOGOUT----

//Test 3.1
test('user can logout', function () {
 
    $idToken = individualToken();
 
    $response = $this->withHeaders([
        'Authorization' => "Bearer {$idToken}",
    ])->postJson('/api/auth/logout');
 
    $response->assertOk();
 
    $response->assertJson([
        'message' => 'Logged out successfully',
    ]);
});

//Test 3.2
test('logout requires authentication', function () {

    $response = $this->postJson('/api/auth/logout');

    $response->assertUnauthorized();

    $response->assertJson([
        'error' => 'Unauthorized',
        'message' => 'No authentication token provided.',
    ]);
});

//-----RESEND VERIFICATION-----

// Test 11
test('verification email can be resent', function () {

    Mail::fake();

    // Create the application user that corresponds to the real Firebase account.
    $user = User::create([
        'username' => 'resendtest',
        'email' => 'pesting@gmail.com',
        'role_id' => 3,
        'avatar_seed' => 'RESEND01',
        'created_at' => now(),
    ]);

    $user->userAuth()->create([
        'identity_uid' => 'TDfpcldrRxZWyC8yPShuaESwZ843',
    ]);

    $response = $this->postJson('/api/email/resend-verification', [
        'email' => 'pesting@gmail.com',
    ]);

    $response->assertOk();

    $response->assertJson([
        'message' => 'Verification email resent successfully.',
    ]);

    Mail::assertSent(VerifyEmailMail::class);
});

// Test 10
test('cannot resend verification for unknown email', function () {

    Mail::fake();

    $response = $this->postJson('/api/email/resend-verification', [
        'email' => 'doesnotexist@gmail.com',
    ]);

    $response->assertNotFound();

    $response->assertJson([
        'error' => 'User not found.',
    ]);

    Mail::assertNotSent(VerifyEmailMail::class);
});

//----FORGOT PASSWORD----

// New Test
test('forgot password returns generic response for unknown email', function () {
 
    Mail::fake();
 
    $response = $this->postJson('/api/forgot-password', [
        'email' => 'doesnotexist@gmail.com',
    ]);
 
    $response->assertOk();
 
    $response->assertJson([
        'message' => 'If an account with that email exists, a password reset email has been sent.',
    ]);
 
    Mail::assertNotSent(ForgotPasswordMail::class);
});

// New Test
test('forgot password rejects deactivated account', function () {
 
    Mail::fake();
 
    User::factory()->create([
        'email' => 'deactivated@gmail.com',
        'role_id' => 3,
        'deactivated_at' => now(),
    ]);
 
    $response = $this->postJson('/api/forgot-password', [
        'email' => 'deactivated@gmail.com',
    ]);
 
    $response->assertStatus(403);
 
    $response->assertJson([
        'error' => 'This account has been deactivated.',
    ]);
 
    Mail::assertNotSent(ForgotPasswordMail::class);
});

// New Test
test('forgot password sends email for active account', function () {

    Mail::fake();

    $user = User::create([
        'username' => 'forgotpwtest',
        'email' => 'pesting@gmail.com', // Must match the real Firebase account
        'role_id' => 3,
        'avatar_seed' => 'FORGOTPW',
        'created_at' => now(),
    ]);

    $user->userAuth()->create([
        'identity_uid' => 'TDfpcldrRxZWyC8yPShuaESwZ843',
    ]);

    $response = $this->postJson('/api/forgot-password', [
        'email' => 'pesting@gmail.com',
    ]);

    $response->assertOk();

    $response->assertJson([
        'message' => 'If an account with that email exists, a password reset email has been sent.',
    ]);

    Mail::assertSent(ForgotPasswordMail::class);
});