<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;

class ProfileController extends Controller
{
    public function profile(Request $request)
    {
        try {

            // Get user from middleware
            $user = $request->attributes->get('firebase_user');

            return response()->json([
                'id' => $user->id,
                'username' => $user->username,
                'email' => $user->email,
                'role' => $user->role->role_name,

                'first_name' => $user->name?->first_name,
                'last_name'  => $user->name?->last_name,

                'phone' => $user->phoneNumber?->phone_no,
                'location' => $user->indivAcc?->location?->name,

                'created_at' => $user->created_at,
                'deactivated_at' => $user->deactivated_at
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
                'username' => 'nullable|string|max:255',
                'first_name' => 'nullable|string|max:255',
                'last_name' => 'nullable|string|max:255',
                'phone' => 'nullable|string|max:20',
                'location_id' => 'nullable|integer',
            ]);

            // Update users table
            if ($request->filled('username')) {
                $user->username = $request->username;
                $user->save();
            }

            // Update name table
            if ($user->name) {

                $user->name->update([
                    'first_name' => $request->first_name ?? $user->name->first_name,
                    'last_name'  => $request->last_name ?? $user->name->last_name,
                ]);

            }

            // Update phone number table
            if ($user->phoneNumber) {

                $user->phoneNumber->update([
                    'phone_no' => $request->phone ?? $user->phoneNumber->phone_no,
                ]);

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

    public function getUser($id)
    {
        try {
            $user = User::with([
                'role',
                'name',
                'phoneNumber',
                'indivAcc.location',
                'govOp.location',
                'govOp.locationLevel'
            ])->findOrFail($id);

            return response()->json([
                'id' => $user->id,
                'username' => $user->username,
                'email' => $user->email,

                'role' => $user->role?->role_name,

                'first_name' => $user->name?->first_name,
                'last_name' => $user->name?->last_name,

                'phone' => $user->phoneNumber?->phone_no,

                // Individual account location
                'indiv_location' => $user->indivAcc?->location?->name,

                // GovOp details
                'govop_location' => $user->govOp?->location?->name,
                'govop_level' => $user->govOp?->locationLevel?->level_name,
                'point_person' => $user->govOp?->point_person,
                'point_position' => $user->govOp?->point_position,

                'created_at' => $user->created_at,
                'deactivated_at' => $user->deactivated_at
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {

            return response()->json([
                'error' => 'User not found'
            ], 404);

        } catch (\Exception $e) {

            return response()->json([
                'error' => 'Failed to get user details',
                'details' => $e->getMessage()
            ], 500);
        }
    }
}