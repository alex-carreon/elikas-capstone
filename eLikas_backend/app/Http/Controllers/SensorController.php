<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Sensor;

class SensorController extends Controller
{
    public function index(Request $request)
    {
        try {
            $sensors = Sensor::all();
            $user = $request->attributes->get('firebase_user');

            return response()->json($sensors->map(function ($sensor) use ($user) {
                // Public view
                $data = [
                    'id'       => $sensor->id,
                    'name'     => $sensor->name,
                    'location' => $sensor->location
                        ? [$sensor->location->latitude, $sensor->location->longitude]
                        : null,
                    'address'  => $sensor->address,
                ];

                // Full view for admin (role 1) and govop (role 2)
                if ($user && in_array($user->role_id, [1, 2])) {
                    $data['sensor_code'] = $sensor->sensor_code;
                    $data['depth']       = $sensor->depth;
                    $data['last_online'] = $sensor->last_online;
                    $data['element_id']  = $sensor->element_id;
                }

                return $data;
            }));
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch sensors',
                'details' => $e->getMessage()
            ], 500);
        }
    }
}
