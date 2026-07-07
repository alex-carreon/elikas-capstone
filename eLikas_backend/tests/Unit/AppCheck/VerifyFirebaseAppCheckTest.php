<?php

use App\Http\Middleware\VerifyFirebaseAppCheck;
use Illuminate\Http\Request;
use Kreait\Firebase\Contract\AppCheck;
use Kreait\Firebase\AppCheck\DecodedAppCheckToken;
use Kreait\Firebase\AppCheck\VerifyAppCheckTokenResponse;

/**
 * Unit tests for VerifyFirebaseAppCheck.
 *
 * Fully offline — AppCheck::verifyToken() is mocked, no real Firebase call,
 * no DB involved.
 */

function appCheckMiddlewareNext(): Closure
{
    return fn(Request $request) => response()->json(['ok' => true]);
}

// Test 1
test('returns 401 when X-Firebase-AppCheck header is missing', function () {

    $appCheck = Mockery::mock(AppCheck::class);
    $appCheck->shouldNotReceive('verifyToken');

    $middleware = new VerifyFirebaseAppCheck($appCheck);

    $request = Request::create('/api/test', 'GET');

    $response = $middleware->handle($request, appCheckMiddlewareNext());

    expect($response->getStatusCode())->toBe(401);
    expect($response->getData(true)['error'])->toBe('Missing App Check token');
});

// Test 2
test('returns 401 when App Check token verification throws', function () {

    $appCheck = Mockery::mock(AppCheck::class);
    $appCheck->shouldReceive('verifyToken')
        ->once()
        ->with('bad-token')
        ->andThrow(new \RuntimeException('Invalid App Check token'));

    $middleware = new VerifyFirebaseAppCheck($appCheck);

    $request = Request::create('/api/test', 'GET');
    $request->headers->set('X-Firebase-AppCheck', 'bad-token');

    $response = $middleware->handle($request, appCheckMiddlewareNext());

    expect($response->getStatusCode())->toBe(401);
    expect($response->getData(true)['error'])->toBe('Failed app integrity check');
});

// Test 12.3
test('calls next and passes through when App Check token is valid', function () {

    $decodedToken = DecodedAppCheckToken::fromArray([
        'app_id' => 'test-app-id',
        'aud'    => ['projects/test-project'],
        'exp'    => now()->addHour()->timestamp,
        'iat'    => now()->timestamp,
        'iss'    => 'https://firebaseappcheck.googleapis.com/test-project',
        'sub'    => 'test-app-id',
    ]);

    $response = new VerifyAppCheckTokenResponse(
        appId: 'test-app-id',
        token: $decodedToken,
        alreadyConsumed: false,
    );

    $appCheck = Mockery::mock(AppCheck::class);
    $appCheck->shouldReceive('verifyToken')
        ->once()
        ->with('valid-token')
        ->andReturn($response);

    $middleware = new VerifyFirebaseAppCheck($appCheck);

    $request = Request::create('/api/test', 'GET');
    $request->headers->set('X-Firebase-AppCheck', 'valid-token');

    $response = $middleware->handle($request, appCheckMiddlewareNext());

    expect($response->getStatusCode())->toBe(200);
    expect($response->getData(true)['ok'])->toBeTrue();
});

// Test 4
test('catches any throwable type, not just Firebase-specific exceptions', function () {

    $appCheck = Mockery::mock(AppCheck::class);
    $appCheck->shouldReceive('verifyToken')
        ->once()
        ->andThrow(new \Error('Unexpected type error'));

    $middleware = new VerifyFirebaseAppCheck($appCheck);

    $request = Request::create('/api/test', 'GET');
    $request->headers->set('X-Firebase-AppCheck', 'some-token');

    $response = $middleware->handle($request, appCheckMiddlewareNext());

    expect($response->getStatusCode())->toBe(401);
    expect($response->getData(true)['error'])->toBe('Failed app integrity check');
});

