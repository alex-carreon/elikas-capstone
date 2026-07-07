<?php

use App\Http\Middleware\isRoleMiddleware;
use Illuminate\Http\Request;

/**
 * Unit tests for isRoleMiddleware.
 *
 * Fully offline — no Firebase, no DB. $request->attributes 'firebase_user'
 * is stubbed with a plain object carrying whatever role_id we want to test.
 */

function requestWithRole(?int $roleId): Request
{
    $request = Request::create('/api/test', 'GET');

    if ($roleId !== null) {
        $fakeUser = new stdClass();
        $fakeUser->role_id = $roleId;
        $request->attributes->set('firebase_user', $fakeUser);
    }

    return $request;
}

function roleMiddlewareNext(): Closure
{
    return fn(Request $request) => response()->json(['ok' => true]);
}

// Test 1
test('returns 401 when no firebase_user is present on the request', function () {

    $middleware = new isRoleMiddleware();
    $request = requestWithRole(null);

    $response = $middleware->handle($request, roleMiddlewareNext(), 1, 2);

    expect($response->getStatusCode())->toBe(401);
    expect($response->getData(true)['error'])->toBe('Unauthorized');
});

// Test 2
test('allows access when user role_id matches one of the allowed roles', function () {

    $middleware = new isRoleMiddleware();
    $request = requestWithRole(2);

    $response = $middleware->handle($request, roleMiddlewareNext(), 1, 2);

    expect($response->getStatusCode())->toBe(200);
});

// Test 3
test('denies access with 403 when user role_id is not in the allowed roles', function () {

    $middleware = new isRoleMiddleware();
    $request = requestWithRole(3);

    $response = $middleware->handle($request, roleMiddlewareNext(), 1, 2);

    expect($response->getStatusCode())->toBe(403);
    expect($response->getData(true)['error'])->toBe('Forbidden');
});


// Test 4
test('denies access when allowed roles list is empty', function () {

    $middleware = new isRoleMiddleware();
    $request = requestWithRole(1);

    $response = $middleware->handle($request, roleMiddlewareNext());

    expect($response->getStatusCode())->toBe(403);
});

