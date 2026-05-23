<?php

namespace App\Http\Controllers;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use App\Http\Requests\EvacAreaVerifyRequest;
use App\Http\Requests\NearbyEvacAreasRequest;
use App\Http\Requests\StoreEvacAreaRequest;
use App\Http\Requests\UpdateEvacAreaRequest;
use App\Http\Resources\EvacAreaDetailResource;
use App\Http\Resources\EvacAreaMarkerResource;
use App\Models\EvacArea;
use App\Models\SocialElement;
use App\Models\User;
use App\Traits\AuthorizesEvacArea;

/**
 * PinController
 *
 * Handles all Evacuation Area (pin) lifecycle operations.
 *
 * RBAC Matrix:
 *   Role 1 — Admin      : Unrestricted global rights on all mutations.
 *   Role 2 — Barangay   : Can mutate any pin whose location_id falls within their
 *                          administrative scope (GovOps.location_id).
 *   Role 3 — Individual : Can mutate ONLY pins they personally authored
 *                          (SocialElements.user_id === their user id).
 *
 * The resolved local User model is injected by FirebaseAuthMiddleware as:
 *   $request->get('firebase_user')
 *
 * All public (GET) methods bypass authentication entirely.
 * All mutation (POST/PUT/PATCH/DELETE) methods require 'firebase.auth' middleware.
 */
class PinController extends Controller
{
    use AuthorizesEvacArea;

    /** SocialElements.type_id that identifies EvacArea rows */
    private const EVAC_AREA_TYPE_ID = 1;

    /** Default search radius in metres for nearby queries */
    private const DEFAULT_NEARBY_RADIUS_METERS = 5000;

    private function activeEvacAreaQuery(): Builder
    {
        return EvacArea::with('social_element')->active();
    }

    private function activeNonExpiredEvacAreaQuery(): Builder
    {
        return $this->activeEvacAreaQuery()
            ->where(fn (Builder $q) => $q->whereNull('expiry')->orWhere('expiry', '>', now()));
    }

    private function findActiveEvacArea(int $id): ?EvacArea
    {
        return $this->activeEvacAreaQuery()
            ->with(['social_element.user', 'gov_op.user'])
            ->select('EvacAreas.*')
            ->selectLatLng()
            ->find($id);
    }

    private function nearbyEvacAreaQuery(float $lat, float $lng): Builder
    {
        return $this->activeNonExpiredEvacAreaQuery()
            ->select([
                'id',
                'name',
                'address',
                'area_type',
                'capacity_level',
                'expiry',
                'verified_by',
            ])
            ->selectLatLng()
            ->distanceFrom($lat, $lng);
    }

    private function formatNearbyPin(EvacArea $pin): array
    {
        return [
            'id'             => $pin->id,
            'name'           => $pin->name,
            'address'        => $pin->address,
            'lat'            => $pin->lat,
            'lng'            => $pin->lng,
            'area_type'      => $pin->area_type,
            'capacity_level' => $pin->capacity_level,
            'is_verified'    => $pin->verified_by !== null,
            'distance_meters'=> round($pin->distance_meters, 2),
            'expiry'         => $pin->expiry?->toDateString(),
        ];
    }

    private function resolveNearestAreas(float $lat, float $lng, int $limit = 5)
    {
        return $this->activeNonExpiredEvacAreaQuery()
            ->select([
                'id',
                'name',
                'address',
                'capacity_level',
                'verified_by',
            ])
            ->selectLatLng()
            ->distanceFrom($lat, $lng)
            ->withinRadius(20000)
            ->limit($limit)
            ->get()
            ->map(fn ($pin) => [
                'id'              => $pin->id,
                'name'            => $pin->name,
                'address'         => $pin->address,
                'lat'             => $pin->lat,
                'lng'             => $pin->lng,
                'capacity_level'  => $pin->capacity_level,
                'is_verified'     => $pin->verified_by !== null,
                'distance_meters' => round($pin->distance_meters, 2),
            ]);
    }

    private function findActivePinOrFail(int $id, bool $withUser = false): EvacArea|JsonResponse
    {
        $query = EvacArea::whereHas('social_element', fn ($q) => $q->whereNull('deactivated_at'));
        if ($withUser) {
            $query->with(['social_element', 'social_element.user']);
        } else {
            $query->with('social_element');
        }

        $pin = $query->find($id);

        if (!$pin || $pin->social_element?->deactivated_at !== null) {
            return response()->json([
                'success' => false,
                'message' => 'Evacuation area not found or has been deactivated.',
            ], 404);
        }

        return $pin;
    }

