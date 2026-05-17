<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;
use App\Models\EvacArea;
use App\Models\SocialElement;
use App\Models\TargetTable;
use App\Models\Location;
use App\Models\EvacType;
use App\Models\CapacityLevel;

class PinController extends Controller
{
    // Private helpers

    // Build full pin response from model.
    private function formatPin(EvacArea $pin): array
    {
        return [
            'id'          => $pin->id,
            'name'        => $pin->name,
            'lat'         => $pin->lat !== null ? (float) $pin->lat : null,
            'lng'         => $pin->lng !== null ? (float) $pin->lng : null,
            'address'     => $pin->address,
            'description' => $pin->description,
            'area_type'      => $pin->evac_type?->evac_type,
            'capacity_level' => $pin->capacity_level_info?->capacity_level,
            'location'       => $pin->location_info?->name,
            'verified_by'       => $pin->gov_op?->point_person,
            'verified_position' => $pin->gov_op?->point_position,
            'for_reg_flood'   => (bool) $pin->for_reg_flood,
            'for_heavy_flood' => (bool) $pin->for_heavy_flood,
            'facilities' => [
                'has_accommodation' => (bool) $pin->has_accom,
                'has_DRRMO'         => (bool) $pin->has_DRRMO,
                'has_health'        => (bool) $pin->has_health,
                'pwd_friendly'      => (bool) $pin->pwd_friendly,
                'has_catchment'     => (bool) $pin->has_catchment,
            ],
            'toilet_count'       => $pin->toilet_count,
            'kitchen_count'      => $pin->kitchen_count,
            'child_prayer_count' => $pin->child_prayer_count,
            'breastfeed_count'   => $pin->breastfeed_count,
            'other_facilities'   => $pin->other_facilities,
            'contact_person' => $pin->contact_person,
            'contact_number' => $pin->contact_number,
            'is_persistent' => (bool) $pin->is_persistent,
            'last_updated'  => $pin->last_updated,
            'expiry'        => $pin->expiry,
            'posted_at'     => $pin->social_element?->posted_at,
        ];
    }

    private function pinRules(): array
    {
        return [
            'name'           => 'required|string|max:255',
            'address'        => 'required|string|max:255',
            'lat'            => 'required|numeric|between:-90,90',
            'lng'            => 'required|numeric|between:-180,180',
            'location_id'    => 'required|integer|exists:Locations,id',
            'area_type'      => 'required|integer|exists:EvacTypes,id',
            'capacity_level' => 'required|integer|exists:CapacityLevels,id',
            'description'        => 'nullable|string',
            'other_facilities'   => 'nullable|string',
            'contact_person'     => 'nullable|string|max:255',
            'contact_number'     => 'nullable|string|max:20',
            'expiry'             => 'nullable|date|after:today',
            'is_persistent'      => 'nullable|boolean',
            'for_reg_flood'      => 'nullable|boolean',
            'for_heavy_flood'    => 'nullable|boolean',
            'has_accom'          => 'nullable|boolean',
            'has_DRRMO'          => 'nullable|boolean',
            'has_health'         => 'nullable|boolean',
            'pwd_friendly'       => 'nullable|boolean',
            'has_catchment'      => 'nullable|boolean',
            'toilet_count'       => 'nullable|integer|min:0',
            'kitchen_count'      => 'nullable|integer|min:0',
            'child_prayer_count' => 'nullable|integer|min:0',
            'breastfeed_count'   => 'nullable|integer|min:0',
        ];
    }

    private function baseQuery()
    {
        return EvacArea::with([
            'social_element',
            'evac_type',
            'capacity_level_info',
            'location_info',
            'gov_op',
        ])
        ->select('*', DB::raw('ST_Y(location) AS lat'), DB::raw('ST_X(location) AS lng'))
        ->whereHas('social_element', function ($query) {
            $query->whereNull('deactivated_at');
        });
    }

