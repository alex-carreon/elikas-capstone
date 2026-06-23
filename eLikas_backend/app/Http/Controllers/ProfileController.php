<?php

namespace App\Http\Controllers;

use App\Mail\VerifyEmailMail;
use App\Models\User;
use App\Models\PhoneNumber;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Kreait\Firebase\Contract\Auth as FirebaseAuth;

class ProfileController extends Controller
{
    public function __construct(protected FirebaseAuth $firebaseAuth) {}

    public function profile(Request $request)
    {
        try {

            // Get user from middleware
            $user = $request->attributes->get('firebase_user');

            return response()->json([
                'id' => $user->id,
                'username' => $user->username,
                'email' => $user->email,
                'avatar_seed' => $user->avatar_seed,
                'role' => $user->role->role_name,

                'first_name' => $user->name?->first_name,
                'last_name'  => $user->name?->last_name,

                'phone' => $user->phoneNumber?->phone_no,
                'is_verified' => $user->phoneNumber?->is_verified,
                'location' => $user->indivAcc?->location?->full_location
                    ?? $user->govOp?->location?->full_location,

                'created_at' => $user->created_at->timezone('Asia/Manila')->toDateTimeString(),
                'deactivated_at' => $user->deactivated_at?->timezone('Asia/Manila')->toDateTimeString()
            ]);

        } catch (\Exception $e) {

            return response()->json([
                'error' => 'Failed to fetch profile',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    public function updateProfile(Request $request)
    {
        try {

            $user = $request->attributes->get('firebase_user');

            // Validation
            $request->validate([
                'username' => 'nullable|string|max:20|unique:Users,username',
                'first_name' => 'nullable|string|max:50',
                'last_name' => 'nullable|string|max:50',
                'phone' => 'nullable|string|max:20',
                'location_id' => 'nullable|integer',
                'avatar_seed' => 'nullable|string|size:8',
            ]);

            // Update users table
            $user->update([
                'username'    => $request->username ?? $user->username,
                'avatar_seed' => $request->avatar_seed ?? $user->avatar_seed,
            ]);

            // Update name table
            if ($user->name) {
                $user->name->update([
                    'first_name' => $request->first_name ?? $user->name->first_name,
                    'last_name'  => $request->last_name ?? $user->name->last_name,
                ]);

            }

            // Update or create phone number row
            if ($request->filled('phone')) {

                PhoneNumber::updateOrCreate(
                    ['user_id' => $user->id],
                    [
                        'phone_no' => $request->phone,
                        'is_verified' => false,
                    ]
                );
            }

            // Update individual account table
            if ($user->indivAcc) {

                $user->indivAcc->update([
                    'location_id' => $request->location_id ?? $user->indivAcc->location_id,
                ]);

            }

            return response()->json([
                'message' => 'Profile updated successfully'
            ]);

        } catch (\Exception $e) {

            return response()->json([
                'error' => 'Failed to update profile',
                'details' => $e->getMessage()
            ], 500);
        }
    }


    public function deactivateSelf(Request $request)
    {
        try {
            $user = $request->attributes->get('firebase_user');

            if (!$user) {
                return response()->json([
                    'error' => 'Unauthorized user'
                ], 401);
            }

            $user->deactivated_at = now();
            $user->save();

            return response()->json([
                'message' => 'Account deactivated successfully',
                'deactivated_at' => $user->deactivated_at
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to deactivate account',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    public function changeEmail(Request $request)
    {
        $request->validate([
            'email' => 'required|email|max:50|unique:Users,email',
        ]);
        
        try {

            $user = $request->attributes->get('firebase_user');

            if (strtolower($user->email) === strtolower($request->email)) {
                return response()->json([
                    'error' => 'The new email must be different from your current email.'
                ], 422);
            }

            $firebaseUid = $user->userAuth->identity_uid;

            // Update Firebase email
           $this->firebaseAuth->updateUser($firebaseUid, [
                'email' => $request->email,
                'emailVerified' => false,
            ]);

            // Update Laravel email
            $user->update([
                'email' => $request->email,
            ]);

            // Generate verification link
            $verificationLink = $this->firebaseAuth
                ->getEmailVerificationLink($request->email);

            // Send custom email
            Mail::to($request->email)->send(
                new VerifyEmailMail(
                    $user->username,
                    $verificationLink
                )
            );

            return response()->json([
                'message' => 'Email updated successfully. Verification email sent.',
                'email' => $user->email,
            ]);

        } catch (\Exception $e) {

            return response()->json([
                'error' => 'Failed to update email.',
                'details' => $e->getMessage(),
            ], 500);
        }
    }

    public function syncEmail(Request $request)
    {
        try {

            $user = $request->attributes->get('firebase_user');

            $firebaseUid = $user->userAuth->identity_uid;

            $firebaseUser = $this->firebaseAuth->getUser($firebaseUid);

            $user->update([
                'email' => $firebaseUser->email,
            ]);

            return response()->json([
                'message' => 'Email synced successfully',
                'email' => $user->email,
            ]);

        } catch (\Exception $e) {

            return response()->json([
                'error' => 'Failed to sync email',
                'details' => $e->getMessage(),
            ], 500);
        }
    }
}