<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Kreait\Firebase\Contract\Auth as FirebaseAuth;

// models
use App\Models\User;
use App\Models\UserAuth;

class AuthController extends Controller
{
    // Laravel will automatically inject the Firebase Auth service here
    public function __construct(protected FirebaseAuth $firebaseAuth) {}

    // ---------------------------------------------------------------
    // REGISTER — called when a Citizen signs up [testing commit]
    // ---------------------------------------------------------------
    public function register(Request $request)
    {
        // Step 1: Validate that the required fields were sent
        $request->validate([
            'username'     => 'required|string|max:20|unique:Users,username',
            'email'        => 'required|email|max:50|unique:Users,email',
            'first_name'   => 'required|string|max:50',
            'last_name'    => 'required|string|max:50',
            'phone'        => 'nullable|string|max:20',
            'firebase_uid' => 'required|string',
            'location_id'  => 'required|integer',
        ]);
        

        // Step 2: Verify the Firebase UID actually exists in Firebase
        // This prevents anyone from sending a fake UID
        try {
            $this->firebaseAuth->getUser($request->firebase_uid);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Invalid Firebase user'], 401);
        }

        // Step 3: Save everything to the database inside a transaction
        // A transaction means: if ANY step fails, ALL steps are undone
        try {
            DB::beginTransaction();

            // Insert into users table — role_id 3 = 'indiv' (Citizen)
            $user = User::create([
                'username'   => $request->username,
                'email'      => $request->email,
                'role_id'    => 3,
                'created_at' => now(),
            ]);


            // Link the Firebase UID to this user
            $user->userAuth()->create([
                'identity_uid' => $request->firebase_uid,
            ]);

            // Save the user's name
            $user->name()->create([
                'first_name' => $request->first_name,
                'last_name'  => $request->last_name,
            ]);

            // Save phone number if provided
            if ($request->phone) {
                $user->phoneNumber()->create([
                    'phone_no' => $request->phone,
                ]);
            }

            // Create the citizen profile record
            // $user->indivAcc()->create([]);

            $user->indivAcc()->create([
                'location_id' => $request->location_id,
            ]);


            DB::commit(); // Everything succeeded — save it all

            return response()->json([
                'message' => 'User registered successfully',
                'user_id' => $user->id,
            ], 201);

        } catch (\Exception $e) {

            DB::rollBack(); // Something failed — undo everything

            return response()->json([
                'message' => 'Registration failed',
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ], 500);
        }
    }

    // ---------------------------------------------------------------
    // LOGIN — called after Firebase login to get the user's role
    // ---------------------------------------------------------------
    public function login(Request $request)
    {
        // The React app sends the Firebase ID token in the Authorization header
        // It looks like: "Bearer eyJhbGci..."
        $token = $request->bearerToken();

        if (!$token) {
            return response()->json(['error' => 'No token provided'], 401);
        }

        // Verify the token with Firebase
        try {
            $verifiedToken = $this->firebaseAuth->verifyIdToken($token);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Invalid or expired token'], 401);
        }

        // Get the Firebase UID from the verified token
        $firebaseUid = $verifiedToken->claims()->get('sub');

        // Look up this user in our database
        $userAuth = UserAuth::with(['user.role'])
            ->where('identity_uid', $firebaseUid)
            ->first();

        if (
            !$userAuth ||
            !$userAuth->user ||
            $userAuth->user->deactivated_at
        ) {
            return response()->json([
                'error' => 'User not found'
            ], 404);
        }

        $user = $userAuth->user;

        return response()->json([
            'user_id'  => $user->id,
            'username' => $user->username,
            'email'    => $user->email,
            'role'     => $user->role->role_name,
        ]);
    }

    // ---------------------------------------------------------------
    // LOGOUT
    // ---------------------------------------------------------------
    public function logout(Request $request)
    {
        try {
            // Get Firebase token from Authorization header
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

            // Optional:
            // revoke all refresh tokens for this Firebase user
            // this forces re-login on all devices
            $this->firebaseAuth->revokeRefreshTokens($firebaseUid);

            return response()->json([
                'message' => 'Logged out successfully'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Logout failed',
                'details' => $e->getMessage()
            ], 500);
        }
    }
}
