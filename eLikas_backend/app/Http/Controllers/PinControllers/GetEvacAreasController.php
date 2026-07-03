<?php

namespace App\Http\Controllers\PinControllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\EvacArea;

class GetEvacAreasController extends Controller
{
    // ==================== PUBLIC METHODS ====================

    // GET /api/pins
    public function getEvacAreas(Request $request)
    {
        try {
            $user = $request->attributes->get('firebase_user');

            $query = EvacArea::query()
                ->select(['id', 'element_id', 'location', 'name', 'address'])
                ->with(['social_element:id,user_id,deactivated_at']);

            // Apply search filter globally for name/address matches
            $this->applySearchFilter($query, $request);

            $active = $this->parseBooleanQuery($request, 'active');

            if ($active === null && $request->filled('active')) {
                return response()->json([
                    'error' => 'Invalid active value. Use true or false.',
                ], 422);
            }

            // Default behaviour: only show active (non-deactivated, non-expired) pins.
            // active=false returns only inactive pins: deactivated or expired.
            if ($active === false) {
                $query->where(function ($q) {
                    $q->whereHas('social_element', function ($social) {
                        $social->whereNotNull('deactivated_at');
                    })->orWhere(function ($expiry) {
                        $expiry->whereNotNull('expiry')
                            ->where('expiry', '<=', now('UTC'));
                    })->orWhereHas('social_element.user', function ($social) {
                        $social->whereNotNull('deactivated_at');
                    });
                });
            } else {
                $query
                    ->notDeactivated()
                    ->notUserDeactivated()
                    ->notExpired();
            }

            // Filter by role — supports both single (?role=indiv) and array (?role[]=indiv&role[]=admin)
            $rawRole = $request->query('role');
            if (!empty($rawRole)) {
                $roleInputs = is_array($rawRole) ? $rawRole : [$rawRole];

                $roleIds = collect($roleInputs)
                    ->map(fn($r) => $this->resolveRoleId($r))
                    ->filter(fn($id) => $id !== null)
                    ->unique()
                    ->values()
                    ->all();

                if (count($roleInputs) > 0 && count($roleIds) === 0) {
                    return response()->json([
                        'error' => 'Invalid role filter. Accepted values: admin, govop, indiv',
                    ], 422);
                }

                if (!empty($roleIds)) {
                    $query->whereHas('social_element.user', function ($q) use ($roleIds) {
                        $q->whereIn('role_id', $roleIds);
                    });
                }
            }

            // Filter by barangay/location (location_id on EvacAreas table)
            if ($request->filled('barangay')) {
                $barangayId = (int) $request->query('barangay');
                $query->where('location_id', $barangayId);
            }

            // Filter by is_persistent flag
            if ($request->has('is_persistent')) {
                $isPersistent = filter_var($request->query('is_persistent'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);

                if ($isPersistent === null) {
                    return response()->json([
                        'error' => 'Invalid is_persistent value. Use true or false.',
                    ], 422);
                }

                $query->where('is_persistent', $isPersistent);
            }

            $pins = $query->get();

            return response()->json([
                'count' => $pins->count(),
                'pins'  => $pins->map(function ($pin) use ($user) {
                    return $this->formatEvacArea($pin, $user);
                }),
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Failed to fetch evacuation areas',
                'details' => $e->getMessage(),
            ], 500);
        }
    }

    // GET /api/pins/my-coords   (auth required — role:1,2,3)
    public function getMyCoords(Request $request)
    {
        try {
            $user = $request->attributes->get('firebase_user');

            // This endpoint requires authentication — guard defensively
            if (!$user) {
                return response()->json([
                    'error' => 'Authentication required to access your pin coordinates.',
                ], 401);
            }

            $query = EvacArea::query()
                ->select(['id', 'element_id', 'location_id', 'location', 'expiry', 'is_persistent'])
                ->with([
                    'social_element:id,user_id,deactivated_at',
                    'social_element.user:id,deactivated_at',
                    'location_info:id,name',
                ])
                // Strictly isolate to this user's own pins only
                ->whereHas('social_element', function ($q) use ($user) {
                    $q->where('user_id', (int) $user->id);
                });

            $this->applySearchFilter($query, $request);

            // Optional is_persistent filter
            if ($request->has('is_persistent')) {
                $isPersistent = filter_var($request->query('is_persistent'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);

                if ($isPersistent === null) {
                    return response()->json([
                        'error' => 'Invalid is_persistent value. Use true or false.',
                    ], 422);
                }

                $query->where('is_persistent', $isPersistent);
            }

            // Optional barangay filter
            if ($request->filled('barangay')) {
                $query->where('location_id', (int) $request->query('barangay'));
            }

            $pins = $query->get();

            return response()->json([
                'count' => $pins->count(),
                'pins'  => $pins->map(function ($pin) use ($user) {
                    return $this->formatCoordsOnly($pin, $user, true);
                }),
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Failed to fetch your pin coordinates',
                'details' => $e->getMessage(),
            ], 500);
        }
    }

    // GET /api/evacpins/users/history  OR  /api/evacpins/users
    public function getMyEvacHistory(Request $request)
    {
        try {
            $user = $request->attributes->get('firebase_user');

            if (!$user) {
                return response()->json([
                    'error' => 'Authentication required to access your evacuation history.',
                ], 401);
            }

            $query = EvacArea::with([
                'social_element',
                'social_element.user:id,deactivated_at',
            ])
                ->whereHas('social_element', function ($q) use ($user) {
                    $q->where('user_id', $user->id);
                });

            $this->applySearchFilter($query, $request);

            // Optional is_persistent filter
            if ($request->has('is_persistent')) {
                $isPersistent = filter_var($request->query('is_persistent'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);

                if ($isPersistent === null) {
                    return response()->json([
                        'error' => 'Invalid is_persistent value. Use true or false.',
                    ], 422);
                }

                $query->where('is_persistent', $isPersistent);
            }

            // Optional barangay filter
            if ($request->filled('barangay')) {
                $query->where('location_id', (int) $request->query('barangay'));
            }

            //Forda capacity level filter
            if ($request->filled('capacity_level_id')) {
                $query->where('capacity_level', (int) $request->query('capacity_level_id'));
            }

            $pins = $query->get();

            return response()->json([
                'count' => $pins->count(),
                'pins'  => $pins->map(function ($pin) use ($user) {
                    return $this->formatHistoryEvacArea($pin, $user);
                }),
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Failed to fetch evacuation pin history',
                'details' => $e->getMessage(),
            ], 500);
        }
    }

    // GET /api/admin/pins
    public function getAdminEvacAreas(Request $request)
    {
        try {
            $query = EvacArea::with([
                'social_element',
                'social_element.user:id,deactivated_at',
            ]);

            $this->applySearchFilter($query, $request);

            // Filter by role
            if ($request->filled('role')) {
                $roleId = $this->resolveRoleId($request->query('role'));

                if ($roleId === null) {
                    return response()->json([
                        'error' => 'Invalid role filter. Accepted values: admin, govop, indiv',
                    ], 422);
                }

                $query->whereHas('social_element.user', function ($q) use ($roleId) {
                    $q->where('role_id', $roleId);
                });
            }

            // Filter by barangay/location
            if ($request->filled('barangay')) {
                $query->where('location_id', (int) $request->query('barangay'));
            }

            // Filter by is_persistent
            if ($request->has('is_persistent')) {
                $isPersistent = filter_var($request->query('is_persistent'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);

                if ($isPersistent === null) {
                    return response()->json([
                        'error' => 'Invalid is_persistent value. Use true or false.',
                    ], 422);
                }

                $query->where('is_persistent', $isPersistent);
            }

            if ($request->filled('is_deactivated')) {
                $isDeactivated = filter_var($request->query('is_deactivated'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);

                if ($isDeactivated === null) {
                    return response()->json([
                        'error' => 'Invalid is_deactivated value. Use true or false.',
                    ], 422);
                }

                $query->whereHas('social_element', function ($q) use ($isDeactivated) {
                    if ($isDeactivated) {
                        $q->whereNotNull('deactivated_at');
                    } else {
                        $q->whereNull('deactivated_at');
                    }
                });
            }

            if ($request->filled('is_expired')) {
                $isExpired = filter_var($request->query('is_expired'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);

                if ($isExpired === null) {
                    return response()->json([
                        'error' => 'Invalid is_expired value. Use true or false.',
                    ], 422);
                }

                if ($isExpired) {
                     $query->whereNotNull('expiry')->where('expiry', '<=', now('UTC'));
                } else {
                    $query->where(function ($q) {
                        $q->whereNull('expiry')->orWhere('expiry', '>', now('UTC'));
                    });
                }
            }

            if ($request->filled('is_user_deactivated')) {
                $isUserDeactivated = filter_var($request->query('is_user_deactivated'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);

                if ($isUserDeactivated === null) {
                    return response()->json([
                        'error' => 'Invalid is_user_deactivated value. Use true or false.',
                    ], 422);
                }

                $query->whereHas('social_element.user', function ($q) use ($isUserDeactivated) {
                    if ($isUserDeactivated) {
                        $q->whereNotNull('deactivated_at');
                    } else {
                        $q->whereNull('deactivated_at');
                    }
                });
            }

            if ($request->filled('status')) {
                $status = strtolower($request->query('status'));

                if (!in_array($status, ['active', 'inactive'], true)) {
                    return response()->json([
                        'error' => 'Invalid status value. Use active or inactive.',
                    ], 422);
                }

                if ($status === 'active') {
                    $query
                        ->notDeactivated()
                        ->notUserDeactivated()
                        ->notExpired();
                } else {
                    $query->where(function ($q) {
                        $q->whereHas('social_element', fn ($s) => $s->whereNotNull('deactivated_at'))
                          ->orWhere(fn ($e) => $e->whereNotNull('expiry')->where('expiry', '<=', now('UTC')))
                          ->orWhereHas('social_element.user', fn ($s) => $s->whereNotNull('deactivated_at'));
                    });
                }
            }

            $locationId = $request->filled('barangay_id')
                ? (int) $request->query('barangay_id')
                : ($request->filled('location_id') ? (int) $request->query('location_id') : null);

            if ($locationId !== null) {
                $query->where('location_id', $locationId);
            }

            $pins  = $query->get();
            $user  = $request->attributes->get('firebase_user');

            return response()->json([
                'count' => $pins->count(),
                'pins'  => $pins->map(function ($pin) use ($user) {
                    return $this->formatHistoryEvacArea($pin, $user);
                }),
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Failed to fetch admin evacuation areas',
                'details' => $e->getMessage(),
            ], 500);
        }
    }

    // ==================== PRIVATE FORMATTING METHODS ====================

    /**
     * Lightweight map-pin format.
     */
    private function formatEvacArea(EvacArea $pin, $user = null): array
    {
        $isOwner = $this->isOwner($pin, $user);

        return [
            'id'       => $pin->id,
            'lat'      => $pin->location?->latitude,
            'lng'      => $pin->location?->longitude,
            'my_pin'   => $isOwner,
        ];
    }

    private function isOwner(EvacArea $pin, $user = null): bool
    {
        return $user !== null && (int) $pin->social_element?->user_id === (int) $user->id;
    }

    /**
     * Coordinates-only format used for both getMyCoords.
     */
    private function formatCoordsOnly(EvacArea $pin, $user = null, bool $forceOwner = false): array
    {
        $isOwner = $forceOwner ? true : $this->isOwner($pin, $user);
        $isActive = $pin->social_element?->deactivated_at === null
            && $pin->social_element?->user?->deactivated_at === null
            && (
                $pin->expiry === null ||
                $pin->expiry->gt(now('UTC'))
            );

        return [
            'id'            => $pin->id,
            'lat'           => $pin->location?->latitude,
            'lng'           => $pin->location?->longitude,
            'location_id'   => $pin->location_id,
            'location_name' => $pin->location_info?->name,
            'is_persistent' => (bool) $pin->is_persistent,
            'status'        => $isActive ? 'active' : 'inactive',
            'my_pin'        => $isOwner,
        ];
    }

    private function formatHistoryEvacArea(EvacArea $pin, $user = null): array
    {
        $isOwner = $this->isOwner($pin, $user);

        return [
            'id'             => $pin->id,
            'name'           => $pin->name,
            'address'        => $pin->address,
            'is_persistent'  => (bool) $pin->is_persistent,
            'expiry'         => $pin->expiry
                ? $pin->expiry->timezone('Asia/Manila')->toDateTimeString()
                : null,
            'is_expired'     => $pin->expiry !== null && $pin->expiry->lte(now('UTC')),
            'is_deactivated' => $pin->social_element?->deactivated_at !== null,
            'is_user_deactivated' => $pin->social_element?->user?->deactivated_at !== null,
            'deactivated_at' => $pin->social_element?->deactivated_at
                ? $pin->social_element->deactivated_at->timezone('Asia/Manila')->toDateTimeString()
                : null,
            'posted_at'      => $pin->social_element?->posted_at
                ? $pin->social_element->posted_at->timezone('Asia/Manila')->toDateTimeString()
                : null,
            'my_pin'         => $isOwner,
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

    private function parseBooleanQuery(Request $request, string $key): ?bool
    {
        if (!$request->filled($key)) {
            return null;
        }

        return filter_var($request->query($key), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);
    }

    private function resolveRoleId(?string $role): ?int
    {
        if ($role === null) {
            return null;
        }

        return match (strtolower($role)) {
            'admin'                                    => 1,
            'govop', 'gov_op', 'government', 'barangay', 'brgy_op' => 2,
            'individual', 'indiv', 'user'              => 3,
            default                                    => null,
        };
    }
}
