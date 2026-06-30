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
                'password' => 'J011805k_',  // MODIFY THIS PW
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
            'password'       => 'required|string|min:8',

            'phone'          => 'nullable|string|max:20',

            'level_id'       => 'required|integer|exists:LocationLevels,id',
            'location_id'    => 'required|integer|exists:Locations,id',

            'point_person'   => 'nullable|string|max:100',
            'point_position' => 'nullable|string|max:50',
        ]);

        $firebaseUid = null;

        try {
            DB::beginTransaction();

            // Step 2: Create Firebase user
            $firebaseUser = $this->firebaseAuth->createUser([
                'email'         => $request->email,
                'password'      => $request->password,
                'emailVerified' => false,
            ]);

            $firebaseUid = $firebaseUser->uid;

            // Step 3: Send Firebase verification email
            $this->firebaseAuth->sendEmailVerificationLink(
                $request->email
            );

            // Step 4: Create User record
            $user = User::create([
                'username'   => $request->username,
                'email'      => $request->email,
                'role_id'    => 2, // GovOp
                'created_at' => now(),
            ]);

            // Step 5: Store Firebase UID
            $user->userAuth()->create([
                'identity_uid' => $firebaseUid,
            ]);

            // Step 6: Create GovOp record
            $user->govOp()->create([
                'level_id'       => $request->level_id,
                'location_id'    => $request->location_id,
                'point_person'   => $request->point_person,
                'point_position' => $request->point_position,
            ]);

            DB::commit();

            return response()->json([
                'message' => 'GovOp created successfully. Verification email sent.',
                'user_id' => $user->id,
                'firebase_uid' => $firebaseUid,
            ], 201);

        } catch (\Exception $e) {

            DB::rollBack();

            // Remove Firebase account if DB creation fails
            if ($firebaseUid) {
                try {
                    $this->firebaseAuth->deleteUser($firebaseUid);
                } catch (\Exception $ignored) {
                }
            }

            return response()->json([
                'message' => 'GovOp creation failed',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
