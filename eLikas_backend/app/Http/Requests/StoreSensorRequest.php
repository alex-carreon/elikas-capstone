<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use MatanYadaev\EloquentSpatial\Objects\Point;

class StoreSensorRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name'         => ['required', 'string', 'max:50'],
            'mount_height' => ['required', 'numeric', 'min:0'],
            'location.0'   => ['required', 'numeric', 'between:-90,90'],
            'location.1'   => ['required', 'numeric', 'between:-180,180'],
            'address'      => ['required', 'string', 'max:255'],
            'location_id'  => ['required', 'integer', 'exists:Locations,id'],
            'yellow_level' => ['required', 'numeric', 'min:0'],
            'orange_level' => ['required', 'numeric', 'min:0', 'gt:yellow_level', 'lt:red_level'],
            'red_level'    => ['required', 'numeric', 'min:0', 'gt:orange_level', 'lt:mount_height']
        ];
    }

    protected function prepareForValidation()
    {
        $this->merge([
            'mount_height' => $this->mountHeight,
            'yellow_level' => $this->yellowLevel,
            'orange_level' => $this->orangeLevel,
            'red_level'    => $this->redLevel,
            'location_id'  => $this->locationId,
        ]);
    }

    public function validated($key = null, $default = null): array
    {
        $data = parent::validated($key, $default);

        if (isset($data['location'])) {
            $data['location'] = new Point(
                latitude: $data['location'][0],
                longitude: $data['location'][1]
            );
        }

        return $data;
    }
}
