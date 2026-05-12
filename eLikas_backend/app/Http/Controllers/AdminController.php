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
                'password' => 'Test12345!', // or generate random password
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
}
