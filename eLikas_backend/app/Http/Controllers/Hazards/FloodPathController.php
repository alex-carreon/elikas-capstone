<?php

namespace App\Http\Controllers\Hazards;

use App\Enums\MediaCollection;
use App\Http\Controllers\Controller;
use App\Models\FloodLevel;
use App\Models\FloodPath;
use App\Models\MediaFile;
use App\Models\SocialElement;
use App\Models\TargetTable;
use App\Models\Vote;
use App\Services\MediaUploadService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use MatanYadaev\EloquentSpatial\Objects\LineString;
use MatanYadaev\EloquentSpatial\Objects\Point;

class FloodPathController extends Controller
{
    public function __construct(protected MediaUploadService $mediaUploadService) {}
    
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

        $floodLevelId = $request->query('flood_level_id');

        $query = FloodPath::with([
            'floodLevel:id,level_name',
            'socialElement:id,user_id,posted_at,deactivated_at',
        ])
        ->ownedBy($user->id)
        ->notDeactivated();

        if (!is_null($floodLevelId)) {
            $query->where('level_id', $floodLevelId);
        }

        $floodPaths = $query
            ->orderByDesc('last_confirmed')
            ->get();

        return response()->json([
            'count' => $floodPaths->count(),
            'flood_paths' => $floodPaths->map(fn($fp) => [
                'id'             => $fp->id,
                'level'          => $fp->floodLevel->level_name,
                'description'    => $fp->description,
                'last_confirmed' => $fp->last_confirmed
                    ? $fp->last_confirmed
                        ->timezone('Asia/Manila')
                        ->toDateTimeString()
                    : null,
                'is_expired' => $fp->expiry < now(),
                'is_deactivated' => !is_null(
                    $fp->socialElement->deactivated_at
                ),
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
            'socialElement:id,user_id,posted_at,deactivated_at,has_media',
            'socialElement.media'
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

        $userVote = Vote::where('user_id', $user->id)
            ->where('element_id', $floodPath->element_id)
            ->value('vote');

        return response()->json([
            'flood_path' => $this->formatFloodPath($floodPath),
            'user_vote' => $userVote,

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
            'file'        => ['nullable', 'file', 'image', 'mimes:jpg,jpeg,png,heic', 'max:8192'],
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

        $uploadedPath = null;

        if ($request->hasFile('file')) {
            $uploadedPath = $this->mediaUploadService->upload(
                $request->file('file'),
                MediaCollection::FloodReports
            );
        }
 
        DB::beginTransaction();
 
        try {
            $socialElement = SocialElement::create([
                'user_id'   => $request->attributes->get('firebase_user')->id,
                'posted_at' => now(),
                'type_id'   => $targetTable->id,
                'has_media' => !is_null($uploadedPath), // UPDATED
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

            if ($uploadedPath) {
            MediaFile::create([
                'parent_id'   => $socialElement->id,
                'user_id'     => $request->attributes->get('firebase_user')->id,
                'file_path'   => $uploadedPath,
                'file_type'   => 'jpg',
                'uploaded_at' => now(),
            ]);
        }
 
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

            if ($uploadedPath) {
                Storage::disk('sftp')->delete($uploadedPath);
            }
 
            return response()->json([
                'message' => 'Failed to create flood path. Please try again.',
            ], 500);
        }
    }
 
    /**
     * PATCH /flood-paths/{id}
     */
    public function update(Request $request, int $id)
    {
        $user = $request->attributes->get('firebase_user');

        $query = FloodPath::with('socialElement')
            ->whereHas('socialElement', fn($q) =>
                $q->whereNull('deactivated_at')
            );

   
        // Only apply ownership filtering to normal individual users.
        //
        // Admins/GovOps can edit any flood path.
        if ($user->role_id == 3) {

            $query->whereHas('socialElement', fn($q) =>
                $q->where('user_id', $user->id)
            );
        }

        $floodPath = $query->find($id);

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
            'message' => 'Flood path updated successfully.',

            'updated_by' => [
                'id' => $user->id,
                'role_id' => $user->role_id,
            ],
        ], 200);
    }

    /**
     * DELETE /flood-paths/{id}
     */
    public function destroy(Request $request, int $id)
    {
        $user = $request->attributes->get('firebase_user');

        $query = FloodPath::with('socialElement')
            ->whereHas('socialElement', fn($q) =>
                $q->whereNull('deactivated_at')
            );

        // Only apply ownership restriction to normal users.
        if ($user->role_id == 3) {

            $query->whereHas('socialElement', fn($q) =>
                $q->where('user_id', $user->id)
            );
        }

        $floodPath = $query->find($id);

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

            // helpful for admin audit logs
            'deactivated_by' => [
                'id' => $user->id,
                'role_id' => $user->role_id,
            ],
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
            'flood_levels'    => [
                        "id" => $floodPath->floodLevel->id,
                        "level_name" => $floodPath->floodLevel->level_name ],
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
            'media' => $floodPath->socialElement?->media
                ->map(fn ($m) => config('app.media_base_url') . '/' . $m->file_path)
                ->values()
                ->toArray() ?? [],
        ];
    }
}
 
 