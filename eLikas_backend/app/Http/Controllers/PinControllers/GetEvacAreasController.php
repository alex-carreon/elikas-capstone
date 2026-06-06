<?php

namespace App\Http\Controllers\PinControllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\EvacArea;

class GetEvacAreasController extends Controller
{
    // ==================== PUBLIC METHODS ====================

    // GET /api/pins
    // Map view with optional query filters:
    // ?created_by=me, ?role=govop|indiv|admin, ?active=true
    public function getEvacAreas(Request $request)
    {
        try {
            $user = $request->attributes->get('firebase_user');

            $query = EvacArea::query()
                ->select(['id', 'location'])
                ->with(['social_element:id,user_id,deactivated_at']);

            if (!$request->filled('active') || $request->boolean('active')) {
                $query
                    ->whereHas('social_element', function ($q) {
                        $q->whereNull('deactivated_at');
                    })
                    ->where(function ($q) {
                        $q->whereNull('expiry')
                          ->orWhere('expiry', '>', now('UTC'));
                    });
            }

            if ($request->query('created_by') === 'me') {
                if (!$user) {
                    return response()->json([
                        'error' => 'Authentication required for created_by=me'
                    ], 401);
                }

                $query->whereHas('social_element', function ($q) use ($user) {
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

                $query->whereHas('social_element.user', function ($q) use ($roleId) {
                    $q->where('role_id', $roleId);
                });
            }

            $pins = $query->get();

            return response()->json([
                'count' => $pins->count(),
                'pins' => $pins->map(function ($pin) use ($user) {
                    return $this->formatEvacArea($pin, $user);
                })
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch evacuation areas',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    // GET /api/my-coords?search={name-or-address}
    // Logged-in user's pins: active and inactive, coordinates only.
    public function getMyCoords(Request $request)
    {
        try {
            $user = $request->attributes->get('firebase_user');

            $query = EvacArea::query()
                ->select(['id', 'element_id', 'location_id', 'location', 'expiry'])
                ->with([
                    'social_element:id,user_id,deactivated_at',
                    'location_info:id,name',
                ])
                ->whereHas('social_element', function ($q) use ($user) {
                    $q->where('user_id', $user->id);
                });

            $this->applySearchFilter($query, $request);

            if ($request->filled('location_id')) {
                $query->where('location_id', $request->integer('location_id'));
            }

            $pins = $query->get();

            return response()->json([
                'count' => $pins->count(),
                'pins' => $pins->map(function ($pin) use ($user) {
                    return $this->formatCoordsOnly($pin, $user);
                })
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch user pin coordinates',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    // GET /api/my-evac-history?search={name-or-address}&location_id={id}
    // User's evacuation area history with details
    public function getMyEvacHistory(Request $request)
    {
        try {
            $user = $request->attributes->get('firebase_user');

            $query = EvacArea::with([
                'social_element',
            ])
                ->whereHas('social_element', function ($q) use ($user) {
                    $q->where('user_id', $user->id);
                });

            if ($request->filled('search')) {
                $this->applySearchFilter($query, $request);
            }

            if ($request->filled('location_id')) {
                $query->where('location_id', $request->integer('location_id'));
            }

            $pins = $query->get();

            return response()->json([
                'count' => $pins->count(),
                'pins' => $pins->map(function ($pin) use ($user) {
                    return $this->formatHistoryEvacArea($pin, $user);
                })
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch evacuation pin history',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    // GET /api/admin/pins
    // Admin dashboard: show expired and deactivated
    public function getAdminEvacAreas(Request $request)
    {
        try {
            $query = EvacArea::with([
                'social_element',
                'evac_type',
                'capacity_level_info',
            ]);

            $this->applySearchFilter($query, $request);

            if ($request->filled('location_id')) {
                $query->where('location_id', $request->integer('location_id'));
            }

            $this->applySearchFilter($query, $request);

            $pins = $query->get();
            $user = $request->attributes->get('firebase_user');

            return response()->json([
                'count' => $pins->count(),
                'pins' => $pins->map(function ($pin) use ($user) {
                    return $this->formatEvacArea($pin, $user);
                })
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch admin evacuation areas',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    // ==================== PRIVATE FORMATTING METHODS ====================

    private function formatEvacArea(EvacArea $pin, $user = null)
    {
        return [
            'id' => $pin->id,
            'lat' => $pin->location?->latitude,
            'lng' => $pin->location?->longitude,
            'own_pins' => $user && $pin->social_element?->user_id === $user->id,
        ];
    }

    private function formatCoordsOnly(EvacArea $pin, $user = null)
    {
        $isActive = $pin->social_element?->deactivated_at === null
            && (
                $pin->expiry === null ||
                $pin->expiry->gt(now('UTC'))
            );

        return [
            'id' => $pin->id,
            'lat' => $pin->location?->latitude,
            'lng' => $pin->location?->longitude,
            'location_id' => $pin->location_id,
            'location_name' => $pin->location_info?->name,
            'status' => $isActive ? 'active' : 'inactive',
            'own_pins' => $user && $pin->social_element?->user_id === $user->id,
        ];
    }

    private function formatHistoryEvacArea(EvacArea $pin, $user = null)
    {
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
            'own_pins' => $user && $pin->social_element?->user_id === $user->id,
        ];
    }

    // ==================== PRIVATE UTILITY METHODS ====================

    private function applySearchFilter($query, Request $request): void
    {
        if (!$request->filled('search')) {
            return;
        }

        $search = '%' . $this->escapeLike($request->query('search')) . '%';

        $query->where(function ($q) use ($search) {
            $q->where('name', 'LIKE', $search)
              ->orWhere('address', 'LIKE', $search);
        });
    }

    private function escapeLike(string $value): string
    {
        return str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $value);
    }

    private function resolveRoleId(?string $role): ?int
    {
        return match (strtolower($role)) {
            'admin' => 1,
            'govop', 'gov_op', 'government', 'barangay', 'brgy_op' => 2,
            'individual', 'indiv', 'user' => 3,
            default => null,
        };
    }
}

