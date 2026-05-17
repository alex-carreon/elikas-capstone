<?php

namespace App\Http\Controllers\Dashboards;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\User;

class UserController extends Controller
{
    public function allUsers(Request $request)
    {
        try {

            // Start query
            $query = User::with([
                'role',
                'name',
                'phoneNumber',
                'indivAcc.location'
            ]);

            // OPTIONAL ROLE FILTER
            if ($request->has('role')) {

                $role = $request->role;

                $query->whereHas('role', function ($q) use ($role) {
                    $q->where('role_name', $role);
                });
            }

            // Fetch users
            $users = $query->get();

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
