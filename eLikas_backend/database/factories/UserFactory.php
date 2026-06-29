<?php

namespace Database\Factories;

use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;

class UserFactory extends Factory
{
    protected $model = User::class;

    public function definition(): array
    {
        return [
            'username' => fake()->unique()->userName(),
            'email' => fake()->unique()->safeEmail(),
            'role_id' => 3,
            'avatar_seed' => fake()->regexify('[A-Za-z0-9]{8}'),
            'created_at' => now(),
            'deactivated_at' => null,
        ];
    }
}