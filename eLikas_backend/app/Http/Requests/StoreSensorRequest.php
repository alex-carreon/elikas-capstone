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
            'name'         => ['required', 'string', 'max:255'],
            'mount_height' => ['required', 'numeric', 'min:0'],
            'location.0'   => ['required', 'numeric', 'between:-90,90'],
            'location.1'   => ['required', 'numeric', 'between:-180,180'],
            'address'      => ['nullable', 'string', 'max:255'],
            'location_id'  => ['required', 'integer', 'exists:Locations,id'],
            'yellow_level' => ['required', 'numeric', 'min:0'],
            'red_level'    => ['required', 'numeric', 'min:0'],
        ];
    }

    protected function prepareForValidation()
    {
        $this->merge([
            'mount_height' => $this->mountHeight,
            'yellow_level' => $this->yellowLevel,
            'red_level'    => $this->redLevel,
            'location_id'  => $this->locationId,
        ]);
    }

    protected function passedValidation()
    {
        $this->merge([
            'location' => new Point(
                latitude: $this->input('location.0'),
                longitude: $this->input('location.1')
            ),
        ]);
    }

    // Override validated() to inject the Point
    public function validated($key = null, $default = null): array
    {
        return array_merge(parent::validated($key, $default), [
            'location' => $this->input('location'),
        ]);
    }
}
