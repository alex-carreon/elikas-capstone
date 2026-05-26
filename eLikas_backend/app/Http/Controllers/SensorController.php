<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Sensor;
use App\Http\Resources\SensorResource;
use App\Services\SensorQuery;

class SensorController extends Controller
{
    public function index(Request $request)
    {
        try {
            // Define a strict whitelist of allowed parameter keys
            $allowedParams = [
                'name', 'sensor_code', 'current_status', 'location_id',
                'address', 'last_online_before', 'last_online_after',
                'is_active', 'sort_by', 'sort_order', 'page'
            ];

            // Strip out anything else that isn't explicitly defined above
            $cleanRequest = request()->createFromBase($request);
            $cleanRequest->query->replace($request->only($allowedParams));

            $filter = new SensorQuery();

            // Pass the sanitized request to the transform method instead
            $sensors = $filter->transform(Sensor::query(), $cleanRequest)->paginate();
            $sensors->loadMissing('social_element');

            return SensorResource::collection($sensors);
        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Failed to fetch sensors',
                'details' => $e->getMessage()
            ], 500);
        }
    }


    public function show(Sensor $sensor)
    {
        try {
            $sensor->loadMissing('social_element');
            return new SensorResource($sensor);
        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Failed to fetch sensor details',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    // ---------------------------------------------------------------
    // DEACTIVATE — sets deactivated_at on the parent social element
    // ---------------------------------------------------------------
    public function deactivate(Request $request, int $id)
    {
        try {
            $sensor = Sensor::with('social_element')->findOrFail($id);

            $sensor->social_element->update([
                'deactivated_at' => now()
            ]);

            return response()->json(['message' => 'Sensor deactivated successfully']);
        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Failed to deactivate sensor',
                'details' => $e->getMessage()
            ], 500);
        }
    }
}
