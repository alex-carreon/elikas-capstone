<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class EvacAreaVerifyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'verified' => 'required|boolean',
        ];
    }
}
