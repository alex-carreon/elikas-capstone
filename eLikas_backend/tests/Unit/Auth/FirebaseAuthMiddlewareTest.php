<?php

use App\Http\Middleware\FirebaseAuthMiddleware;
use App\Models\User;
use App\Models\UserAuth;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Kreait\Firebase\Contract\Auth as FirebaseAuth;
use Kreait\Firebase\Exception\Auth\FailedToVerifyToken;
use Kreait\Firebase\Exception\Auth\RevokedIdToken;
use Lcobucci\JWT\Token\DataSet;
use Lcobucci\JWT\UnencryptedToken;

/**
 * Unit tests for FirebaseAuthMiddleware.
 *
 * These bypass real Firebase token exchange entirely — verifyIdToken() is
 * mocked to return/throw whatever we need, so every branch can be tested
 * deterministically and offline. UserAuth/User rows are real DB rows
 * (via DatabaseTransactions) since Eloquent statics aren't worth mocking.
 */

// ── Helpers ───────────────────────────────────────────────────────────────────

/**
 * Build a fake verified Firebase token whose claims()->get('sub') returns the given UID. 
 */
function fakeVerifiedToken(?string $sub): UnencryptedToken
{
    $claims = new DataSet(
        $sub !== null ? ['sub' => $sub] : [],
        'placeholder-encoded-claims-string'
    );

    $token = Mockery::mock(UnencryptedToken::class);
    $token->shouldReceive('claims')->andReturn($claims);

    return $token;
}

/**
 * Instantiate the middleware with a mocked FirebaseAuth dependency.
 */
function middlewareWithMockedAuth(callable $configureMock): FirebaseAuthMiddleware
{
    $firebaseAuth = Mockery::mock(FirebaseAuth::class);
    $configureMock($firebaseAuth);

    return new FirebaseAuthMiddleware($firebaseAuth);
}

/**
 * A closure that returns a simple 200 response, standing in for $next().
 */
function passThroughNext(): Closure
{
    return fn(Request $request) => response()->json(['ok' => true, 'user_id' => $request->attributes->get('firebase_user')?->id]);
}

// ── No token provided ────────────────────────────────────────────────────────

// Test 1
test('returns 401 when no bearer token is provided', function () {

    $middleware = middlewareWithMockedAuth(function ($mock) {
        $mock->shouldNotReceive('verifyIdToken');
    });

    $request = Request::create('/api/test', 'GET');

    $response = $middleware->handle($request, passThroughNext());

    expect($response->getStatusCode())->toBe(401);
    expect($response->getData(true)['message'])->toBe('No authentication token provided.');
});

// ── Revoked token ─────────────────────────────────────────────────────────────

// Test 2
test('returns 401 when token has been revoked', function () {

    $fakeToken = Mockery::mock(Token::class);

    $middleware = middlewareWithMockedAuth(function ($mock) use ($fakeToken) {
        $mock->shouldReceive('verifyIdToken')
            ->once()
            ->andThrow(new RevokedIdToken($fakeToken));
    });

    $request = Request::create('/api/test', 'GET');
    $request->headers->set('Authorization', 'Bearer fake-revoked-token');

    $response = $middleware->handle($request, passThroughNext());

    expect($response->getStatusCode())->toBe(401);
    expect($response->getData(true)['message'])->toBe('Session has been revoked. Please sign in again.');
});

// ── FailedToVerifyToken variants (message-based branching) ─────────────────────

// Test 3
test('returns expired-token message when verification failure mentions expired', function () {

    $middleware = middlewareWithMockedAuth(function ($mock) {
        $mock->shouldReceive('verifyIdToken')
            ->once()
            ->andThrow(new FailedToVerifyToken('Token has Expired'));
    });

    $request = Request::create('/api/test', 'GET');
    $request->headers->set('Authorization', 'Bearer fake-token');

    $response = $middleware->handle($request, passThroughNext());

    expect($response->getStatusCode())->toBe(401);
    expect($response->getData(true)['message'])->toBe('Authentication token has expired. Please re-authenticate.');
});

// Test 4
test('returns future-issue-time message when verification failure mentions future', function () {

    $middleware = middlewareWithMockedAuth(function ($mock) {
        $mock->shouldReceive('verifyIdToken')
            ->once()
            ->andThrow(new FailedToVerifyToken('Token used in the Future'));
    });

    $request = Request::create('/api/test', 'GET');
    $request->headers->set('Authorization', 'Bearer fake-token');

    $response = $middleware->handle($request, passThroughNext());

    expect($response->getStatusCode())->toBe(401);
    expect($response->getData(true)['message'])->toBe('Authentication token has an invalid issue time.');
});

// Test 5
test('returns audience-mismatch message when verification failure mentions audience', function () {

    $middleware = middlewareWithMockedAuth(function ($mock) {
        $mock->shouldReceive('verifyIdToken')
            ->once()
            ->andThrow(new FailedToVerifyToken('Invalid Audience for this project'));
    });

    $request = Request::create('/api/test', 'GET');
    $request->headers->set('Authorization', 'Bearer fake-token');

    $response = $middleware->handle($request, passThroughNext());

    expect($response->getStatusCode())->toBe(401);
    expect($response->getData(true)['message'])->toBe('Authentication token was issued for a different project.');
});