    private function buildInsertEvacAreaParams(array $validated, SocialElement $element): array
    {
        return [
            $element->id,
            $validated['location_id'],
            "POINT({$validated['lng']} {$validated['lat']})",
            $validated['area_type'],
            $validated['address'],
            $validated['description']        ?? null,
            $validated['name'],
            $validated['capacity_level'],
            $validated['is_persistent']      ?? false,
            $validated['for_reg_flood']      ?? false,
            $validated['for_heavy_flood']    ?? false,
            $validated['has_accom']          ?? false,
            $validated['has_DRRMO']          ?? false,
            $validated['has_health']         ?? false,
            $validated['pwd_friendly']       ?? false,
            $validated['has_catchment']      ?? false,
            $validated['toilet_count']       ?? null,
            $validated['kitchen_count']      ?? null,
            $validated['child_prayer_count'] ?? null,
            $validated['breastfeed_count']   ?? null,
            $validated['other_facilities']   ?? null,
            $validated['contact_person']     ?? null,
            $validated['contact_number']     ?? null,
            $validated['expiry']             ?? null,
        ];
    }

    private function insertEvacAreaWithLocation(array $params): int
    {
        DB::statement(
            "INSERT INTO EvacAreas (
                element_id, location_id, location, area_type, address,
                description, name, capacity_level, last_updated,
                is_persistent, for_reg_flood, for_heavy_flood,
                has_accom, has_DRRMO, has_health, pwd_friendly, has_catchment,
                toilet_count, kitchen_count, child_prayer_count, breastfeed_count,
                other_facilities, contact_person, contact_number, expiry
            ) VALUES (
                ?, ?, ST_GeomFromText(?), ?, ?,
                ?, ?, ?, NOW(),
                ?, ?, ?,
                ?, ?, ?, ?, ?,
                ?, ?, ?, ?,
                ?, ?, ?, ?
            )",
            $params
        );

