<?php

namespace App\Http\Controllers\PinControllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\EvacArea;
use MatanYadaev\EloquentSpatial\Objects\Point;

class GetNearbyEvacuationAreasController extends Controller
{
    public function getNearbyEvacuationAreas(Request $request)
    {
        try {
            $request->validate([
                'lat' => 'required|numeric|between:-90,90',
                'lng' => 'required|numeric|between:-180,180',
                'radius' => 'nullable|integer|min:100|max:50000',
            ]);

            $lat = (float) $request->lat;
            $lng = (float) $request->lng;
            $radius = $request->radius ?? 5000;
            $origin = new Point($lat, $lng);

            $pins = EvacArea::with('social_element')
                ->whereHas('social_element', function ($q) {
                    $q->whereNull('deactivated_at');
                })
                ->where(function ($q) {
                    $q->whereNull('expiry')
                      ->orWhere('expiry', '>', now('UTC'));
                })
                ->withDistanceSphere('location', $origin, 'distance_meters')
                ->whereDistanceSphere('location', $origin, '<=', $radius)
                ->orderByDistanceSphere('location', $origin)
                ->get();

            $formattedPins = $pins->map(function ($pin) {
                $coordinates = [
                    $pin->location?->latitude,
                    $pin->location?->longitude,
                ];

                return [
                    'id' => $pin->id,
                    'name' => $pin->name,
                    'address' => $pin->address,
                    'coordinates' => $coordinates,
                    'area_type' => $pin->area_type,
                    'capacity_level' => $pin->capacity_level,
                    'is_verified' => $pin->verified_by !== null,
                    'distance_meters' => round($pin->distance_meters, 2),
                    'expiry' => $pin->expiry
                        ? $pin->expiry->timezone('Asia/Manila')->toDateTimeString()
                        : null,
                ];
            });

            return response()->json([
                'origin' => [
                    'lat' => $lat,
                    'lng' => $lng,
                ],
                'radius_meters' => $radius,
                'count' => $pins->count(),
                'pins' => $formattedPins
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch nearby evacuation areas',
                'details' => $e->getMessage()
            ], 500);
        }
    }
}
