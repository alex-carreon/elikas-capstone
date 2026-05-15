<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class isRoleMiddleware
{
    public function handle(Request $request, Closure $next, ...$roles): Response
    {
        $user = $request->attributes->get('firebase_user');

        if (!$user) {
            return response()->json([
                'error' => 'Unauthorized'
            ], 401);
        }

        // OR logic happens HERE
        if (!in_array($user->role_id, $roles)) {
            return response()->json([
                'error' => 'Forbidden'
            ], 403);
        }

        return $next($request);
    }
}