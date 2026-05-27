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

            // ---------------------------------------------------
            // START QUERY
            // ---------------------------------------------------
            $query = User::with([
                'role',
                'name',
                'phoneNumber',

                // Individual account
                'indivAcc.location',

                // GovOp account
                'govOp.location',
                'govOp.locationLevel',
            ]);

            // ---------------------------------------------------
            // FILTER BY ROLE
            // Example:
            // ?role=admin
            // ?role=brgy_op
            // ?role=indiv
            // ---------------------------------------------------
            if ($request->filled('role')) {

                $query->whereHas('role', function ($q) use ($request) {

                    $q->where('role_name', $request->role);

                });
            }

            // ---------------------------------------------------
            // FILTER BY DEACTIVATION STATUS
            //
            // ?active=true
            // ?active=false
            // ---------------------------------------------------
            if ($request->filled('active')) {

                $active = filter_var(
                    $request->active,
                    FILTER_VALIDATE_BOOLEAN
                );

                if ($active) {

                    // active users only
                    $query->whereNull('deactivated_at');

                } else {

                    // deactivated users only
                    $query->whereNotNull('deactivated_at');
                }
            }

            // ---------------------------------------------------
            // FETCH USERS
            // ---------------------------------------------------
            $users = $query->get();

            // ---------------------------------------------------
            // FORMAT RESPONSE
            // ---------------------------------------------------
            $formattedUsers = $users->map(function ($user) {

                return [

                    'id' => $user->id,

                    'username' => $user->username,
                    'email' => $user->email,

                    // role
                    'role' => $user->role?->role_name,

                    // name
                    'first_name' => $user->name?->first_name,
                    'last_name' => $user->name?->last_name,

                    // phone
                    'phone' => $user->phoneNumber?->phone_no,

                    // indiv account location
                    'indiv_location' =>
                        $user->indivAcc?->location?->name,

                    // govop location
                    'govop_location' =>
                        $user->govOp?->location?->name,

                    // govop level
                    'govop_level' =>
                        $user->govOp?->locationLevel?->level_name,

                    // govop details
                    'point_person' =>
                        $user->govOp?->point_person,

                    'point_position' =>
                        $user->govOp?->point_position,

                    // status
                    'is_deactivated' =>
                        $user->deactivated_at !== null,

                    'created_at' => $user->created_at->timezone('Asia/Manila')->toDateTimeString(),
                    'deactivated_at' => $user->deactivated_at?->timezone('Asia/Manila')->toDateTimeString(),
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
                'deactivated_at' => $user->deactivated_at->timezone('Asia/Manila')->toDateTimeString()
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

                'created_at' => $user->created_at->timezone('Asia/Manila')->toDateTimeString(),
                'deactivated_at' => $user->deactivated_at?->timezone('Asia/Manila')->toDateTimeString(),
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
