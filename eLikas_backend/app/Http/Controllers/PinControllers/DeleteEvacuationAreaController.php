<?php

namespace App\Http\Controllers\PinControllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\EvacArea;
use Carbon\Carbon;


class DeleteEvacuationAreaController extends Controller
{
    public function deleteEvacuationArea(Request $request, $id)
    {
        try {
            $user = $request->attributes->get('firebase_user');

            if (!$user) {
                return response()->json([
                    'error' => 'Authentication required to deactivate evacuation area pins'
                ], 401);
            }

            $pin = EvacArea::with('social_element.user.name')
                ->whereHas('social_element', function ($q) {
                    $q->whereNull('deactivated_at');
                })
                ->find($id);

            if (!$pin) {
                return response()->json([
                    'error' => 'Evacuation area not found'
                ], 404);
            }

            if ($user->role_id == 3 && $pin->social_element?->user_id != $user->id) {
                return response()->json([
                    'error' => 'Forbidden. You may only deactivate your own evacuation area pins'
                ], 403);
            }

            if (!$pin->social_element) {
                return response()->json([
                    'error' => 'Evacuation area has no linked social element'
                ], 422);
            }

            $pin->social_element->deactivated_at = Carbon::now('UTC');
            $pin->social_element->save();

            return response()->json([
                'message' => 'Evacuation area deactivated successfully',
                'pin_id' => $pin->id,
                'element_id' => $pin->social_element->id,
                'deactivated_at' => $pin->social_element->deactivated_at
                    ? $pin->social_element->deactivated_at->timezone('Asia/Manila')->toDateTimeString()
                    : null,
                'deactivated_by' => [
                    'name' => $this->displayName($pin->social_element?->user),
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to deactivate evacuation area',
                'details' => $e->getMessage()
            ], 500);
        }
    }
    public function restoreEvacuationArea(Request $request, $id)
{
    try {
        $user = $request->attributes->get('firebase_user');

        $pin = EvacArea::with('social_element')->find($id);

        if (!$pin) {
            return response()->json([
                'error' => 'Evacuation area not found'
            ], 404);
        }

        if (!$pin->social_element) {
            return response()->json([
                'error' => 'Evacuation area has no linked social element'
            ], 422);
        }

        if ($pin->social_element->user_id != $user->id) {
            return response()->json([
                'error' => 'Forbidden. You may only restore your own evacuation area pins'
            ], 403);
        }

        $pin->social_element->deactivated_at = null;
        $pin->social_element->save();

        return response()->json([
        'message' => 'Evacuation area restored successfully',
        'pin_id' => $pin->id,
        'element_id' => $pin->social_element->id,
        'deactivated_at' => $pin->social_element->deactivated_at
            ? $pin->social_element->deactivated_at->timezone('Asia/Manila')->toDateTimeString()
            : null,
        'restored_by' => [
            'name' => $this->displayName($pin->social_element?->user),
        ],
    ], 200);
    } catch (\Exception $e) {
        return response()->json([
            'error' => 'Failed to restore evacuation area',
            'details' => $e->getMessage()
        ], 500);
    }
}
private function displayName($user): ?string
{
    if (!$user) {
        return null;
    }

    $fullName = trim(($user->name?->first_name ?? '') . ' ' . ($user->name?->last_name ?? ''));

    return $fullName !== '' ? $fullName : $user->username;
}
}
