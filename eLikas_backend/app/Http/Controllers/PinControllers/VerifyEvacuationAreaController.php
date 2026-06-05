<?php

namespace App\Http\Controllers\PinControllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\EvacArea;

class VerifyEvacuationAreaController extends Controller
{
    public function verifyEvacuationArea(Request $request, $id)
    {
        try {
            $user = $request->attributes->get('firebase_user');

            $request->validate([
                'verified' => 'required|boolean',
            ]);

            $pin = EvacArea::with([
                'social_element',
                'gov_op.user.name',
                'gov_op.location',
            ])
                ->whereHas('social_element', function ($q) {
                    $q->whereNull('deactivated_at');
                })
                ->find($id);

            if (!$pin) {
                return response()->json([
                    'error' => 'Evacuation area not found'
                ], 404);
            }

            if ($request->verified) {
                if (!$user->govOp) {
                    return response()->json([
                        'error' => 'No GovOp profile found for this account'
                    ], 422);
                }

                $pin->verified_by = $user->govOp->id;
            } else {
                $pin->verified_by = null;
            }

            $pin->last_updated = now();
            $pin->save();

            $pin->load([
                'gov_op.user.name',
                'gov_op.location',
            ]);

            return response()->json([
                'message' => $request->verified
                    ? 'Evacuation area verified successfully'
                    : 'Verification mark removed',
                'pin_id' => $pin->id,
                'verified_by' => $request->verified ? [
                    'barangay' => $pin->gov_op?->location?->name,
                ] : null,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to update verification status',
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
