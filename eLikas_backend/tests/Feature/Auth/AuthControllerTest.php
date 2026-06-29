<?php

 
use App\Models\User;
use App\Models\UserAuth;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Kreait\Firebase\Contract\Auth as FirebaseAuth;
use Kreait\Firebase\Auth\UserRecord;
use Lcobucci\JWT\UnencryptedToken;


beforeEach(function () {
    Mail::fake();
});

//
// REGISTER
//
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

test('user can register successfully', function () {

});

test('registration fails with invalid firebase uid', function () {

});


//
// LOGIN
//

test('login requires bearer token', function () {

});

test('user can login successfully', function () {

});

test('login fails when email is not verified', function () {

});

test('login fails when account is deactivated', function () {

});


//
// LOGOUT
//

test('user can logout', function () {

});

test('logout requires bearer token', function () {

});

//
// RESEND VERIFICATION
//

test('verification email can be resent', function () {

});

test('cannot resend verification for unknown email', function () {

});

//
// FORGOT PASSWORD
//

test('forgot password returns generic response for unknown email', function () {

});

test('forgot password rejects deactivated account', function () {

});

test('forgot password sends email for active account', function () {

});