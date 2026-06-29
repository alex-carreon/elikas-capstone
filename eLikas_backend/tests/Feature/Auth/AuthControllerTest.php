<?php

use App\Mail\VerifyEmailMail;
use App\Models\Location;
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

});

// TEST 6.1
test('registration fails if user registers an existing email', function () {

});

// TEST 2
test('registration fails if user registers an existing username', function () {

});


//----LOGIN----

// Test 2.1
test('login requires bearer token', function () {

});

// Test 2.2
test('user can login successfully', function () {

});

// Test 8
test('login fails when email is not verified', function () {

});

// Test 9
test('login fails when account is deactivated', function () {

});

// Test 7
test('login fails when token is invalid', function () {

});


//----LOGOUT----

//Test 3.1
test('user can logout', function () {

});

//Test 3.2
test('logout requires bearer token', function () {

});

//-----RESEND VERIFICATION-----

// Test 11
test('verification email can be resent', function () {

});

// Test 10
test('cannot resend verification for unknown email', function () {

});

//----FORGOT PASSWORD----

// New Test
test('forgot password returns generic response for unknown email', function () {

});

// New Test
test('forgot password rejects deactivated account', function () {

});

// New Test
test('forgot password sends email for active account', function () {

});