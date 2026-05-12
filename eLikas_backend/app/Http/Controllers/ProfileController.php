<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

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
            ]);

        } catch (\Exception $e) {

            return response()->json([
                'error' => 'Failed to fetch profile',
                'details' => $e->getMessage()
            ], 500);
        }
    }
}