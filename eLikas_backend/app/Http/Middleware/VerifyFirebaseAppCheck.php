<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Kreait\Firebase\Contract\AppCheck;
use Throwable;

class VerifyFirebaseAppCheck
{
    public function __construct(private AppCheck $appCheck) {}

    public function handle(Request $request, Closure $next)
    {
        // 1. Check if a local debug token is configured in the environment
        $debugToken = env('FIREBASE_APP_CHECK_DEBUG_TOKEN');

        if ($debugToken) {
            // 2. Extract the incoming token from the App Check header
            $incomingToken = $request->header('X-Firebase-AppCheck');

            // 3. If it matches your secret E2E token, let the request pass seamlessly
            if ($incomingToken === $debugToken) {
                return $next($request);
            }
        }

        $token = $request->header('X-Firebase-AppCheck');

        if (!$token) {
            return response()->json(['error' => 'Missing App Check token'], 401);
        }

        try {
            $this->appCheck->verifyToken($token);
        } catch (Throwable $e) {
            return response()->json(['error' => 'Failed app integrity check'], 401);
        }

        return $next($request);
    }
}
