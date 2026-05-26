<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class IsBarangayMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->attributes->get('firebase_user');

        if (!$user) {
            return response()->json([
                'error' => 'Unauthorized'
            ], 401);
        }

        // role_id 2 = barangay
        if ($user->role_id != 2) {
            return response()->json([
                'error' => 'Forbidden: Barangay only'
            ], 403);
        }

        return $next($request);
    }
}
