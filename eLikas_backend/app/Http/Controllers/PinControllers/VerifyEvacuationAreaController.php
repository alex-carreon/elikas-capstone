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

            $pin = EvacArea::with('social_element')
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

            return response()->json([
                'message' => $request->verified
                    ? 'Evacuation area verified successfully'
                    : 'Verification mark removed',
                'pin_id' => $pin->id,
                'verified_by' => $pin->verified_by
            ]);

        } catch (\Exception $e) {

            return response()->json([
                'error' => 'Failed to update verification status',
                'details' => $e->getMessage()
            ], 500);
        }
    }
}
