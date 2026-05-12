<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Kreait\Firebase\Contract\Auth as FirebaseAuth;
use App\Models\UserAuth;

class FirebaseAuthMiddleware
{
    public function __construct(protected FirebaseAuth $firebaseAuth) {}

    public function handle(Request $request, Closure $next): Response
    {
        try {

            // Get token
            $token = $request->bearerToken();

            if (!$token) {
                return response()->json([
                    'error' => 'No token provided'
                ], 401);
            }

            // Verify Firebase token
            $verifiedToken = $this->firebaseAuth->verifyIdToken($token);

            // Get Firebase UID
            $firebaseUid = $verifiedToken->claims()->get('sub');

            // Find database user
            $userAuth = UserAuth::with('user')
                ->where('identity_uid', $firebaseUid)
                ->first();

            if (!$userAuth || !$userAuth->user) {
                return response()->json([
                    'error' => 'User not found'
                ], 404);
            }

            // Attach user to request
            $request->attributes->set('firebase_user', $userAuth->user);

            return $next($request);

        } catch (\Exception $e) {

            return response()->json([
                'error' => 'Unauthorized',
                'details' => $e->getMessage()
            ], 401);
        }
    }
}