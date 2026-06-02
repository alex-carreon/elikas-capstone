<?php

namespace App\Http\Controllers\PinControllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\EvacArea;
use MatanYadaev\EloquentSpatial\Objects\Point;

class GetEvacuationRoutesController extends Controller
{
    public function getEvacuationRoutes(Request $request)
    {
        try {

            $request->validate([
                'lat' => 'required|numeric|between:-90,90',
                'lng' => 'required|numeric|between:-180,180',
            ]);

            $origin = new Point(
                (float) $request->lat,
                (float) $request->lng
            );

            $nearestAreas = EvacArea::with('social_element')
                ->whereHas('social_element', function ($q) {
                    $q->whereNull('deactivated_at');
                })
                ->where(function ($q) {
                    $q->whereNull('expiry')
                      ->orWhere('expiry', '>', now('UTC'));
                })
                ->withDistanceSphere('location', $origin, 'distance_meters')
                ->whereDistanceSphere('location', $origin, '<=', 20000)
                ->orderByDistanceSphere('location', $origin)
                ->limit(5)
                ->get();

            $formattedAreas = $nearestAreas->map(function ($pin) {
                $coordinates = [
                    $pin->location?->latitude,
                    $pin->location?->longitude,
                ];

                return [
                    'id' => $pin->id,
                    'name' => $pin->name,
                    'address' => $pin->address,
                    'coordinates' => $coordinates,
                    'capacity_level' => $pin->capacity_level,
                    'is_verified' => $pin->verified_by !== null,
                    'distance_meters' => round($pin->distance_meters, 2),
                ];
            });

            return response()->json([
                'nearest_shelters' => $formattedAreas
            ]);

        } catch (\Exception $e) {

            return response()->json([
                'error' => 'Failed to fetch evacuation routes',
                'details' => $e->getMessage()
            ], 500);
        }
    }
}
