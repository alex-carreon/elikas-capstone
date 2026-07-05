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