// Test 6
test('returns generic invalid-token message for unrecognized verification failures', function () {

    $middleware = middlewareWithMockedAuth(function ($mock) {
        $mock->shouldReceive('verifyIdToken')
            ->once()
            ->andThrow(new FailedToVerifyToken('Some completely different failure reason'));
    });

    $request = Request::create('/api/test', 'GET');
    $request->headers->set('Authorization', 'Bearer fake-token');

    $response = $middleware->handle($request, passThroughNext());

    expect($response->getStatusCode())->toBe(401);
    expect($response->getData(true)['message'])->toBe('Authentication token is invalid: Some completely different failure reason');
});

// ── Any other unexpected throwable ──────────────────────────────────────────────

// Test 7
test('returns 401 with wrapped message for unexpected exceptions during verification', function () {

    $middleware = middlewareWithMockedAuth(function ($mock) {
        $mock->shouldReceive('verifyIdToken')
            ->once()
            ->andThrow(new \RuntimeException('Network unreachable'));
    });

    $request = Request::create('/api/test', 'GET');
    $request->headers->set('Authorization', 'Bearer fake-token');

    $response = $middleware->handle($request, passThroughNext());

    expect($response->getStatusCode())->toBe(401);
    expect($response->getData(true)['message'])->toBe('Token verification failed: Network unreachable');
});

// ── Missing subject claim ────────────────────────────────────────────────────

// Test 8
test('returns 401 when verified token has no subject claim', function () {

    $middleware = middlewareWithMockedAuth(function ($mock) {
        $mock->shouldReceive('verifyIdToken')
            ->once()
            ->andReturn(fakeVerifiedToken(null));
    });

    $request = Request::create('/api/test', 'GET');
    $request->headers->set('Authorization', 'Bearer fake-token');

    $response = $middleware->handle($request, passThroughNext());

    expect($response->getStatusCode())->toBe(401);
    expect($response->getData(true)['message'])->toBe('Verified token is missing a subject claim.');
});

// ── No local UserAuth mapping ─────────────────────────────────────────────────

// Test 9
test('returns 404 when no local account is mapped to the Firebase identity', function () {

    $middleware = middlewareWithMockedAuth(function ($mock) {
        $mock->shouldReceive('verifyIdToken')
            ->once()
            ->andReturn(fakeVerifiedToken('some-uid-with-no-mapping'));
    });

    $request = Request::create('/api/test', 'GET');
    $request->headers->set('Authorization', 'Bearer fake-token');

    $response = $middleware->handle($request, passThroughNext());

    expect($response->getStatusCode())->toBe(404);
    expect($response->getData(true)['message'])->toBe('No local account is mapped to this Firebase identity. Please complete registration.');
});

// ── Orphaned UserAuth (user row deleted externally) ─────────────────────────────

// Test 10
test('returns 404 when UserAuth exists but its User has been deleted', function () {

    $uid = 'orphaned-uid-' . uniqid();

    $orphanUser = User::factory()->create();
    $userAuth = UserAuth::create([
        'identity_uid' => $uid,
        'user_id'      => $orphanUser->id,
    ]);

    DB::statement('SET FOREIGN_KEY_CHECKS=0');
    $orphanUser->delete();
    DB::statement('SET FOREIGN_KEY_CHECKS=1');

    $middleware = middlewareWithMockedAuth(function ($mock) use ($uid) {
        $mock->shouldReceive('verifyIdToken')
            ->once()
            ->andReturn(fakeVerifiedToken($uid));
    });

    $request = Request::create('/api/test', 'GET');
    $request->headers->set('Authorization', 'Bearer fake-token');

    $response = $middleware->handle($request, passThroughNext());

    expect($response->getStatusCode())->toBe(404);
    expect($response->getData(true)['message'])->toBe('The account associated with this identity no longer exists.');
});

// ── Deactivated account ──────────────────────────────────────────────────────

// Test 11
test('returns 403 when the resolved user account is deactivated', function () {

    $uid = 'deactivated-uid-' . uniqid();
    $user = User::factory()->create(['deactivated_at' => now()]);
    UserAuth::create(['identity_uid' => $uid, 'user_id' => $user->id]);

    $middleware = middlewareWithMockedAuth(function ($mock) use ($uid) {
        $mock->shouldReceive('verifyIdToken')
            ->once()
            ->andReturn(fakeVerifiedToken($uid));
    });

    $request = Request::create('/api/test', 'GET');
    $request->headers->set('Authorization', 'Bearer fake-token');

    $response = $middleware->handle($request, passThroughNext());

    expect($response->getStatusCode())->toBe(403);
    expect($response->getData(true)['error'])->toBe('Account deactivated.');
});

// ── Happy path ────────────────────────────────────────────────────────────────

// Test 12
test('injects resolved user into request attributes and calls next on success', function () {

    $uid = 'valid-uid-' . uniqid();
    $user = User::factory()->create(['deactivated_at' => null]);
    UserAuth::create(['identity_uid' => $uid, 'user_id' => $user->id]);

    $middleware = middlewareWithMockedAuth(function ($mock) use ($uid) {
        $mock->shouldReceive('verifyIdToken')
            ->once()
            ->andReturn(fakeVerifiedToken($uid));
    });

    $request = Request::create('/api/test', 'GET');
    $request->headers->set('Authorization', 'Bearer fake-token');

    $response = $middleware->handle($request, passThroughNext());

    expect($response->getStatusCode())->toBe(200);
    expect($response->getData(true)['user_id'])->toBe($user->id);
});