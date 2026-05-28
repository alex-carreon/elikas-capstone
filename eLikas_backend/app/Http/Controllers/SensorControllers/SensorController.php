<?php

namespace App\Http\Controllers\SensorControllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Sensor;
use App\Http\Resources\SensorResource;
use App\Services\SensorQuery;
use App\Http\Requests\StoreSensorRequest;
use App\Services\SensorService;
use App\Http\Requests\UpdateSensorRequest;

class SensorController extends Controller
{
    public function index(Request $request)
    {
        try {
            $filter = new SensorQuery();
            $sensors = $filter->transform(Sensor::query(), $request)->paginate();
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

    public function store(StoreSensorRequest $request, SensorService $service)
    {
        try {
            $user = $request->attributes->get('firebase_user');
            $sensor = $service->create($request->validated(), $user);
            return new SensorResource($sensor);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage(),
                'file'  => $e->getFile(),
                'line'  => $e->getLine(),
            ], 500);
        }
    }

    // use PATCH for partial updates since all fields are optional in UpdateSensorRequest
    public function update(UpdateSensorRequest $request, Sensor $sensor)
    {
        try {
            $sensor->update($request->validated());
            return new SensorResource($sensor);
        } catch (\Exception $e) {
            return response()->json([
                'error'   => $e->getMessage(),
                'details' => $e->getFile() . ':' . $e->getLine(),
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
