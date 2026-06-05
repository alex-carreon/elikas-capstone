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
        return DB::transaction(function () use ($validated) {
            $sensor = Sensor::where('sensor_code', $validated['sensor_code'])->first();
            $water_level = $validated['water_level'];

            if ($water_level < $sensor?->yellow_level) {
                $status_level = 'normal';
            } elseif ($water_level < $sensor?->orange_level) {
                $status_level = 'yellow';
            } elseif ($water_level < $sensor?->red_level) {
                $status_level = 'orange';
            } else {
                $status_level = 'red';
            }

            $sensorlog = SensorLog::create([
                'sensor_code' => $validated['sensor_code'],
                'water_level' => $validated['water_level'],
                'status_level' => $status_level,
                'sensor_timestamp' => $validated['sensor_timestamp'],
                'log_time' => now()->toDateTimeString()
            ]);

            $sensorlog->refresh();
            return $sensorlog;
        });
    }
}
