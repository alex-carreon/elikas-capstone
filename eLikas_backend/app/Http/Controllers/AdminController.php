<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Kreait\Firebase\Contract\Auth as FirebaseAuth;

use App\Models\User;

class AdminController extends Controller
{
    public function __construct(protected FirebaseAuth $firebaseAuth) {}

    public function createUser(Request $request)
    {
        // 1. Validate input from admin
        $request->validate([
            'username' => 'required|string|max:20|unique:Users,username',
            'email'    => 'required|email|max:50|unique:Users,email',
            'role_id'  => 'required|integer|exists:Roles,id',
        ]);

        try {
            DB::beginTransaction();

            // 2. Create Firebase user
            // This ensures the user exists in Firebase Auth system
            $firebaseUser = $this->firebaseAuth->createUser([
                'email' => $request->email,
                'emailVerified' => false,
                'password' => 'elikasteam',  // MODIFY THIS PW
            ]);

            // 3. Send email verification link
            // Firebase handles the verification email
            $this->firebaseAuth->sendEmailVerificationLink($request->email);

            // 4. Create user in Laravel database
            $user = User::create([
                'username'   => $request->username,
                'email'      => $request->email,
                'role_id'    => $request->role_id,
                'created_at' => now(),
            ]);

            // 5. Link Firebase UID to Laravel user
            $user->userAuth()->create([
                'identity_uid' => $firebaseUser->uid,
            ]);

            // 6. If role is admin, insert into Admins table
            if ($request->role_id == 1) {
                DB::table('Admins')->insert([
                    'user_id' => $user->id
                ]);
            }

            DB::commit();

            return response()->json([
                'message' => 'User created successfully',
                'user_id' => $user->id,
                'firebase_uid' => $firebaseUser->uid
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'error' => $e->getMessage()
            ], 500);
        }
    }

    public function createGovOp(Request $request)
    {
        // Step 1: Validate request
        $request->validate([
            'username'       => 'required|string|max:20|unique:Users,username',
            'email'          => 'required|email|max:50|unique:Users,email',

            'phone'          => 'nullable|string|max:20',

            'firebase_uid'   => 'required|string',

            'level_id'       => 'required|integer',
            'location_id'    => 'required|integer',

            'point_person'   => 'nullable|string|max:100',
            'point_position' => 'nullable|string|max:50',
        ]);

        // Step 2: Verify Firebase UID exists
        try {

            $this->firebaseAuth->getUser($request->firebase_uid);

        } catch (\Exception $e) {

            return response()->json([
                'error' => 'Invalid Firebase user'
            ], 401);
        }

        // Step 3: Database transaction
        try {
            DB::beginTransaction();

            // Create user
            $user = User::create([
                'username'   => $request->username,
                'email'      => $request->email,

                // role_id 2 = govop
                'role_id'    => 2,

                'created_at' => now(),
            ]);

            // Link the Firebase UID to this user
            $user->userAuth()->create([
                'identity_uid' => $request->firebase_uid,
            ]);

            // Create GovOp record
            $user->govOp()->create([
                'level_id'       => $request->level_id,
                'location_id'    => $request->location_id,
                'point_person'   => $request->point_person,
                'point_position' => $request->point_position,
            ]);

            DB::commit();

            return response()->json([
                'message' => 'GovOp created successfully',
                'user_id' => $user->id,
            ], 201);

        } catch (\Exception $e) {

            DB::rollBack(); 

            return response()->json([
                'message' => 'GovOp creation failed',
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ], 500);
        }
    }
}
