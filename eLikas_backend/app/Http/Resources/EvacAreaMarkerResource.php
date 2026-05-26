<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EvacAreaMarkerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'     => $this->id,
            'lat'    => $this->lat,
            'lng'    => $this->lng,
            'expiry' => $this->expiry?->toDateString(),
            'status' => $this->is_expired ? 'EXPIRED' : 'ACTIVE',
        ];
    }
}
