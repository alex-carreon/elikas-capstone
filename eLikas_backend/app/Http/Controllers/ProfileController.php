<?php

namespace App\Http\Controllers;

use App\Mail\VerifyEmailMail;
use App\Models\User;
use App\Models\PhoneNumber;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Kreait\Firebase\Contract\Auth as FirebaseAuth;
use Illuminate\Validation\ValidationException;

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

                // Point person details from GovOp relation
                'point_person' => $user->govOp?->point_person,
                'point_person_position' => $user->govOp?->point_position,

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

            if ($user->role_id == 2) { // govop

                $forbidden = collect([
                    'first_name',
                    'last_name',
                    'phone',
                    'location_id',
                ])->filter(fn ($field) => $request->has($field));

                if ($forbidden->isNotEmpty()) {
                    return response()->json([
                        'message' => 'Validation failed.',
                        'errors' => $forbidden->mapWithKeys(fn ($field) => [
                            $field => ['This field cannot be updated by government operators.']
                        ]),
                    ], 422);
                }
            }

            if ($user->role_id == 3) { // Individual

                $forbidden = collect([
                    'point_person',
                    'point_person_position',
                ])->filter(fn ($field) => $request->has($field));

                if ($forbidden->isNotEmpty()) {
                    return response()->json([
                        'message' => 'Validation failed.',
                        'errors' => $forbidden->mapWithKeys(fn ($field) => [
                            $field => ['This field cannot be updated by individual users.']
                        ]),
                    ], 422);
                }
            }

            $rules = [
                'username' => 'nullable|string|max:20|unique:Users,username,' . $user->id,
                'avatar_seed' => 'nullable|string|size:8',
            ];

            if ($user->role_id == 3) {
                $rules += [
                    'first_name' => 'nullable|string|max:50',
                    'last_name' => 'nullable|string|max:50',
                    'phone' => 'nullable|string|max:12',
                    'location_id' => 'nullable|integer',
                ];
            }

            if ($user->role_id == 2) {
                $rules += [
                    'point_person' => 'nullable|string|max:100',
                    'point_person_position' => 'nullable|string|max:50',
                ];
            }

            $request->validate($rules);

            // Shared user fields (all roles)
            $user->update([
                'username'    => $request->username ?? $user->username,
                'avatar_seed' => $request->avatar_seed ?? $user->avatar_seed,
            ]);

            // Individual account updates

            if ($user->role_id == 3) {

                if ($user->name) {
                    $user->name->update([
                        'first_name' => $request->first_name ?? $user->name->first_name,
                        'last_name'  => $request->last_name ?? $user->name->last_name,
                    ]);
                }

                if ($request->filled('phone')) {

                    $currentPhone = $user->phoneNumber?->phone_no;

                    // Only proceed if the phone actually changed
                    if ($currentPhone !== $request->phone) {

                        // Check if another user already owns this phone number
                        $phoneExists = PhoneNumber::where('phone_no', $request->phone)
                            ->where('user_id', '!=', $user->id)
                            ->exists();

                        if ($phoneExists) {
                            return response()->json([
                                'message' => 'Validation failed.',
                                'errors' => [
                                    'phone' => ['This phone number is already in use.']
                                ]
                            ], 422);
                        }

                        PhoneNumber::updateOrCreate(
                            ['user_id' => $user->id],
                            [
                                'phone_no' => $request->phone,
                                'is_verified' => false,
                            ]
                        );
                    }
                }

                if ($user->indivAcc) {
                    $user->indivAcc->update([
                        'location_id' => $request->location_id ?? $user->indivAcc->location_id,
                    ]);
                }
            }

            //Government Operator updates
            if ($user->role_id == 2 && $user->govOp) {
                $user->govOp->update([
                    'point_person' => $request->point_person ?? $user->govOp->point_person,
                    'point_position' => $request->point_person_position ?? $user->govOp->point_position,
                ]);
            }

            return response()->json([
                'message' => 'Profile updated successfully'
            ]);

        } catch (ValidationException $e) {
             
            throw $e;
        
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