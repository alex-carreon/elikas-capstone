<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateEvacAreaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name'               => 'sometimes|string|max:255',
            'address'            => 'sometimes|string|max:255',
            'lat'                => 'sometimes|numeric|between:-90,90',
            'lng'                => 'sometimes|numeric|between:-180,180',
            'location_id'        => 'sometimes|integer|exists:Locations,id',
            'area_type'          => 'sometimes|integer|exists:EvacTypes,id',
            'capacity_level'     => 'sometimes|integer|exists:CapacityLevels,id',
            'description'        => 'nullable|string',
            'is_persistent'      => 'boolean',
            'for_reg_flood'      => 'boolean',
            'for_heavy_flood'    => 'boolean',
            'has_accom'          => 'boolean',
            'has_DRRMO'          => 'boolean',
            'has_health'         => 'boolean',
            'pwd_friendly'       => 'boolean',
            'has_catchment'      => 'boolean',
            'toilet_count'       => 'nullable|integer|min:0',
            'kitchen_count'      => 'nullable|integer|min:0',
            'child_prayer_count' => 'nullable|integer|min:0',
            'breastfeed_count'   => 'nullable|integer|min:0',
            'other_facilities'   => 'nullable|string',
            'contact_person'     => 'nullable|string|max:255',
            'contact_number'     => 'nullable|string|max:20',
            'expiry'             => 'nullable|date',
        ];
    }
}
