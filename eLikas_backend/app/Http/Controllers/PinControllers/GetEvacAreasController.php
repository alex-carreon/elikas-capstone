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
            $pins = EvacArea::with('social_element')
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

            $pins = EvacArea::with('social_element')
                ->whereHas('social_element', function ($q) use ($user) {
                    $q->where('user_id', $user->id)
                      ->whereNull('deactivated_at');
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
                'error' => 'Failed to fetch your evacuation areas',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    // GET /api/admin/pins
    // Admin dashboard: show expired and deactivated
    public function getAdminEvacAreas()
    {
        try {
            $pins = EvacArea::with('social_element')->get();

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

    private function formatEvacArea($pin)
    {
        return [
            'id' => $pin->id,
            'name' => $pin->name,
            'address' => $pin->address,
            'lat' => $pin->location?->latitude,
            'lng' => $pin->location?->longitude,
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
}
