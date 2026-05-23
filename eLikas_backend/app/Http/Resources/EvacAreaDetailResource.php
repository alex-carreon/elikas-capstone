<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class EvacAreaDetailResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return [
            'id'          => $this->id,
            'name'        => $this->name,
            'address'     => $this->address,
            'description' => $this->description,
            'lat'         => $this->lat,
            'lng'         => $this->lng,

            'location_id'    => $this->location_id,
            'area_type'      => $this->area_type,
            'capacity_level' => $this->capacity_level,

            'is_persistent'   => (bool) $this->is_persistent,
            'for_reg_flood'   => (bool) $this->for_reg_flood,
            'for_heavy_flood' => (bool) $this->for_heavy_flood,

            'facilities' => [
                'has_accommodation' => (bool) $this->has_accom,
                'has_DRRMO'         => (bool) $this->has_DRRMO,
                'has_health'        => (bool) $this->has_health,
                'pwd_friendly'      => (bool) $this->pwd_friendly,
                'has_catchment'     => (bool) $this->has_catchment,
            ],

            'toilet_count'       => $this->toilet_count,
            'kitchen_count'      => $this->kitchen_count,
            'child_prayer_count' => $this->child_prayer_count,
            'breastfeed_count'   => $this->breastfeed_count,
            'other_facilities'   => $this->other_facilities,

            'contact_person' => $this->contact_person,
            'contact_number' => $this->contact_number,

            'expiry'       => $this->expiry?->toDateString(),
            'status'       => $this->is_expired ? 'EXPIRED' : 'ACTIVE',
            'last_updated' => $this->last_updated,
            'verified_by' => $this->gov_op ? [
            'gov_op_id' => $this->verified_by,
            'username'  => $this->gov_op->user?->username,
            ] : null,
            'posted_by'    => [
                'user_id'   => $this->social_element?->user_id,
                'username'  => $this->social_element?->user?->username,
                'posted_at' => $this->social_element?->posted_at,
            ],
        ];
    }
}
