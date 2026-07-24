<?php

namespace App\Http\Controllers\PinControllers;

use App\Http\Controllers\Controller;
use App\Models\CapacityLevel;
use App\Models\EvacArea;
use Illuminate\Http\Request;

class GetEvacAreaDetailsController extends Controller
{
    private function decodeFacilities(array|string|null $raw): array
    {
        if ($raw === null || $raw === '') {
            return [];
        }

        if (is_array($raw)) {
            return array_values(array_filter(array_map('strval', $raw), fn ($v) => $v !== ''));
        }

        $decoded = json_decode($raw, true);

        if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
            return array_values(array_filter(array_map('strval', $decoded), fn ($v) => $v !== ''));
        }

        return array_values(array_filter(array_map('trim', explode(',', $raw)), fn ($v) => $v !== ''));
    }

    public function getEvacAreaDetails(Request $request, $id)
    {
        try {
            $user = $request->attributes->get('firebase_user');

            $pin = EvacArea::with([
            'social_element.user',
            'social_element.media',
            'gov_op.user',
            'evac_type',
            'capacity_level_info',
            'location_info',
        ])->find($id);

            if (!$pin) {
                return response()->json([
                    'error' => 'Evacuation area not found'
                ], 404);
            }

            $coordinates = [
                $pin->location?->latitude,
                $pin->location?->longitude,
            ];

            return response()->json([
                'id' => $pin->id,
                'name' => $pin->name,
                'address' => $pin->address,
                'description' => $pin->description,
                'coordinates' => $coordinates,
                'location_id' => $pin->location_id,
                'area_type_id' => $pin->area_type,
                'area_type' => $pin->evac_type?->evac_type,
                'capacity_level_id' => $pin->capacity_level,
                'capacity_name' => CapacityLevel::describe($pin->capacity_level_info?->capacity_level),
                'is_persistent' => $pin->is_persistent,
                'for_reg_flood' => $pin->for_reg_flood,
                'for_heavy_flood' => $pin->for_heavy_flood,
                'has_accom' => $pin->has_accom,
                'has_DRRMO' => $pin->has_DRRMO,
                'has_health' => $pin->has_health,
                'pwd_friendly' => $pin->pwd_friendly,
                'has_catchment' => $pin->has_catchment,
                'toilet_count' => $pin->toilet_count,
                'kitchen_count' => $pin->kitchen_count,
                'child_prayer_count' => $pin->child_prayer_count,
                'breastfeed_count' => $pin->breastfeed_count,
                'other_facilities' => $this->decodeFacilities($pin->other_facilities),
                'contact_person' => $pin->contact_person,
                'contact_number' => $pin->contact_number,
                'is_deactivated' => $pin->social_element?->deactivated_at !== null,
                'is_expired' => $pin->expiry !== null && $pin->expiry->lte(now('UTC')),
                'expiry' => $pin->expiry
                    ? $pin->expiry->timezone('Asia/Manila')->toDateTimeString()
                    : null,
                'expiry_label' => (function () use ($pin) {
                    if ($pin->expiry === null) {
                        return null;
                    }

                    $now = now('Asia/Manila');
                    $expiry = $pin->expiry->clone()->timezone('Asia/Manila');

                    if ($expiry->lte($now)) {
                        return 'Expired';
                    }

                    $hoursLeft = $expiry->diffInHours($now);

                    if ($hoursLeft < 24) {
                        return $hoursLeft <= 0
                            ? 'Expires in less than an hour'
                            : 'Expires in ' . $hoursLeft . ' hour' . ($hoursLeft === 1 ? '' : 's');
                    }

                    $daysLeft = $expiry->diffInDays($now);

                    return 'Expires in ' . $daysLeft . ' day' . ($daysLeft === 1 ? '' : 's');
                })(),

                'deactivated_at' => $pin->social_element?->deactivated_at
                    ? $pin->social_element->deactivated_at->timezone('Asia/Manila')->toDateTimeString()
                    : null,

                'last_updated' => $pin->last_updated
                    ? $pin->last_updated->timezone('Asia/Manila')->toDateTimeString()
                    : null,
                'verified_by' => [
                    'gov_op_id' => $pin->verified_by,
                    'username' => $pin->gov_op?->user?->username,
                ],
                'posted_by' => [
                    'user_id' => $pin->social_element?->user_id,
                    'username' => $pin->social_element?->user?->username,
                    'posted_at' => $pin->social_element?->posted_at
                        ? $pin->social_element->posted_at->timezone('Asia/Manila')->toDateTimeString()
                        : null,
                ],
                'is_own_pin' => $user !== null && (int) $pin->social_element?->user_id === (int) $user->id,
                'media' => $pin->social_element?->media->map(function ($media) {
                    return [
                        'id' => $media->id,
                        'url' => config('app.media_base_url') . '/' . $media->file_path,
                        'type' => $media->file_type,
                    ];
                })->toArray() ?? [],
                'last_confirmed' => $pin->verified_at
                    ? $pin->verified_at->timezone('Asia/Manila')->toDateTimeString()
                    : null,

            ], 200);

        } catch (\Exception $e) {

            return response()->json([
                'error' => 'Failed to fetch evacuation area details',
                'details' => $e->getMessage()
            ], 500);
        }
    }
}
