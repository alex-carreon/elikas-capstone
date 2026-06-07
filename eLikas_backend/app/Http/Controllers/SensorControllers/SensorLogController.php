<?php

namespace App\Http\Controllers\SensorControllers;

use Illuminate\Http\Request;
use App\Http\Resources\SensorLogResource;
use App\Models\SensorLog;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreSensorLogRequest;
use App\Services\SensorLogService;

class SensorLogController extends Controller
{
    public function index(Request $request, String $sensor_code)
    {
        try {
            $sensorlogs = SensorLog::where('sensor_code', $sensor_code)
                ->orderBy('sensor_timestamp', 'desc')
                ->paginate(15);

            if ($sensorlogs->isEmpty() && !\App\Models\Sensor::where('sensor_code', $sensor_code)->exists()) {
                return response()->json(['error' => 'Sensor not found'], 404);
            }
            return SensorLogResource::collection($sensorlogs);
        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Failed to fetch sensor logs',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    public function store(StoreSensorLogRequest $request, SensorLogService $service)
    {
        try {
            $sensorlog = $service->create($request->validated());
            return new SensorLogResource($sensorlog);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage(),
                'file'  => $e->getFile(),
                'line'  => $e->getLine(),
            ], 500);
        }
    }
}
