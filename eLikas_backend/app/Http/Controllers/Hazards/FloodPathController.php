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
     */
    public function index()
    {
        $floodPaths = FloodPath::with([
            'floodLevel:id,level_name',
            'socialElement:id,user_id,posted_at,deactivated_at',
            ])
        ->notExpired()
        ->notDeactivated()
        ->orderByDesc('last_confirmed')
        ->get();

        return response()->json([
            'count' => $floodPaths->count(),
            'flood_paths' => $floodPaths->map(fn ($fp) => [
            'id'   => $fp->id,
            'level'=> $fp->floodLevel,
            'path' => $this->formatPath($fp->path),
            'is_expired' => $fp->expiry < now(), 'is_deactivated' => 
            !is_null( $fp->socialElement->deactivated_at ),
            ]),
        ]);
    }
 
    /**
     * GET /flood-paths/my
     *
     * History list — returns the authenticated user's own flood paths
     * (including deactivated ones so they can see their full history).
     */
    public function my(Request $request)
    {
        $user = $request->attributes->get('firebase_user');
 
        $floodPaths = FloodPath::with([
            'floodLevel:id,level_name',
            'socialElement:id,user_id,posted_at,deactivated_at',
        ])
        ->ownedBy($user->id)
        ->orderByDesc('last_confirmed')
        ->notDeactivated()
        ->get();
 
        return response()->json([
            'count' => $floodPaths->count(),
            'flood_paths' => $floodPaths->map(fn($fp) => [
                'id'             => $fp->id, 
                // 'level'          => $fp->floodLevel,
                'description'    => $fp->description, 
                'last_confirmed' => $fp->last_confirmed
                    ? $fp->last_confirmed->timezone('Asia/Manila')->toDateTimeString()
                    : null,
                // 'posted_at' => $fp->socialElement->posted_at
                //     ? $fp->socialElement->posted_at->timezone('Asia/Manila')->toDateTimeString()
                //     : null,
                'is_expired' => $fp->expiry < now(),
                'is_deactivated' => !is_null(
                    $fp->socialElement->deactivated_at
                ),
                // 'posted_by' => [
                //         'id' => $fp->socialElement->user?->id,
                //         'username' => $fp->socialElement->user?->username,
                // ],
            ]),
        ], 200);
    }
 
    /**
     * GET /flood-paths/{id}
     *
     * Detail view — returns full data for a single flood path.
     */
    public function show(Request $request, int $id)
    {
        $user = $request->attributes->get('firebase_user');

        $floodPath = FloodPath::with([
            'floodLevel:id,level_name,description',
            'socialElement.user:id,username',
            'socialElement:id,user_id,posted_at,deactivated_at',
        ])->find($id);

        if (!$floodPath) {
            return response()->json([
                'message' => 'Flood path not found.',
            ], 404);
        }

        $isOwner = $floodPath->socialElement->user_id === $user->id;
        $isAdmin = in_array($user->role_id, [1, 2]);

        // IMPORTANT: only block access for public deactivated view
        if (
            $floodPath->socialElement->deactivated_at &&
            !$isOwner &&
            !$isAdmin
        ) {
            return response()->json([
                'message' => 'Flood path is deactivated.',
            ], 403);
        }

        return response()->json([
            'flood_path' => $this->formatFloodPath($floodPath),
        ]);
    }
 
    /**
     * POST /flood-paths
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'level_id'    => ['required', 'integer', 'exists:FloodLevels,id'],
            'path'        => ['required', 'array', 'min:2'],
            'path.*'      => ['required', 'array', 'size:2'],
            'path.*.0'    => ['required', 'numeric', 'between:-90,90'],    // lat
            'path.*.1'    => ['required', 'numeric', 'between:-180,180'],  // lng
            'description' => ['required', 'string', 'max:1000'],
            'expiry'      => ['required', 'date', 'after:now'],
        ]);

        // Convert Manila input -> UTC for database storage
        $validated['expiry'] = \Carbon\Carbon::parse(
            $validated['expiry'],
            'Asia/Manila'
        )->utc();
 
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
                'user_id'   => $request->attributes->get('firebase_user')->id,
                'posted_at' => now(),
                'type_id'   => $targetTable->id,
                'has_media' => false,
            ]);
 
            $floodPath = FloodPath::create([
                'element_id'     => $socialElement->id,
                'level_id'       => $validated['level_id'],
                'last_confirmed' => now(),
                'path'           => $lineString,
                'description'    => $validated['description'] ?? null,
                'upvotes'        => 0,
                'downvotes'      => 0,
                'expiry'         => $validated['expiry'],
            ]);
 
            DB::commit();
 
            return response()->json([
                'message'    => 'Flood path created successfully.',
                // 'flood_path' => $this->formatFloodPath($floodPath->load([
                //     'floodLevel:id,level_name,description',
                //     'socialElement:id,user_id,posted_at,deactivated_at',
                // ])),
            ], 201);
 
        } catch (\Throwable $e) {
            DB::rollBack();
            Log::error('FloodPath store failed: ' . $e->getMessage());
 
            return response()->json([
                'message' => 'Failed to create flood path. Please try again.',
            ], 500);
        }
    }
 
    /**
     * PATCH /flood-paths/{id}
     *
     * Updates a flood path. Only the owner can update their own path.
     */
    public function update(Request $request, int $id)
    {
        $user = $request->attributes->get('firebase_user');
 
        $floodPath = FloodPath::with('socialElement')
            ->whereHas('socialElement', fn($q) => $q
                ->where('user_id', $user->id)
                ->whereNull('deactivated_at')
            )
            ->find($id);
 
        if (!$floodPath) {
            return response()->json([
                'message' => 'Flood path not found or you do not have permission to update it.',
            ], 404);
        }
 
        $validated = $request->validate([
            'level_id'    => ['sometimes', 'integer', 'exists:FloodLevels,id'],
            'path'        => ['sometimes', 'array', 'min:2'],
            'path.*'      => ['required_with:path', 'array', 'size:2'],
            'path.*.0'    => ['required_with:path', 'numeric', 'between:-90,90'],
            'path.*.1'    => ['required_with:path', 'numeric', 'between:-180,180'],
            'description' => ['sometimes', 'nullable', 'string', 'max:1000'],
            'expiry'      => ['sometimes', 'date', 'after:now'],
        ]);

        if (isset($validated['expiry'])) {
            $validated['expiry'] = \Carbon\Carbon::parse(
                $validated['expiry'],
                'Asia/Manila'
            )->utc();
        }
 
        if (isset($validated['path'])) {
            $validated['path'] = new LineString(
                array_map(
                    fn($point) => new Point($point[0], $point[1]),
                    $validated['path']
                )
            );
        }

        $validated['last_confirmed'] = now();
 
        $floodPath->update($validated);
 
        return response()->json([
            'message'    => 'Flood path updated successfully.',
            // 'flood_path' => $this->formatFloodPath($floodPath->load([
            //     'floodLevel:id,level_name,description',
            //     'socialElement:id,user_id,posted_at,deactivated_at',
            // ])),
        ], 200);
    }
 
    /**
     * DELETE /flood-paths/{id}
     *
     * Soft deletes a flood path by setting deactivated_at on its SocialElement.
     * Only the owner can deactivate their own path.
     */
    public function destroy(Request $request, int $id)
    {
        $user = $request->attributes->get('firebase_user');
 
        $floodPath = FloodPath::with('socialElement')
            ->whereHas('socialElement', fn($q) => $q
                ->where('user_id', $user->id)
                ->whereNull('deactivated_at')
            )
            ->find($id);
 
        if (!$floodPath) {
            return response()->json([
                'message' => 'Flood path not found or you do not have permission to delete it.',
            ], 404);
        }
        
        $deactivatedAt = now();

        $floodPath->socialElement->update([
            'deactivated_at' => $deactivatedAt,
        ]);

        return response()->json([
            'message' => 'Flood path deactivated successfully.',
            'deactivated_at' => $deactivatedAt
                ->timezone('Asia/Manila')
                ->toDateTimeString(),
        ], 200);
    }
 
    // ── Private Helpers ───────────────────────────────────────────────────────
 
    /**
     * Converts a LineString to [[lat, lng], ...] arrays for the frontend.
     */
    private function formatPath(LineString $path): array
    {
        return $path->getGeometries()
            ->map(fn(Point $point) => [$point->latitude, $point->longitude])
            ->toArray();
    }
 
    /**
     * Full detail format — used by show, store, and update responses.
     */
    private function formatFloodPath(FloodPath $floodPath): array
    {
        return [
            'id'             => $floodPath->id,
            // 'element_id'     => $floodPath->element_id,
            'flood_level'    => [
                        "id" => $floodPath->floodLevel->id,
                        "level" => $floodPath->floodLevel->level_name ],
            'posted_by'      => $floodPath->socialElement->user?->username,
            'path'           => $this->formatPath($floodPath->path),
            'description'    => $floodPath->description,
            'upvotes'        => $floodPath->upvotes,
            'downvotes'      => $floodPath->downvotes,
            'last_confirmed' => $floodPath->last_confirmed
                ? $floodPath->last_confirmed->timezone('Asia/Manila')->toDateTimeString()
                : null,
            'expiry' => $floodPath->expiry
                ? $floodPath->expiry->timezone('Asia/Manila')->toDateTimeString()
                : null,
            // 'posted_at' => $floodPath->socialElement->posted_at
            //     ? $floodPath->socialElement->posted_at->timezone('Asia/Manila')->toDateTimeString()
            //     : null,
            'is_expired' => $floodPath->expiry < now(),
            'is_deactivated' => !is_null(
                $floodPath->socialElement->deactivated_at
            ),
        ];
    }
}
 
 