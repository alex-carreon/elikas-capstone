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
            $govOp = $user->govOp;
            $locationId = $govOp->location_id;

            $element = SocialElement::create([
                'user_id'   => $user->id,
                'posted_at' => now(),
                'type_id'   => 2,
                'has_media' => false,
            ]);

            // Count existing sensors at this location for the sequence
            $sequence = Sensor::whereHas('social_element.user.govOp', function ($q) use ($locationId) {
                $q->where('location_id', $locationId);
            })->count() + 1;

            $sensor = new Sensor($validated);
            $sensor->element_id     = $element->id;
            $sensor->sensor_code    = sprintf('SN-%d-%03d', $locationId, $sequence);
            $sensor->current_status = 'normal';
            $sensor->last_online    = null;
            $sensor->save();

            return $sensor;
        });
    }
}
