<?php

namespace App\Http\Controllers\Comments;

use App\Enums\MediaCollection;
use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Models\EvacArea;
use App\Models\Flag;
use App\Models\FlagReason;
use App\Models\MediaFile;
use App\Models\ModerationLog;
use App\Models\SocialElement;
use App\Models\TargetTable;
use App\Models\Vote;
use App\Services\MediaUploadService;
use App\Services\ModerationService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class EvacComments extends Controller
{
    public function __construct(
        protected MediaUploadService $mediaUploadService,
        protected ModerationService $moderationService
        ) {}
    

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

        $user = $request->attributes->get('firebase_user');

        $votes = collect();

        if ($user) {
            $votes = Vote::where('user_id', $user->id)
                 ->whereIn('element_id', $comments->pluck('element_id'))
                ->pluck('vote', 'element_id');
        }

        return response()->json([
            'count' => $comments->count(),
            
            'comments' => $comments->map(function ($comment) use ($votes){
                return [
                    'id' => $comment->id,
                    'content' => $comment->content,

                    'upvotes' => $comment->upvotes,
                    'downvotes' => $comment->downvotes,
                    'user_vote' => $votes->get($comment->element_id),

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

            // ── Moderation (outside transaction — comment is already saved)
            $moderationResult = $this->moderateComment($socialElement->id, $user->id, $validated['content'] ?? null);

            return response()->json([
                'message'    => 'Comment created successfully.',
                'comment_id' => $comment->id,
                'element_id' => $socialElement->id,
                'moderation' => $moderationResult, 
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

   
    private function moderateComment(int $elementId, int $userId, ?string $content): array
    {
        if (empty(trim($content ?? ''))) {
            return ['skipped' => true, 'reason' => 'No text content'];
        }

        try {
            $result = $this->moderationService->moderate($content);

            if (!($result['flagged'] ?? false)) {
                return [
                    'flagged' => false,
                    'raw' => $result,
                ];
            }

            ModerationLog::create([
                'element_id'  => $elementId,
                'created_at'  => now(),
                'is_approved' => null,
            ]);

            $reason = FlagReason::where('reason_label', 'AI Moderation')->first()
                ?? FlagReason::first();

            $flagCreated = false;

            if ($reason) {
                Flag::create([
                    'user_id'     => $userId,
                    'element_id'  => $elementId,
                    'reason_id'   => $reason->id,
                    'flagged_at'  => now(),
                    'is_approved' => null,
                ]);
                $flagCreated = true;
            }

            return [
                'flagged'      => true,
                'flag_created' => $flagCreated,
                'reason_found' => $reason?->reason_label,
                'raw'          => $result,
            ];

        } catch (\Throwable $e) {
            Log::warning('Moderation check failed for element ' . $elementId . ': ' . $e->getMessage());

            return [
                'flagged' => false,
                'error'   => $e->getMessage(),
            ];
        }
    }
}

