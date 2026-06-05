<?php

namespace App\Services;

use App\Models\PhoneNumber;
use Illuminate\Support\Collection;

class SMSBroadcastService
{
    public function getRecipientsForLocation(int $locationId): Collection
    {
        return PhoneNumber::with([
                'user.name',
                'user.indivAcc.location',
            ])
            ->whereHas('user', function ($query) use ($locationId) {
                $query->whereNull('deactivated_at')
                    ->whereHas('indivAcc', function ($indivAccQuery) use ($locationId) {
                        $indivAccQuery->where('location_id', $locationId);
                    });
            })
            ->whereNotNull('phone_no')
            ->get();
    }
}
