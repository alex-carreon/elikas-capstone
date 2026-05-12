<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Kreait\Firebase\Contract\Auth as FirebaseAuth;

// Models
use App\Models\UserAuth;

class ProfileController extends Controller
{   
    public function __construct(protected FirebaseAuth $firebaseAuth) {}

    // ---------------------------------------------------------------
    // PROFILE
    // ---------------------------------------------------------------
    public function profile(Request $request)
    {
        try {

            // Get Firebase token
            $token = $request->bearerToken();

            if (!$token) {
                return response()->json([
                    'error' => 'No token provided'
                ], 401);
            }

            // Verify token
            $verifiedToken = $this->firebaseAuth->verifyIdToken($token);

            // Firebase UID
            $firebaseUid = $verifiedToken->claims()->get('sub');

            // Find user
            $userAuth = UserAuth::with([
                'user.role',
                'user.name',
                'user.phoneNumber',
                'user.indivAcc.location'
            ])
            ->where('identity_uid', $firebaseUid)
            ->first();

            if (!$userAuth || !$userAuth->user) {
                return response()->json([
                    'error' => 'User not found'
                ], 404);
            }

            $user = $userAuth->user;

            return response()->json([
                'id' => $user->id,
                'username' => $user->username,
                'email' => $user->email,
                'role' => $user->role->role_name,

                'first_name' => $user->name?->first_name,
                'last_name' => $user->name?->last_name,

                'phone' => $user->phoneNumber?->phone_no,

                'location' => $user->indivAcc?->location?->name,
            ]);

        } catch (\Exception $e) {

            return response()->json([
                'error' => 'Failed to fetch profile',
                'details' => $e->getMessage()
            ], 500);
        }
    }
}
