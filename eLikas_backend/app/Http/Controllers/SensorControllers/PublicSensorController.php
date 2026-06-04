<?php

namespace App\Http\Controllers\SensorControllers;

use Illuminate\Http\Request;
use App\Http\Controllers\Controller;
use App\Models\Sensor;

class PublicSensorController extends Controller
{
    public function index()
    {
        // Only return active sensors for public endpoint
        $sensors = Sensor::whereHas('social_element', function ($q) {
            $q->whereNull('deactivated_at');
        })->with('mountLocation')->get();

        return response()->json($sensors->map(function ($sensor) {
            return [
                'id' => $sensor->id,
                'name' => $sensor->name,
                'location' => $sensor->location
                    ? [$sensor->location->latitude, $sensor->location->longitude]
                    : null,
                'barangay' => $sensor->mountLocation?->name,
                'lastOnline' => $sensor->last_online,
                'currentStatus' => $sensor->current_status
            ];
        }));
    }

    public function show(Sensor $sensor)
    {
        try {
            if ($sensor->social_element?->deactivated_at) {
                return response()->json([
                    'error' => 'Sensor is deactivated'
                ], 404);
            }

            $sensor->loadMissing('mountLocation');
            return [
                'id' => $sensor->id,
                'name' => $sensor->name,
                'location' => $sensor->location
                    ? [$sensor->location->latitude, $sensor->location->longitude]
                    : null,
                'address' => $sensor->address,
                'barangay' => $sensor->mountLocation?->name,
                'waterLevel' => null, //Will display last reading,
                'lastOnline' => $sensor->last_online,
                'currentStatus' => $sensor->current_status
            ];
        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Failed to fetch sensor details',
                'details' => $e->getMessage()
            ], 500);
        }
    }
}
