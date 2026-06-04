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
            'address'      => ['sometimes', 'string', 'max:255'],
            'yellow_level' => ['sometimes', 'numeric', 'min:0'],
            'orange_level' => ['sometimes', 'numeric', 'min:0'],
            'red_level'    => ['sometimes', 'numeric', 'min:0'],
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
        if ($this->has('orangeLevel')) {
            $merge['orange_level'] = $this->orangeLevel;
        }
        if ($this->has('redLevel')) {
            $merge['red_level'] = $this->redLevel;
        }

        if (!empty($merge)) {
            $this->merge($merge);
        }
    }

    public function after(): array
    {
        // Add custom validation to ensure the levels maintain their logical order if they are being updated
        return [
            function ($validator) {
                $sensor = $this->route('sensor'); // Get the current sensor being updated

                // Use the input values if provided, otherwise fall back to the existing sensor values
                $yellow = $this->input('yellow_level') ?? $sensor->yellow_level;
                $orange = $this->input('orange_level') ?? $sensor->orange_level;
                $red    = $this->input('red_level') ?? $sensor->red_level;
                $mount = $this->input('mount_height') ?? $sensor->mount_height;
                $data = $this->validated();

                // Validate the logical order of the levels
                if (isset($data['yellow_level'])) {
                    if ($data['yellow_level'] >= ($orange)) {
                        $validator->errors()->add('yellow_level', 'The yellow level must be less than the orange level.');
                    }
                }

                if (isset($data['orange_level'])) {
                    if ($data['orange_level'] <= ($yellow)) {
                        $validator->errors()->add('orange_level', 'The orange level must be greater than the yellow level.');
                    }
                    if ($data['orange_level'] >= ($red)) {
                        $validator->errors()->add('orange_level', 'The orange level must be less than the red level.');
                    }
                }

                if (isset($data['red_level'])) {
                    if ($data['red_level'] <= ($orange)) {
                        $validator->errors()->add('red_level', 'The red level must be greater than the orange level.');
                    }
                    if ($data['red_level'] >= ($mount)) {
                        $validator->errors()->add('red_level', 'The red level must be less than the mount height.');
                    }
                }

                if (isset($data['mount_height'])) {
                    if ($data['mount_height'] <= ($red)) {
                        $validator->errors()->add('mount_height', 'The mount height must be greater than the red level.');
                    }
                }
            }
        ];
    }
}