        return DB::getPdo()->lastInsertId();
    }

    private function updateEvacAreaLocation(int $id, array $validated): void
    {
        if (isset($validated['lat'], $validated['lng'])) {
            DB::statement(
                "UPDATE EvacAreas SET location = ST_GeomFromText(?), last_updated = NOW() WHERE id = ?",
                ["POINT({$validated['lng']} {$validated['lat']})", $id]
            );
        }
    }

    // =========================================================================
    // PUBLIC ENDPOINTS — No authentication required
    // =========================================================================

    /**
     * GET /api/pins
     *
     * Return lightweight evacuation area markers.
     */
    public function getFacilities(Request $request): JsonResponse
    {
        $pins = $this->activeEvacAreaQuery()
            ->filter($request)
            ->get([
                'id',
                'name',
                'area_type',
                'capacity_level',
                'expiry',
                'verified_by',
                DB::raw('ST_Y(location) as lat'),
                DB::raw('ST_X(location) as lng'),
            ]);

        return response()->json([
            'success' => true,
            'count'   => $pins->count(),
            'pins'    => EvacAreaMarkerResource::collection($pins),
        ]);
    }

    /**
     * GET /api/pins/{id}
     *
     * Return detailed active evacuation area data.
     */
    public function getEvacAreaDetails(int $id): JsonResponse
    {
        $pin = $this->findActiveEvacArea($id);

        if (!$pin) {
            return response()->json([
                'success' => false,
                'message' => 'Evacuation area not found or has been deactivated.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'pin'     => new EvacAreaDetailResource($pin),
        ]);
    }

    /**
     * GET /api/pins/nearby
     *
     * Return nearby active evacuation areas relative to given coordinates.
     */
    public function getNearbyEvacuationAreas(NearbyEvacAreasRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $lat    = (float) $validated['lat'];
        $lng    = (float) $validated['lng'];
        $radius = (int) ($validated['radius'] ?? self::DEFAULT_NEARBY_RADIUS_METERS);

        $pins = $this->nearbyEvacAreaQuery($lat, $lng)
            ->withinRadius($radius)
            ->get();

        return response()->json([
            'success'        => true,
            'origin'         => ['lat' => $lat, 'lng' => $lng],
            'radius_meters'  => $radius,
            'count'          => $pins->count(),
            'pins'           => $pins->map(fn ($pin) => $this->formatNearbyPin($pin)),
        ]);
    }

    /**
     * GET /api/pins/routes
     *
     * Return active flood paths and nearest shelter destinations.
     */
    public function getEvacuationRoutes(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'lat'         => 'nullable|numeric|between:-90,90',
            'lng'         => 'nullable|numeric|between:-180,180',
            'flood_level' => 'nullable|integer',
        ]);

        // ── Active flood paths ─────────────────────────────────────────────
        $pathQuery = DB::table('FloodPaths as fp')
            ->join('SocialElements as se', 'fp.element_id', '=', 'se.id')
            ->whereNull('se.deactivated_at')
            ->where('fp.expiry', '>', now())
            ->select([
                'fp.id',
                'fp.level_id',
                'fp.description',
                'fp.upvotes',
                'fp.downvotes',
                'fp.last_confirmed',
                'fp.expiry',
                DB::raw('ST_AsGeoJSON(fp.path) as path_geojson'),
            ]);

        if (!empty($validated['flood_level'])) {
            $pathQuery->where('fp.level_id', (int) $validated['flood_level']);
        }

        $paths = $pathQuery->get();

        $nearestAreas = [];
        if (isset($validated['lat'], $validated['lng'])) {
            $nearestAreas = $this->resolveNearestAreas((float) $validated['lat'], (float) $validated['lng']);
        }

        return response()->json([
            'success'         => true,
            'flood_paths'     => $paths,
            'nearest_shelters' => $nearestAreas,
        ]);
    }

    // =========================================================================
    // PROTECTED MUTATIONS — Require firebase.auth middleware
    // =========================================================================

    /**
     * POST /api/pins
     *
     * Create a new evacuation area tied to the authenticated user.
     */
    public function storeEvacuationArea(StoreEvacAreaRequest $request): JsonResponse
    {
        try {
            DB::beginTransaction();

            $user = $request->get('firebase_user');
            $validated = $request->validated();

            $element = SocialElement::create([
                'user_id'   => $user->id,
                'posted_at' => now(),
                'type_id'   => self::EVAC_AREA_TYPE_ID,
                'has_media' => false,
            ]);

            $params = $this->buildInsertEvacAreaParams($validated, $element);
            $pinId = $this->insertEvacAreaWithLocation($params);
            $pin = EvacArea::with('social_element')->find($pinId);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Evacuation area created successfully.',
                'pin'     => new EvacAreaDetailResource($pin),
            ], 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to create evacuation area.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * PUT /api/pins/{id}
     *
     * Update an existing evacuation area with RBAC enforcement.
     */
    public function updateEvacuationArea(UpdateEvacAreaRequest $request, int $id): JsonResponse
    {
        $user = $request->get('firebase_user');
        $validated = $request->validated();

        $pin = $this->findActivePinOrFail($id, withUser: true);
        if ($pin instanceof JsonResponse) {
            return $pin;
        }

        $authCheck = $this->authorizeEvacAreaModification($user, $pin);
        if ($authCheck !== null) {
            return $authCheck;
        }

        try {
            DB::beginTransaction();

            $scalarFields = collect($validated)->except(['lat', 'lng'])->toArray();
            if (!empty($scalarFields)) {
                $scalarFields['last_updated'] = now();
                $pin->fill($scalarFields)->save();
            }

            $this->updateEvacAreaLocation($id, $validated);

            DB::commit();
            $pin->refresh()->load('social_element');

            return response()->json([
                'success' => true,
                'message' => 'Evacuation area updated successfully.',
                'pin'     => new EvacAreaDetailResource($pin),
            ]);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Failed to update evacuation area.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * DELETE /api/pins/{id}
     *
     * Deactivate an evacuation area without deleting its audit record.
     */
    public function deleteEvacuationArea(Request $request, int $id): JsonResponse
    {
        $user = $request->get('firebase_user');

        $pin = $this->findActivePinOrFail($id, withUser: true);
        if ($pin instanceof JsonResponse) {
            return $pin;
        }

        $authCheck = $this->authorizeEvacAreaModification($user, $pin);
        if ($authCheck !== null) {
            return $authCheck;
        }

        try {
            $pin->social_element->update(['deactivated_at' => now()]);

            return response()->json([
                'success'        => true,
                'message'        => 'Evacuation area deactivated successfully.',
                'pin_id'         => $pin->id,
                'deactivated_at' => $pin->social_element->deactivated_at->toISOString(),
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to deactivate evacuation area.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * PATCH /api/pins/{id}/verify
     *
     * Toggle evacuation area verification for authorized users.
     */
    public function verifyEvacuationArea(EvacAreaVerifyRequest $request, int $id): JsonResponse
    {
        $user = $request->get('firebase_user');

        if (!in_array($user->role_id, [1, 2], true)) {
            return response()->json([
                'success' => false,
                'message' => 'Only administrators and barangay operators may verify evacuation areas.',
            ], 403);
        }

        $pin = $this->findActivePinOrFail($id, withUser: true);
        if ($pin instanceof JsonResponse) {
            return $pin;
        }

        $validated = $request->validated();
        $govOpId = null;

        if ($validated['verified']) {
            $govOp = $user->govOp;
            if (!$govOp) {
                return response()->json([
                    'success' => false,
                    'message' => 'No GovOp profile found for this account. '
                               . 'verified_by requires a GovOps record. '
                               . 'Please ensure this user has a linked GovOp profile.',
                ], 422);
            }
            $govOpId = $govOp->id;
        }

        try {
            $pin->update(['verified_by' => $govOpId]);

            return response()->json([
                'success'     => true,
                'message'     => $govOpId
                    ? 'Evacuation area verified successfully.'
                    : 'Verification mark removed.',
                'pin_id'      => $pin->id,
                'verified_by' => $govOpId,
            ]);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update verification status.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

}
