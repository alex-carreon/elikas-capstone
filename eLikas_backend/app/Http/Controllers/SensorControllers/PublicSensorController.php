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
        })->get();

        return response()->json($sensors->map(function ($sensor) {
            return [
                'id'            => $sensor->id,
                'name'          => $sensor->name,
                'location'      => $sensor->location
                    ? [$sensor->location->latitude, $sensor->location->longitude]
                    : null,
                'water_level'         => null, //Should display last reading,
                'last_online'    => $sensor->last_online,
                'current_status' => $sensor->current_status
            ];
        }));
    }
}
