<?php

namespace App\Http\Controllers\PinControllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\EvacArea;

class GetEvacAreasController extends Controller
{
    // GET /api/pins
    // Guest map view: hide expired and deactivated
    public function getEvacAreas()
    {
        try {
            $pins = EvacArea::with([
                'social_element',
                'evac_type',
                'capacity_level_info',
            ])
                ->whereHas('social_element', function ($q) {
                    $q->whereNull('deactivated_at');
                })
                ->where(function ($q) {
                    $q->whereNull('expiry')
                      ->orWhere('expiry', '>', now('UTC'));
                })
                ->get();

            return response()->json([
                'count' => $pins->count(),
                'pins' => $pins->map(function ($pin) {
                    return $this->formatEvacArea($pin);
                })
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch evacuation areas',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    // GET /api/pins/history
    // Logged-in user history: show expired, hide deactivated
    public function getMyEvacAreas(Request $request)
{
    try {
        $user = $request->attributes->get('firebase_user');

        $pins = EvacArea::with([
            'social_element.user',
        ])
            ->whereHas('social_element', function ($q) {
                $q->whereNull('deactivated_at');
            });

        if ($request->boolean('own_pins')) {
            $pins->whereHas('social_element', function ($q) use ($user) {
                $q->where('user_id', $user->id);
            });
        }

        if ($request->filled('role')) {
            $roleId = $this->resolveRoleId($request->query('role'));

            if ($roleId === null) {
                return response()->json([
                    'error' => 'Invalid role filter'
                ], 422);
            }

            $pins->whereHas('social_element.user', function ($q) use ($roleId) {
                $q->where('role_id', $roleId);
            });
        }

        $pins = $pins->get();

        return response()->json([
            'count' => $pins->count(),
            'pins' => $pins->map(function ($pin) {
                return $this->formatHistoryEvacArea($pin);
            })
        ], 200);

    } catch (\Exception $e) {
        return response()->json([
            'error' => 'Failed to fetch evacuation areas',
            'details' => $e->getMessage()
        ], 500);
    }
}

    // GET /api/admin/pins
    // Admin dashboard: show expired and deactivated
    public function getAdminEvacAreas()
    {
        try {
            $pins = EvacArea::with([
                'social_element',
                'evac_type',
                'capacity_level_info',
            ])->get();

            return response()->json([
                'count' => $pins->count(),
                'pins' => $pins->map(function ($pin) {
                    return $this->formatEvacArea($pin);
                })
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch admin evacuation areas',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    private function formatEvacArea(EvacArea $pin)
    {
        $lat = $pin->location?->latitude;
        $lng = $pin->location?->longitude;

        return [
            'id' => $pin->id,
            'element_id' => $pin->element_id,
            'name' => $pin->name,
            'address' => $pin->address,
            'description' => $pin->description,

            'coordinates' => [
                $lat,
                $lng,
            ],

            'location_id' => $pin->location_id,

            'area_type_id' => $pin->area_type,
            'area_type' => $pin->evac_type?->evac_type,

            'capacity_level_id' => $pin->capacity_level,
            'capacity_name' => $pin->capacity_level_info?->capacity_level,

            'is_persistent' => $pin->is_persistent,
            'for_reg_flood' => $pin->for_reg_flood,
            'for_heavy_flood' => $pin->for_heavy_flood,
        ];
    }

    private function formatHistoryEvacArea(EvacArea $pin)
    {
        $lat = $pin->location?->latitude;
        $lng = $pin->location?->longitude;

        return [
            'id' => $pin->id,
            'name' => $pin->name,
            'address' => $pin->address,

            'expiry' => $pin->expiry
                ? $pin->expiry->timezone('Asia/Manila')->toDateTimeString()
                : null,

            'is_expired' => $pin->expiry !== null && $pin->expiry->lte(now('UTC')),

            'is_deactivated' => $pin->social_element?->deactivated_at !== null,

            'deactivated_at' => $pin->social_element?->deactivated_at
                ? $pin->social_element->deactivated_at->timezone('Asia/Manila')->toDateTimeString()
                : null,

            'posted_at' => $pin->social_element?->posted_at
                ? $pin->social_element->posted_at->timezone('Asia/Manila')->toDateTimeString()
                : null,

            'last_confirmed' => $pin->verified_at
                ? $pin->verified_at->timezone('Asia/Manila')->toDateTimeString()
                : null,
        ];
    }
    private function resolveRoleId(?string $role): ?int
    {
        return match (strtolower($role)) {
            'admin' => 1,
            'govop', 'gov_op', 'government' => 2,
            'individual', 'indiv', 'user' => 3,
            default => null,
        };
    }
}
