<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class SensorResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id'             => $this->id,
            'sensorCode'    => $this->sensor_code,
            'name'           => $this->name,
            'lastOnline'    => $this->last_online,
            'mountHeight'  => $this->mount_height,
            'location'       => $this->location
                ? [$this->location->latitude, $this->location->longitude]
                : null,
            'address'        => $this->address,
            'yellowLevel'  => $this->yellow_level,
            'orangeLevel'  => $this->orange_level,
            'redLevel'     => $this->red_level,
            'waterLevel'   => $this->latest_log?->water_level,
            'currentStatus' => $this->current_status,
            'mountLocation'   => $this->whenLoaded('mount_location')
                ? $this->mount_location->name
                : null,
            'deactivatedAt' => $this->relationLoaded('social_element')
                ? $this->social_element?->deactivated_at?->toIso8601String()
                : null,
            'registeredBy' => $this->whenLoaded('social_element', function() {
                return $this->social_element->user?->govOp?->location?->name ?? null;
            }),
        ];
    }
}
