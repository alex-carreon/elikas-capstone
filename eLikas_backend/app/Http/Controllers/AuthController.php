<?php

namespace App\Http\Controllers;

use App\Jobs\SendVerificationEmailJob;
use App\Mail\ForgotPasswordMail;
use App\Mail\VerifyEmailMail;
use App\Models\User;
use App\Models\UserAuth;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Mail;
use Kreait\Firebase\Contract\Auth as FirebaseAuth;

class AuthController extends Controller
{
    public function __construct(protected FirebaseAuth $firebaseAuth) {}

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
            'avatar_seed'  => 'required|string|size:8',
        ]);
        

        // Step 2: Verify the Firebase UID actually exists in Firebase
        try {
            $this->firebaseAuth->getUser($request->firebase_uid);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Invalid Firebase user'], 401);
        }

        try {
            DB::beginTransaction();

            // Step 3: Insert into users table role_id 3 = 'indiv'
            $user = User::create([
                'username'   => $request->username,
                'email'      => $request->email,
                'role_id'    => 3,
                'created_at' => now(), 
                'avatar_seed' => $request->avatar_seed,
            ]);


            // Step 4: Link the Firebase UID to this user
            $user->userAuth()->create([
                'identity_uid' => $request->firebase_uid,
            ]);

            // Step 5: Save the user's name
            $user->name()->create([
                'first_name' => $request->first_name,
                'last_name'  => $request->last_name,
            ]);

            // Step 6: Save phone number if provided
            if ($request->phone) {
                $user->phoneNumber()->create([
                    'phone_no' => $request->phone,
                ]);
            }

            // Step 7: Create the citizen profile record
            $user->indivAcc()->create([
                'location_id' => $request->location_id,
            ]);

            // Step 8: Generate Firebase verification link
            $verificationLink = $this->firebaseAuth
                ->getEmailVerificationLink($request->email);

            // Step 9:  email sending 
            Mail::to($user->email)->send(
                new VerifyEmailMail(
                    $user->username,
                    $verificationLink
                )
            );

            DB::commit(); 

            return response()->json([
                'message' => 'User registered successfully',
                'user_id' => $user->id,
            ], 201);

        } catch (\Exception $e) {

            DB::rollBack(); 

            return response()->json([
                'message' => 'Registration failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    public function login(Request $request)
    {
        // The React app sends the Firebase ID token in the Authorization header
        $token = $request->bearerToken();

        if (!$token) {
            return response()->json(['error' => 'No token provided'], 401);
        }

        // Verify the token with Firebase
        try {
            $verifiedToken = $this->firebaseAuth->verifyIdToken($token, true);

            // Check if the user's email is verified in Firebase
            $firebaseUid = $verifiedToken->claims()->get('sub');

            $firebaseUser = $this->firebaseAuth->getUser($firebaseUid);

            if (!$firebaseUser->emailVerified) {
                return response()->json([
                    'error' => 'Email not verified'
                ], 403);
            }

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Unauthorized',
                'details' => $e->getMessage()
            ], 401);
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
                'error' => 'Account disabled'
            ], 403);
        }

        $user = $userAuth->user;

        return response()->json([
            'user_id'  => $user->id,
            'username' => $user->username,
            'email'    => $user->email,
            'role'     => $user->role->role_name,
        ]);
    }

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
            $verifiedToken = $this->firebaseAuth->verifyIdToken($token, true);

            // Get Firebase UID
            $firebaseUid = $verifiedToken->claims()->get('sub');

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

    public function resendVerification(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
        ]);

        try {

            $user = User::where('email', $request->email)
                ->first();

            if (!$user) {
                return response()->json([
                    'error' => 'User not found.',
                ], 404);
            }

            $firebaseUid = $user->userAuth->identity_uid;

            $firebaseUser = $this->firebaseAuth
                ->getUser($firebaseUid);

            if ($firebaseUser->emailVerified) {
                return response()->json([
                    'message' => 'Email is already verified.',
                ]);
            }

            $verificationLink = $this->firebaseAuth
                ->getEmailVerificationLink($firebaseUser->email);

            Mail::to($firebaseUser->email)->send(
                new VerifyEmailMail(
                    $user->username,
                    $verificationLink
                )
            );

            return response()->json([
                'message' => 'Verification email resent successfully.',
            ]);

        } catch (\Exception $e) {

            return response()->json([
                'error' => 'Failed to resend verification email.',
                'details' => $e->getMessage(),
            ], 500);
        }
    }

    public function forgotPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email|max:50',
        ]);

        try {
            $user = User::where('email', $request->email)->first();

            // Don't reveal whether the email exists.
            if (!$user) {
                return response()->json([
                    'message' => 'If an account with that email exists, a password reset email has been sent.'
                ]);
            }

            // Prevent deactivated users from resetting password
            if ($user->deactivated_at) {
                return response()->json([
                    'error' => 'This account has been deactivated.'
                ], 403);
            }

            // Generate Firebase password reset link
            $resetLink = $this->firebaseAuth
                ->getPasswordResetLink($user->email);

            // Send custom email
            Mail::to($user->email)->send(
                new ForgotPasswordMail(
                    $user->username,
                    $resetLink
                )
            );

            return response()->json([
                'message' => 'If an account with that email exists, a password reset email has been sent.'
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to send password reset email.',
                'details' => $e->getMessage(),
            ], 500);
        }
    }
}
