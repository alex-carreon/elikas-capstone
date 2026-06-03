<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use MatanYadaev\EloquentSpatial\Objects\Point;

class UpdateSensorRequest extends FormRequest
{

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'name'         => ['sometimes', 'string', 'max:50'],
            'mount_height' => ['sometimes', 'numeric', 'min:0'],
            'address'      => ['sometimes', 'string', 'string', 'max:255'],
            'yellow_level' => ['sometimes', 'numeric', 'min:0'],
            'red_level'    => ['sometimes', 'numeric', 'min:0', 'gt:yellow_level'],
        ];
    }

    protected function prepareForValidation()
    {
        $merge = [];

        if ($this->has('mountHeight')) {
            $merge['mount_height'] = $this->mountHeight;
        }
        if ($this->has('yellowLevel')) {
            $merge['yellow_level'] = $this->yellowLevel;
        }
        if ($this->has('redLevel')) {
            $merge['red_level'] = $this->redLevel;
        }

        if (!empty($merge)) {
            $this->merge($merge);
        }
    }
}
