<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Kreait\Firebase\Contract\Auth as FirebaseAuth;
use App\Models\UserAuth;

class OptionalFirebaseAuthMiddleware
{
    public function __construct(
        protected FirebaseAuth $firebaseAuth
    ) {}

    public function handle(Request $request, Closure $next)
    {
        $token = $request->bearerToken();

        if (!$token) {
            return $next($request);
        }

        try {
            $verifiedToken = $this->firebaseAuth->verifyIdToken(
                $token,
                checkIfRevoked: true
            );

            $firebaseUid = $verifiedToken->claims()->get('sub');

            if ($firebaseUid) {
                $userAuth = UserAuth::with('user')
                    ->where('identity_uid', $firebaseUid)
                    ->first();

                if ($userAuth && $userAuth->user) {
                    $request->attributes->set(
                        'firebase_user',
                        $userAuth->user
                    );
                }
            }
        } catch (\Throwable $e) {
            // Ignore invalid token and continue as guest
        }

        return $next($request);
    }
}