<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;
use Kreait\Firebase\Contract\Auth as FirebaseAuth;
use Kreait\Firebase\Exception\Auth\FailedToVerifyToken;
use Kreait\Firebase\Exception\Auth\RevokedIdToken;
use App\Models\UserAuth;

/**
    * Middleware to authenticate API requests using Firebase ID Tokens.
 */
class FirebaseAuthMiddleware
{
    public function __construct(protected FirebaseAuth $firebaseAuth) {}

    public function handle(Request $request, Closure $next): Response
    {
        // ── 1. Extract Bearer Token ───────────────────────────────────────────
        $token = $request->bearerToken();

        if (!$token) {
            return $this->unauthorizedResponse('No authentication token provided.');
        }

        try {
        $verifiedToken = $this->firebaseAuth->verifyIdToken($token, checkIfRevoked: true);

        } catch (RevokedIdToken $e) {
        // Explicit revocation (logout, password change, admin revoke)
        return $this->unauthorizedResponse('Session has been revoked. Please sign in again.', 401);

        } catch (FailedToVerifyToken $e) {
        $reason = strtolower($e->getMessage());

            $message = match (true) {
            str_contains($reason, 'expired')  => 'Authentication token has expired. Please re-authenticate.',
            str_contains($reason, 'future')   => 'Authentication token has an invalid issue time.',
            str_contains($reason, 'audience') => 'Authentication token was issued for a different project.',
            default                           => 'Authentication token is invalid: ' . $e->getMessage(),
            };

    return $this->unauthorizedResponse($message, 401);

} catch (\Throwable $e) {
    return $this->unauthorizedResponse('Token verification failed: ' . $e->getMessage(), 401);
}

        // ── 3. Extract Firebase UID from verified token claims ────────────────
        $firebaseUid = $verifiedToken->claims()->get('sub');

        if (empty($firebaseUid)) {
            return $this->unauthorizedResponse('Verified token is missing a subject claim.', 401);
        }

        // ── 4. Resolve local User via UserAuth mapping table ──────────────────
        $userAuth = UserAuth::with('user')
            ->where('identity_uid', $firebaseUid)
            ->first();

        if (!$userAuth) {
            return $this->unauthorizedResponse(
                'No local account is mapped to this Firebase identity. Please complete registration.',
                404
            );
        }

        if (!$userAuth->user) {
            // Orphaned UserAuth row — the Users record was deleted externally.
            return $this->unauthorizedResponse(
                'The account associated with this identity no longer exists.',
                404
            );
        }

        $user = $userAuth->user;

        // ── 5. Block deactivated accounts ─────────────────────────────────────
        if ($user->deactivated_at !== null) {
            return response()->json([
                'error'          => 'Account deactivated.',
                'deactivated_at' => $user->deactivated_at->toISOString(),
                'message'        => 'This account has been disabled. Contact support if you believe this is an error.',
            ], 403);
        }

        // ── 6. Inject resolved User model into request attributes ─────────────
        // Controllers retrieve this via: $request->get('firebase_user')
        $request->attributes->set('firebase_user', $user);

        return $next($request);
    }

    // ── Private Helpers ───────────────────────────────────────────────────────

    private function unauthorizedResponse(string $message, int $status = 401): Response
    {
        return response()->json([
            'error'   => 'Unauthorized',
            'message' => $message,
        ], $status);
    }
}
