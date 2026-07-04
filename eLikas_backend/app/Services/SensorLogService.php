<?php

namespace App\Services;

use App\Models\SensorLog;
use Illuminate\Support\Facades\DB;
use App\Models\Sensor;

class SensorLogService
{
    /**
     * Create a new class instance.
     */
    public function __construct()
    {
        //
    }

    public function create(array $validated): SensorLog
    {
        // Fetch the parent sensor using the validated sensor_code
        $sensor = Sensor::where('sensor_code', $validated['sensor_code'])->firstOrFail();

        // Calculate the status using the sensor's individual thresholds
        $status_level = $sensor->determineStatusLevel((float) $validated['water_level']);

        return DB::transaction(function () use ($validated, $sensor, $status_level) {
            $sensorlog = SensorLog::create([
                'sensor_code' => $validated['sensor_code'],
                'water_level' => $validated['water_level'],
                'status_level' => $status_level,
                'sensor_timestamp' => $validated['sensor_timestamp'],
                'log_time' => now()->toDateTimeString()
            ]);

            // Update the parent sensor's last_online and current_status fields
            $sensor->update([
                'last_online'    => now()->toDateTimeString(),
                'current_status' => $status_level
            ]);

            return $sensorlog->refresh();
        });
    }
}
