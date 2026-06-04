<?php

namespace App\Services;

use App\Models\Sensor;
use App\Models\SocialElement;
use App\Models\User;
use Illuminate\Support\Facades\DB;

class SensorService
{
    /**
     * Create a new class instance.
     */
    public function __construct()
    {
        //
    }

    public function create(array $validated, User $user): Sensor
    {
        return DB::transaction(function () use ($validated, $user) {
            $element = SocialElement::create([
                'user_id'   => $user->id,
                'posted_at' => now(),
                'type_id'   => 2,
                'has_media' => false,
            ]);

            $sensor = Sensor::create([
                'element_id' => $element->id,
                'mount_height' => $validated['mount_height'],
                'name' => $validated['name'],
                'location' => $validated['location'],
                'address' => $validated['address'],
                'yellow_level' => $validated['yellow_level'],
                'orange_level' => $validated['orange_level'],
                'red_level' => $validated['red_level'],
                'location_id' => $validated['location_id'],
            ]);

            $sensor->refresh();

            return $sensor;
        });
    }
}
