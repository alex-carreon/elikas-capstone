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
    public function index(Request $request)
    {
        try {
            $sensorlogs = SensorLogResource::collection(SensorLog::all());
            return $sensorlogs;
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
