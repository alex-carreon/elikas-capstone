<?php

namespace App\Http\Controllers\PinControllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\EvacArea;
use MatanYadaev\EloquentSpatial\Objects\Point;
use Carbon\Carbon;

class UpdateEvacuationAreaController extends Controller
{
    public function updateEvacuationArea(Request $request, $id)
    {
        try {
            $user = $request->attributes->get('firebase_user');

            $request->validate([
                'name' => 'nullable|string|max:255',
                'address' => 'nullable|string|max:255',
                'lat' => 'nullable|numeric|between:-90,90',
                'lng' => 'nullable|numeric|between:-180,180',
                'location_id' => 'nullable|integer|exists:Locations,id',
                'area_type' => 'nullable|integer|exists:EvacTypes,id',
                'capacity_level' => 'nullable|integer|exists:CapacityLevels,id',
                'description' => 'nullable|string',
                'is_persistent' => 'boolean',
                'for_reg_flood' => 'boolean',
                'for_heavy_flood' => 'boolean',
                'has_accom' => 'boolean',
                'has_DRRMO' => 'boolean',
                'has_health' => 'boolean',
                'pwd_friendly' => 'boolean',
                'has_catchment' => 'boolean',
                'toilet_count' => 'nullable|integer|min:0',
                'kitchen_count' => 'nullable|integer|min:0',
                'child_prayer_count' => 'nullable|integer|min:0',
                'breastfeed_count' => 'nullable|integer|min:0',
                'other_facilities' => 'nullable|string',
                'contact_person' => 'nullable|string|max:255',
                'contact_number' => 'nullable|string|max:20',
                'expiry' => 'nullable|date|after:now',
            ]);

            if (($request->filled('lat') && !$request->filled('lng')) || (!$request->filled('lat') && $request->filled('lng'))) {
                return response()->json([
                    'error' => 'Both lat and lng are required when updating location',
                ], 422);
            }

            $pin = EvacArea::with('social_element')->find($id);

            if (!$pin) {
                return response()->json([
                    'error' => 'Evacuation area not found',
                ], 404);
            }

            if (!$pin->social_element) {
                return response()->json([
                    'error' => 'Evacuation area has no linked social element',
                ], 422);
            }

            if ($user->role_id == 3 && $pin->social_element->user_id != $user->id) {
                return response()->json([
                    'error' => 'Forbidden. You may only update your own evacuation area pins',
                ], 403);
            }

            if (!in_array($user->role_id, [1, 2, 3])) {
                return response()->json([
                    'error' => 'Forbidden',
                ], 403);
            }

            if ($request->filled('name')) {
                $pin->name = $request->name;
            }

            if ($request->filled('address')) {
                $pin->address = $request->address;
            }

            if ($request->filled('description')) {
                $pin->description = $request->description;
            }

            if ($request->filled('location_id')) {
                $pin->location_id = $request->location_id;
            }

            if ($request->filled('area_type')) {
                $pin->area_type = $request->area_type;
            }

            if ($request->filled('capacity_level')) {
                $pin->capacity_level = $request->capacity_level;
            }

            if ($request->filled('lat') && $request->filled('lng')) {
                $pin->location = new Point((float) $request->lat, (float) $request->lng);
            }

            foreach ([
                'is_persistent',
                'for_reg_flood',
                'for_heavy_flood',
                'has_accom',
                'has_DRRMO',
                'has_health',
                'pwd_friendly',
                'has_catchment',
            ] as $field) {
                if ($request->has($field)) {
                    $pin->$field = $request->$field;
                }
            }

            foreach ([
                'toilet_count',
                'kitchen_count',
                'child_prayer_count',
                'breastfeed_count',
                'other_facilities',
                'contact_person',
                'contact_number',
            ] as $field) {
                if ($request->has($field)) {
                    $pin->$field = $request->$field;
                }
            }

            if ($request->has('expiry')) {
                $expiry = $request->filled('expiry')
                    ? Carbon::parse($request->expiry, 'Asia/Manila')->utc()
                    : null;

                $pin->expiry = $expiry;

                if ($expiry && $expiry->greaterThan(Carbon::now('UTC'))) {
                    $pin->social_element->deactivated_at = null;
                    $pin->social_element->save();
                }
            }

            $pin->last_updated = now();
            $pin->save();

            return response()->json([
                'message' => 'Evacuation area updated successfully',
                'pin_id' => $pin->id,
                'expiry' => $pin->expiry
                    ? $pin->expiry->timezone('Asia/Manila')->toDateTimeString()
                    : null,
                'deactivated_at' => $pin->social_element->deactivated_at
                    ? $pin->social_element->deactivated_at->timezone('Asia/Manila')->toDateTimeString()
                    : null,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to update evacuation area',
                'details' => $e->getMessage(),
            ], 500);
        }
    }
}
