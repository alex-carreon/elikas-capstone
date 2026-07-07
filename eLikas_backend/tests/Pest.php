<?php

use App\Models\User;
use App\Models\UserAuth;
use Illuminate\Foundation\Testing\DatabaseTransactions;
use Tests\TestCase;

/*
|--------------------------------------------------------------------------
| Test Case
|--------------------------------------------------------------------------
|
| The closure you provide to your test functions is always bound to a specific PHPUnit test
| case class. By default, that class is "PHPUnit\Framework\TestCase". Of course, you may
| need to change it using the "pest()" function to bind different classes or traits.
|
*/
    
pest()->extend(TestCase::class)
    ->use(DatabaseTransactions::class)
    ->in('Feature', 'Unit');

/*
|--------------------------------------------------------------------------
| Expectations
|--------------------------------------------------------------------------
|
| When you're writing tests, you often need to check that values meet certain conditions. The
| "expect()" function gives you access to a set of "expectations" methods that you can use
| to assert different things. Of course, you may extend the Expectation API at any time.
|
*/

expect()->extend('toBeOne', function () {
    return $this->toBe(1);
});

/*
|--------------------------------------------------------------------------
| Functions
|--------------------------------------------------------------------------
|
| While Pest is very powerful out-of-the-box, you may have some testing code specific to your
| project that you don't want to repeat in every file. Here you can also expose helpers as
| global functions to help you to reduce the number of lines of code in your test files.
|
*/

function something()
{
    // ..
}

function freshFirebaseIdToken(string $refreshToken): string
{
    $apiKey = env('FIREBASE_WEB_API_KEY');
 
    if (! $apiKey) {
        test()->fail('FIREBASE_WEB_API_KEY is not set in .env.testing.');
    }
 
    $response = Illuminate\Support\Facades\Http::asForm()->post(
        "https://securetoken.googleapis.com/v1/token?key={$apiKey}",
        [
            'grant_type'    => 'refresh_token',
            'refresh_token' => $refreshToken,
        ]
    );
 
    if ($response->failed()) {
        test()->fail(
            'Failed to exchange Firebase refresh token. Response: '
            . $response->body()
        );
    }
 
    return $response->json('id_token');
}
 
/** Role 3 individual — email verified. */
function individualToken(): string
{
    return freshFirebaseIdToken(env('FIREBASE_TEST_VERIFIED_REFRESH_TOKEN'));
}
 
/** Role 1 admin. */
function adminToken(): string
{
    return freshFirebaseIdToken(env('FIREBASE_TEST_ADMIN_REFRESH_TOKEN'));
}
 
/** Role 2 govops. */
function govopsToken(): string
{
    return freshFirebaseIdToken(env('FIREBASE_TEST_GOVOPS_REFRESH_TOKEN'));
}
 
/** Role 3 individual — email NOT verified (used only in AuthControllerTest). */
function unverifiedTestIdToken(): string
{
    return freshFirebaseIdToken(env('FIREBASE_TEST_UNVERIFIED_REFRESH_TOKEN'));
}

/** Role 2 govops user model (paired with govopsToken()). */
function govopsUser(): User
{
    $uid = env('FIREBASE_TEST_GOVOPS_UID');
    $auth = UserAuth::with('user.govOp')->where('identity_uid', $uid)->first();

    if (! $auth || ! $auth->user) {
        test()->fail("No UserAuth row for FIREBASE_TEST_GOVOPS_UID [{$uid}].");
    }

    return $auth->user;
}

function individualUser(): User
{
    $uid = env('FIREBASE_TEST_VERIFIED_UID');
    $auth = UserAuth::with('user')->where('identity_uid', $uid)->first();

    if (! $auth || ! $auth->user) {
        test()->fail("No UserAuth row for FIREBASE_TEST_VERIFIED_UID [{$uid}].");
    }

    return $auth->user;
}