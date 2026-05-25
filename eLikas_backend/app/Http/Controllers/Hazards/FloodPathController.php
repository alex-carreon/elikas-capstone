<?php

namespace App\Http\Controllers\Hazards;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\FloodPath;
use App\Models\SocialElement;
use App\Models\TargetTable;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use MatanYadaev\EloquentSpatial\Objects\LineString;
use MatanYadaev\EloquentSpatial\Objects\Point;


class FloodPathController extends Controller
{
    /**
     * GET /flood-paths
     *
     * Returns all active (non-expired, non-deactivated) flood paths.
     */
    public function index(Request $request)
    {
        $request->validate([
            'level_id' => ['sometimes', 'integer', 'exists:FloodLevels,id'],
        ]);
 
        $query = FloodPath::with([
                'floodLevel:id,level_name,description',
                'socialElement:id,user_id,posted_at',
            ])
            ->whereHas('socialElement', fn($q) => $q->whereNull('deactivated_at'))
            ->where('expiry', '>', now());
 
        if ($request->filled('level_id')) {
            $query->where('level_id', $request->level_id);
        }
 
        $floodPaths = $query->orderByDesc('last_confirmed')->get();
 
        return response()->json([
            'flood_paths' => $floodPaths->map(fn($fp) => $this->formatFloodPath($fp)),
        ], 200);
    }
 
    /**
     * GET /flood-paths/{id}
     */
    public function show(int $id)
    {
        $floodPath = FloodPath::with([
                'floodLevel:id,level_name,description',
                'socialElement:id,user_id,posted_at',
            ])
            ->whereHas('socialElement', fn($q) => $q->whereNull('deactivated_at'))
            ->find($id);
 
        if (!$floodPath) {
            return response()->json([
                'message' => 'Flood path not found.',
            ], 404);
        }
 
        return response()->json([
            'flood_path' => $this->formatFloodPath($floodPath),
        ], 200);
    }
 
    /**
     * POST /flood-paths
     *
     * Creates a SocialElement record first, then the associated FloodPath.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'level_id'    => ['required', 'integer', 'exists:FloodLevels,id'],
            'path'        => ['required', 'array', 'min:2'],
            'path.*'      => ['required', 'array', 'size:2'],
            'path.*.0'    => ['required', 'numeric', 'between:-90,90'],    // lat
            'path.*.1'    => ['required', 'numeric', 'between:-180,180'],  // lng
            'description' => ['nullable', 'string', 'max:1000'],
            'expiry'      => ['required', 'date', 'after:now'],
        ]);
 
        $targetTable = TargetTable::where('table_name', 'FloodPaths')->first();
 
        if (!$targetTable) {
            return response()->json([
                'message' => 'Server misconfiguration: FloodPaths target table not found.',
            ], 500);
        }
 
        $lineString = new LineString(
            array_map(
                fn($point) => new Point($point[0], $point[1]),
                $validated['path']
            )
        );
 
        DB::beginTransaction();
 
        try {
            $socialElement = SocialElement::create([
                'user_id' => $request->attributes->get('firebase_user')->id,
                'posted_at' => now(),
                'type_id'   => $targetTable->id,
                'has_media' => false,
            ]);
 
            $floodPath = FloodPath::create([
                'element_id'     => $socialElement->id,
                'level_id'       => $validated['level_id'],
                // 'last_confirmed' => now(),
                'path'           => $lineString,
                'description'    => $validated['description'] ?? null,
                // 'upvotes'        => 0,
                // 'downvotes'      => 0,
                'expiry'         => $validated['expiry'],
            ]);
 
            DB::commit();
 
            return response()->json([
                'message'    => 'Flood path created successfully.',
                'flood_path' => $this->formatFloodPath($floodPath->load([
                    'floodLevel:id,level_name,description',
                    'socialElement:id,user_id,posted_at',
                ])),
            ], 201);
 
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('FloodPath store failed: ' . $e->getMessage());
 
            return response()->json([
                'message' => $e->getMessage(),
            ], 500);
        }
    }
 
    /**
     * Formats a FloodPath for JSON responses.
     * The library exposes the LineString as an iterable of Points,
     * so we map each Point back to [lat, lng] for the frontend.
     */
    private function formatFloodPath(FloodPath $floodPath): array
    {
        return [
            'id'             => $floodPath->id,
            'element_id'     => $floodPath->element_id,
            'level'          => $floodPath->floodLevel,
            'path'           => array_map(
                fn(Point $point) => [$point->latitude, $point->longitude],
                iterator_to_array($floodPath->path->getGeometries())
            ),
            'description'    => $floodPath->description,
            'upvotes'        => $floodPath->upvotes,
            'downvotes'      => $floodPath->downvotes,
            'last_confirmed' => $floodPath->last_confirmed,
            'expiry'         => $floodPath->expiry,
            'posted_at'      => $floodPath->socialElement->posted_at,
        ];
    }
}
 