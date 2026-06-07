<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SensorLogResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'sensorCode' => $this->sensor_code,
            'waterLevel' => $this->water_level,
            'statusLevel' => $this->status_level,
            'sensorTimestamp' => $this->sensor_timestamp,
            'logTime' => $this->log_time
        ];
    }
}
