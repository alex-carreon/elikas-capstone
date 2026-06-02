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
            'waterLevel'    => null, // Should display last reading
            'lastOnline'    => $this->last_online,
            'mountHeight'  => $this->mount_height,
            'location'       => $this->location
                ? [$this->location->latitude, $this->location->longitude]
                : null,
            'address'        => $this->address,
            'yellowLevel'  => $this->yellow_level,
            'redLevel'     => $this->red_level,
            'currentStatus' => $this->current_status,
            'mountLocation'   => $this->whenLoaded('location', function() {
                return $this->location->name ?? null;
            }),

            'deactivatedAt' => $this->relationLoaded('social_element')
                ? $this->social_element?->deactivated_at?->toIso8601String()
                : null,

            'registeredBy' => $this->whenLoaded('social_element', function() {
                return $this->social_element->user?->govOp?->location?->name ?? null;
            }),

            // include sensor logs when loaded in show method here
        ];
    }
}
