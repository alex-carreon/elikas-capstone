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

    public function allUsers(Request $request)
    {
        try {
            // Fetch all users
            $users = User::with([
                'role',
                'name',
                'phoneNumber',
                'indivAcc.location'
            ])->get();

            // Format response
            $formattedUsers = $users->map(function ($user) {

                return [
                    'id' => $user->id,
                    'username' => $user->username,
                    'email' => $user->email,

                    'role' => $user->role?->role_name,

                    'first_name' => $user->name?->first_name,
                    'last_name' => $user->name?->last_name,

                    'phone' => $user->phoneNumber?->phone_no,
                    'location' => $user->indivAcc?->location?->name,

                    'created_at' => $user->created_at,
                    'deactivated_at' => $user->deactivated_at
                ];
            });

            return response()->json($formattedUsers);

        } catch (\Exception $e) {

            return response()->json([
                'error' => 'Failed to fetch users',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    public function deactivateUser($id)
    {
        try {
            $user = User::findOrFail($id);

            $user->deactivated_at = now();
            $user->save();

            return response()->json([
                'message' => 'User deactivated successfully',
                'user_id' => $user->id,
                'deactivated_at' => $user->deactivated_at
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to deactivate user',
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
}