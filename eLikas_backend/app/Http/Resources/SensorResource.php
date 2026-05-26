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
            'sensor_code'    => $this->sensor_code,
            'name'           => $this->name,
            'water_level'    => null, // Should display last reading
            'last_online'    => $this->last_online,
            'mount_height'  => $this->mount_height,
            'location'       => $this->location
                ? [$this->location->latitude, $this->location->longitude]
                : null,
            'address'        => $this->address,
            'yellow_level'  => $this->yellow_level,
            'red_level'     => $this->red_level,
            'current_status' => $this->current_status,

            'deactivated'    => $this->relationLoaded('social_element')
                ? ($this->social_element?->deactivated_at ? true : false)
                : false, // returns false if deactivated_at is null

            'barangay' => $this->whenLoaded('social_element', function() {
                return $this->social_element->user?->govOp?->location?->name ?? null;
            }),

            // any brgy info here

            // !!! will be removed in final version, just for testing
            // whenLoaded disappears completely if 'social_element' isn't loaded
            'owner' => $this->whenLoaded('social_element', function() {
                return $this->social_element->user?->email ?? null;
            }),

            // include sensor logs when loaded in show method here
        ];
    }
}
