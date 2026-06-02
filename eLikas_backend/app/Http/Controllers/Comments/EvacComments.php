<?php

namespace App\Http\Controllers\Comments;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Models\EvacArea;
use App\Models\MediaFile;
use App\Models\SocialElement;
use App\Models\TargetTable;
use App\Services\MediaUploadService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use App\Enums\MediaCollection;

class EvacComments extends Controller
{
    public function __construct(protected MediaUploadService $mediaUploadService) {}

    /**
     * GET /evac-areas/{evacAreaId}/comments
     */
    public function index(Request $request, int $evacAreaId)
    {
        $evacArea = EvacArea::find($evacAreaId);

        if (!$evacArea) {
            return response()->json([
                'message' => 'Evacuation area not found.',
            ], 404);
        }

        $comments = Comment::with([
                'element.user:id,username',
                'element.media',
            ])
            ->whereHas('element', function ($q) {
                $q->whereNull('deactivated_at');
            })
            ->where('parent_id', $evacArea->element_id)
            ->orderByDesc('id')
            ->get();

        return response()->json([
            'count' => $comments->count(),

            'comments' => $comments->map(function ($comment) {
                return [
                    'id' => $comment->id,
                    'content' => $comment->content,

                    'posted_by' => [
                        'id' => $comment->element?->user?->id,
                        'username' => $comment->element?->user?->username,
                    ],

                    'posted_at' => $comment->element?->posted_at
                        ? $comment->element->posted_at
                            ->timezone('Asia/Manila')
                            ->toDateTimeString()
                        : null,

                    'has_media' => $comment->element?->has_media,

                    'media' => $comment->element?->media
                        ->map(fn ($m) =>
                            config('app.media_base_url') . '/' . $m->file_path
                        )
                        ->values()
                        ->toArray(),

                    'deactivated_at' => $comment->element?->deactivated_at
                        ?->timezone('Asia/Manila')
                        ?->toDateTimeString(),
                ];
            }),
        ]);
    }

    /**
     * POST /evac-areas/{evacAreaId}/comments
     */
    public function store(Request $request, int $evacAreaId)
    {
        $user = $request->attributes->get('firebase_user');

        $validated = $request->validate([
            'content' => ['nullable', 'string', 'max:1000'],
            'file' => [
                'nullable',
                'file',
                'image',
                'mimes:jpg,jpeg,png,heic',
                'max:8192',
            ],
        ]);

        // Must have content or media
        if (
            empty(trim($validated['content'] ?? '')) &&
            !$request->hasFile('file')
        ) {
            return response()->json([
                'message' => 'Comment must contain text or media.',
            ], 422);
        }

        $evacArea = EvacArea::with('social_element')->find($evacAreaId);

        if (!$evacArea) {
            return response()->json([
                'message' => 'Evacuation area not found.',
            ], 404);
        }

        $targetTable = TargetTable::where('table_name', 'Comments')->first();

        if (!$targetTable) {
            return response()->json([
                'message' => 'Server misconfiguration: Comments target table not found.',
            ], 500);
        }

        // ── File upload FIRST (like FloodPath pattern)
        $uploadedPath = null;

        if ($request->hasFile('file')) {
            $uploadedPath = $this->mediaUploadService->upload(
                $request->file('file'),
                MediaCollection::Comments
            );
        }

        DB::beginTransaction();

        try {
            // ── 1. Create SocialElement (comment container)
            $socialElement = SocialElement::create([
                'user_id' => $user->id,
                'posted_at' => now(),
                'type_id' => $targetTable->id,
                'has_media' => !is_null($uploadedPath),
            ]);

            // ── 2. Create Comment record
            $comment = Comment::create([
                'element_id' => $socialElement->id,
                'parent_id' => $evacArea->element_id,
                'content' => $validated['content'] ?? null,
                'upvotes' => 0,
                'downvotes' => 0,
            ]);

            // ── 3. Store media if exists
            if ($uploadedPath) {
                MediaFile::create([
                    'parent_id' => $socialElement->id,
                    'user_id' => $user->id,
                    'file_path' => $uploadedPath,
                    'file_type' => 'jpg',
                    'uploaded_at' => now(),
                ]);
            }

            DB::commit();

            return response()->json([
                'message' => 'Comment created successfully.',
                'comment_id' => $comment->id,
                'element_id' => $socialElement->id,
            ], 201);

        } catch (\Throwable $e) {
            DB::rollBack();

            Log::error('EvacComments store failed: ' . $e->getMessage());

            if ($uploadedPath) {
                Storage::disk('sftp')->delete($uploadedPath);
            }

            return response()->json([
                'message' => 'Failed to create comment.',
            ], 500);
        }
    }
}