    private function createSocialElement(int $typeId): SocialElement
    {
        return SocialElement::create([
            'user_id'   => null,
            'posted_at' => now(),
            'type_id'   => $typeId,
            'has_media' => false,
        ]);
    }

    private function boolToInt($value): int
    {
        return filter_var($value, FILTER_VALIDATE_BOOLEAN) ? 1 : 0;
    }

    private function buildPoint(float $lng, float $lat): string
    {
        return "POINT({$lng} {$lat})";
    }

    private function insertEvacArea(array $data, int $elementId): int
    {
        DB::statement('
            INSERT INTO EvacAreas (
                element_id, location_id, area_type, capacity_level,
                name, address, description, other_facilities,
                contact_person, contact_number, expiry, last_updated,
                is_persistent, for_reg_flood, for_heavy_flood,
                has_accom, has_DRRMO, has_health, pwd_friendly, has_catchment,
                toilet_count, kitchen_count, child_prayer_count, breastfeed_count,
                location
            ) VALUES (
                ?, ?, ?, ?,
                ?, ?, ?, ?,
                ?, ?, ?, ?,
                ?, ?, ?,
                ?, ?, ?, ?, ?,
                ?, ?, ?, ?,
                ST_GeomFromText(?)
            )
        ', [
            $elementId,
            $data['location_id'],
            $data['area_type'],
            $data['capacity_level'],
            $data['name'],
            $data['address'],
            $data['description'] ?? null,
            $data['other_facilities'] ?? null,
            $data['contact_person'] ?? null,
            $data['contact_number'] ?? null,
            $data['expiry'] ?? null,
            now(),
            $this->boolToInt($data['is_persistent'] ?? false),
            $this->boolToInt($data['for_reg_flood'] ?? false),
            $this->boolToInt($data['for_heavy_flood'] ?? false),
            $this->boolToInt($data['has_accom'] ?? false),
            $this->boolToInt($data['has_DRRMO'] ?? false),
            $this->boolToInt($data['has_health'] ?? false),
            $this->boolToInt($data['pwd_friendly'] ?? false),
            $this->boolToInt($data['has_catchment'] ?? false),
            $data['toilet_count'] ?? null,
            $data['kitchen_count'] ?? null,
            $data['child_prayer_count'] ?? null,
            $data['breastfeed_count'] ?? null,
            $this->buildPoint((float) $data['lng'], (float) $data['lat']),
        ]);

