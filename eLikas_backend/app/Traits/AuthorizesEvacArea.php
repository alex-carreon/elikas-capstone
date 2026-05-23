<?php

namespace App\Traits;

use Illuminate\Http\JsonResponse;
use App\Models\EvacArea;
use App\Models\User;

trait AuthorizesEvacArea
{
    protected function authorizeEvacAreaModification(User $user, EvacArea $pin): ?JsonResponse
    {
        if ($user->role_id === 1) {
            return null;
        }

        if ($user->role_id === 2) {
            $govOp = $user->govOp;

            if (!$govOp) {
                return response()->json([
                    'success' => false,
                    'message' => 'Barangay operator profile not found for this account.',
                ], 403);
            }

            if ($govOp->location_id !== $pin->location_id) {
                return response()->json([
                    'success' => false,
                    'message' => 'You are not authorized to modify pins outside your assigned administrative area.',
                    'your_location_id' => $govOp->location_id,
                    'pin_location_id'  => $pin->location_id,
                ], 403);
            }

            return null;
        }

        if ($user->role_id === 3) {
            $authorId = $pin->social_element?->user_id;

            if ($authorId === null || $authorId !== $user->id) {
                return response()->json([
                    'success' => false,
                    'message' => 'You can only modify evacuation areas you have personally submitted.',
                ], 403);
            }

            return null;
        }

        return response()->json([
            'success' => false,
            'message' => 'Your account role does not have permission to perform this action.',
        ], 403);
    }
}
