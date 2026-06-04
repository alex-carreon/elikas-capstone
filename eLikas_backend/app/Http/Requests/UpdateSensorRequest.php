<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

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

                if (!$sensor) {
                    return; // If no sensor is found, skip this validation
                }

                // Use the input values if provided, otherwise fall back to the existing sensor values
                $yellow = $this->input('yellow_level') ?? $sensor->yellow_level;
                $orange = $this->input('orange_level') ?? $sensor->orange_level;
                $red = $this->input('red_level') ?? $sensor->red_level;
                $mount = $this->input('mount_height') ?? $sensor->mount_height;

                // Validate the logical order of the levels
                if ($yellow >= $orange) {
                    $validator->errors()->add('yellow_level', 'The yellow level must be less than the orange level.');
                }

                if ($orange >= $red) {
                    $validator->errors()->add('orange_level', 'The orange level must be less than the red level.');
                }

                if ($red >= $mount) {
                    $validator->errors()->add('red_level', 'The red level must be less than the mount height.');
                }
            }
        ];
    }
}
