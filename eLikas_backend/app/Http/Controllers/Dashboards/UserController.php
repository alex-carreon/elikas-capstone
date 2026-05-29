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

            $query = User::with([
                'role',
                'name',
                'indivAcc.location',
                'govOp.location'
            ]);

            // Filter by role
            if ($request->filled('role')) {

                $query->whereHas('role', function ($q) use ($request) {

                    $q->where('role_name', $request->role);

                });
            }

            // Filter by activation
            if ($request->filled('active')) {

                $active = filter_var(
                    $request->active,
                    FILTER_VALIDATE_BOOLEAN
                );

                if ($active) {

                    $query->whereNull('deactivated_at');

                } else {

                    $query->whereNotNull('deactivated_at');
                }
            }

            $users = $query->get();

            $formattedUsers = $users->map(function ($user) {

                return [

                    'id' => $user->id,

                    'name' =>
                        trim(
                            ($user->name?->first_name ?? '') . ' ' .
                            ($user->name?->last_name ?? '')
                        ),

                    'role' => $user->role?->role_name,

                    'location' =>
                        $user->indivAcc?->location?->city_location
                        ?? $user->govOp?->location?->name,
                        
                    'parent_location' =>
                        $user->govOp?->location
                            ? $user->govOp->location->city_location
                            : null
                ];
            });

            return response()->json([
                'count' => $formattedUsers->count(),
                'users' => $formattedUsers
            ]);

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
                'phoneNumber'
            ])->findOrFail($id);

            $response = [
                'id' => $user->id,
                'username' => $user->username,
                'email' => $user->email,

                'role' => $user->role?->role_name,

                'first_name' => $user->name?->first_name,
                'last_name' => $user->name?->last_name,

                'phone' => $user->phoneNumber?->phone_no,

                'created_at' => $user->created_at
                    ->timezone('Asia/Manila')
                    ->toDateTimeString(),

                'deactivated_at' => $user->deactivated_at?->timezone('Asia/Manila')
                    ->toDateTimeString(),
            ];

            // Individual-only fields
            if ($user->role?->role_name === 'indiv') {

                $user->load('indivAcc.location');

                $response['indiv_location_id']
                    = $user->indivAcc?->location?->id;

                $response['indiv_location']
                    =  $user->indivAcc?->location?->full_location;
            }

            // GovOp-only fields
            if ($user->role?->role_name === 'brgy_op') {

                $user->load([
                    'govOp.location',
                    'govOp.locationLevel'
                ]);

                $response['govop_location_id']
                    = $user->govOp?->location?->id;

                $response['govop_location']
                    = $user->govOp?->location?->name;

                $response['govop_level']
                    =  $user->govOp?->location?->full_location;

                $response['point_person']
                    = $user->govOp?->point_person;

                $response['point_position']
                    = $user->govOp?->point_position;
            }

            return response()->json($response);

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

    public function updateUser(Request $request, $id)
    {
        try {

            $user = User::with([
                'name',
                'phoneNumber',
                'indivAcc',
                'govOp'
            ])->findOrFail($id);

            // BLOCK DEACTIVATED USERS
            if ($user->deactivated_at !== null) {

                return response()->json([
                    'error' => 'This user is deactivated and cannot be updated'
                ], 403);
            }
            $validated = $request->validate([

                'username' => 'sometimes|string|max:255|unique:Users,username,' . $user->id,

                'email' => 'sometimes|email|max:255|unique:Users,email,' . $user->id,

                'first_name' => 'sometimes|string|max:255',
                'last_name' => 'sometimes|string|max:255',

                'phone' => 'sometimes|string|max:20',

                // Individual
                'indiv_location_id' => 'sometimes|integer|exists:Locations,id',

                // GovOp
                'govop_location_id' => 'sometimes|integer|exists:Locations,id',
                'govop_level_id' => 'sometimes|integer|exists:LocationLevels,id',

                'point_person' => 'sometimes|string|max:255',
                'point_position' => 'sometimes|string|max:255',
            ]);

            // -----------------------------------------
            // UPDATE USER
            // -----------------------------------------
            if ($request->filled('username')) {

                $user->username = $validated['username'];
            }

            if ($request->filled('email')) {

                $user->email = $validated['email'];
            }

            $user->save();

            // UPDATE NAME
            if ($user->name) {

                if ($request->filled('first_name')) {

                    $user->name->first_name =
                        $validated['first_name'];
                }

                if ($request->filled('last_name')) {

                    $user->name->last_name =
                        $validated['last_name'];
                }

                $user->name->save();
            }

            // UPDATE PHONE
            if ($user->phoneNumber && $request->filled('phone')) {

                $user->phoneNumber->phone_no =
                    $validated['phone'];

                $user->phoneNumber->save();
            }

            // UPDATE INDIV ACCOUNT
            if (
                $user->role?->role_name === 'indiv'
                && $user->indivAcc
            ) {

                if ($request->filled('indiv_location_id')) {

                    $user->indivAcc->location_id =
                        $validated['indiv_location_id'];

                    $user->indivAcc->save();
                }
            }

            // UPDATE GOVOP ACCOUNT
            if (
                $user->role?->role_name === 'brgy_op'
                && $user->govOp
            ) {

                if ($request->filled('govop_location_id')) {

                    $user->govOp->location_id =
                        $validated['govop_location_id'];
                }

                if ($request->filled('govop_level_id')) {

                    $user->govOp->location_level_id =
                        $validated['govop_level_id'];
                }

                if ($request->filled('point_person')) {

                    $user->govOp->point_person =
                        $validated['point_person'];
                }

                if ($request->filled('point_position')) {

                    $user->govOp->point_position =
                        $validated['point_position'];
                }

                $user->govOp->save();
            }

            return response()->json([
                'message' => 'User updated successfully',
                'user_id' => $user->id
            ]);

        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {

            return response()->json([
                'error' => 'User not found'
            ], 404);

        } catch (\Illuminate\Validation\ValidationException $e) {

            return response()->json([
                'error' => 'Validation failed',
                'details' => $e->errors()
            ], 422);

        } catch (\Exception $e) {

            return response()->json([
                'error' => 'Failed to update user',
                'details' => $e->getMessage()
            ], 500);
        }
    }
}