        return (int) DB::getPdo()->lastInsertId();
    }

    // Pin endpoints

    // GET /api/pins — return all active pins
    public function index()
    {
        $pins = $this->baseQuery()->get()->map(fn ($pin) => $this->formatPin($pin));

        return response()->json([
            'success' => true,
            'count'   => $pins->count(),
            'pins'    => $pins,
        ]);
    }

    // GET /api/pins/{id} — return active pin by ID
    public function show($id)
    {
        $pin = $this->baseQuery()->find($id);

        if (!$pin) {
            return response()->json([
                'success' => false,
                'message' => 'Pin not found or has been deactivated.',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'pin'     => $this->formatPin($pin),
        ]);
    }

    // POST /api/pins — create a pin
    public function store(Request $request)
    {
        try {
            $data = $request->validate($this->pinRules());
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors'  => $e->errors(),
            ], 422);
        }

        $targetTable = TargetTable::where('table_name', 'EvacAreas')->first();

        if (!$targetTable) {
            return response()->json([
                'success' => false,
                'message' => 'Server misconfiguration: EvacAreas missing from TargetTables.',
                'fix'     => 'Run: INSERT INTO TargetTables (table_name) VALUES ("EvacAreas");',
            ], 500);
        }

        try {
            DB::beginTransaction();

            $element = $this->createSocialElement($targetTable->id);
            $pinId   = $this->insertEvacArea($data, $element->id);

            DB::commit();

            $saved = $this->baseQuery()->find($pinId);

            return response()->json([
                'success' => true,
                'message' => 'Pin created successfully.',
                'pin'     => $this->formatPin($saved),
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'success' => false,
                'message' => 'Failed to create pin.',
                'error'   => $e->getMessage(),
            ], 500);
        }
    }

    // Location endpoints

    // GET /api/pins/locations — return all locations
    public function getLocations()
    {
        $locations = Location::with(['locationLevel', 'parentLocation'])
            ->get()
            ->map(function ($loc) {
                return [
                    'id'        => $loc->id,
                    'name'      => $loc->name,
                    'level_id'  => $loc->level_id,
                    'level'     => $loc->locationLevel?->level_name,
                    'parent_id' => $loc->parent_id,
                    'parent'    => $loc->parentLocation?->name,
                ];
            });

        return response()->json([
            'success'   => true,
            'count'     => $locations->count(),
            'locations' => $locations,
        ]);
    }

    // POST /api/pins/locations — create location
    public function storeLocation(Request $request)
    {
        try {
            $request->validate([
                'name'      => 'required|string|max:255',
                'level_id'  => 'required|integer|exists:LocationLevels,id',
                'parent_id' => 'nullable|integer|exists:Locations,id',
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors'  => $e->errors(),
            ], 422);
        }

        $location = Location::create([
            'name'      => $request->name,
            'level_id'  => $request->level_id,
            'parent_id' => $request->parent_id,
        ]);

        $location->load(['locationLevel', 'parentLocation']);

        return response()->json([
            'success'  => true,
            'message'  => 'Location created successfully.',
            'location' => [
                'id'        => $location->id,
                'name'      => $location->name,
                'level_id'  => $location->level_id,
                'level'     => $location->locationLevel?->level_name,
                'parent_id' => $location->parent_id,
                'parent'    => $location->parentLocation?->name,
            ],
        ], 201);
    }

    // Evac type endpoints

    // GET /api/pins/evac-types — return evac types
    public function getEvacTypes()
    {
        $types = EvacType::all()->map(function ($type) {
            return [
                'id'        => $type->id,
                'evac_type' => $type->evac_type,
            ];
        });

        return response()->json([
            'success' => true,
            'count'   => $types->count(),
            'types'   => $types,
        ]);
    }

    // POST /api/pins/evac-types — create evac type
    public function storeEvacType(Request $request)
    {
        try {
            $request->validate([
                'evac_type' => 'required|string|max:255|unique:EvacTypes,evac_type',
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors'  => $e->errors(),
            ], 422);
        }

        $type = EvacType::create(['evac_type' => $request->evac_type]);

        return response()->json([
            'success' => true,
            'message' => 'Evac type created successfully.',
            'type'    => [
                'id'        => $type->id,
                'evac_type' => $type->evac_type,
            ],
        ], 201);
    }

    // Capacity level endpoints

    // GET /api/pins/capacity-levels — return capacity levels
    public function getCapacityLevels()
    {
        $levels = CapacityLevel::all()->map(function ($level) {
            return [
                'id'             => $level->id,
                'capacity_level' => $level->capacity_level,
            ];
        });

        return response()->json([
            'success' => true,
            'count'   => $levels->count(),
            'levels'  => $levels,
        ]);
    }

    // POST /api/pins/capacity-levels — create capacity level
    public function storeCapacityLevel(Request $request)
    {
        try {
            $request->validate([
                'capacity_level' => 'required|string|max:255|unique:CapacityLevels,capacity_level',
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed.',
                'errors'  => $e->errors(),
            ], 422);
        }

        $level = CapacityLevel::create(['capacity_level' => $request->capacity_level]);

        return response()->json([
            'success' => true,
            'message' => 'Capacity level created successfully.',
            'level'   => [
                'id'             => $level->id,
                'capacity_level' => $level->capacity_level,
            ],
        ], 201);
    }
}
