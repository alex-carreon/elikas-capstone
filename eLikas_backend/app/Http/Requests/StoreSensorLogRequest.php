<?php

namespace App\Http\Requests;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class StoreSensorLogRequest extends FormRequest
{
    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'sensor_code' => ['required', 'string', 'exists:Sensors,sensor_code'],
            'water_level' => ['required', 'numeric', 'gt:0'],
            'sensor_timestamp' => ['required', 'date']
        ];
    }

    protected function prepareForValidation()
    {
        $this->merge([
            'sensor_code' => $this->sensorCode,
            'water_level' => $this->waterLevel,
            'sensor_timestamp' => $this->sensorTimestamp
        ]);
    }
}
