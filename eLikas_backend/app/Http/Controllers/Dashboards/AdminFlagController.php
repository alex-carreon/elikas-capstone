<?php

namespace App\Http\Controllers\Dashboards;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Models\EvacArea;
use App\Models\Flag;
use App\Models\FloodPath;
use App\Models\ModerationLog;
use Illuminate\Http\Request;

class AdminFlagController extends Controller
{
    /**
     * GET /admin/comments/flags?type=manual|moderation&reason_id=1
     */
    public function commentFlags(Request $request)
    {
        $type     = $request->query('type');
        $reasonId = $request->query('reason_id');

        $manualFlags = collect();
        $moderationFlags = collect();

        if (!$type || $type === 'manual') {
            $manualFlags = Flag::whereNull('is_approved')
                ->whereHas('social_element.comment')
                ->when($reasonId, fn ($q) => $q->where('reason_id', $reasonId))
                ->selectRaw('element_id, COUNT(*) as manual_count')
                ->groupBy('element_id')
                ->pluck('manual_count', 'element_id');
        }

        if (!$type || $type === 'moderation') {
            $moderationFlags = ModerationLog::whereNull('is_approved')
                ->whereHas('socialElement.comment')
                ->selectRaw('element_id, COUNT(*) as mod_count')
                ->groupBy('element_id')
                ->pluck('mod_count', 'element_id');
        }

        $allElementIds = $manualFlags->keys()
            ->merge($moderationFlags->keys())
            ->unique();

        $elements = \App\Models\SocialElement::whereIn('id', $allElementIds)
            ->with('comment')
            ->get()
            ->keyBy('id');

        $flags = $allElementIds->map(function ($elementId) use ($manualFlags, $moderationFlags, $elements) {
            $manual = $manualFlags->get($elementId, 0);
            $mod    = $moderationFlags->get($elementId, 0);

            return [
                'element_id'       => $elementId,
                'comment_id'       => $elements->get($elementId)?->comment?->id,
                'manual_count'     => $manual,
                'moderation_count' => $mod,
                'total_flag_count' => $manual + $mod,
            ];
        })
        ->sortByDesc('total_flag_count')
        ->values();

        return response()->json([
            'count' => $flags->count(),
            'flags' => $flags,
        ]);
    }
    /**
     * GET /admin/flood-paths/flags?type=manual|moderation
     */
    public function floodPathFlags(Request $request)
    {
        $type = $request->query('type', 'manual');

        if ($type === 'moderation') {
            $logs = ModerationLog::with([
                'socialElement.floodPath',
            ])
            ->whereNull('is_approved')
            ->whereHas('socialElement.floodPath')
            ->orderByDesc('created_at')
            ->get();

            return response()->json([
                'count' => $logs->count(),
                'flags' => $logs->map(fn ($log) => [
                    'moderation_id'  => $log->id,
                    'flood_path_id'  => $log->socialElement->floodPath->id,
                    'element_id'     => $log->element_id,
                    'reason'         => 'AI Moderation',
                    'flagged_at'     => $log->created_at
                        ->timezone('Asia/Manila')
                        ->toDateTimeString(),
                ]),
            ]);
        }

        $flags = Flag::with([
            'flag_reason',
            'social_element.floodPath',
        ])
        ->whereNull('is_approved')
        ->whereHas('social_element.floodPath')
        ->selectRaw('MIN(id) as id, element_id, reason_id, MIN(flagged_at) as flagged_at, COUNT(*) as flag_count')
        ->groupBy('element_id', 'reason_id')
        ->orderByDesc('flag_count')
        ->get();

        return response()->json([
            'count' => $flags->count(),
            'flags' => $flags->map(fn ($flag) => [
                'flag_id'       => $flag->id,
                'flood_path_id' => $flag->social_element->floodPath->id,
                'element_id'    => $flag->element_id,
                'reason'        => $flag->flag_reason->reason_label,
                'flag_count'    => $flag->flag_count,
                'flagged_at'    => \Carbon\Carbon::parse($flag->flagged_at)
                    ->timezone('Asia/Manila')
                    ->toDateTimeString(),
            ]),
        ]);
    }

    /**
     * GET /admin/comments/flags/{commentId}
     */
    public function commentDetail(Request $request, int $commentId)
    {
        $type = $request->query('type', 'manual');

        $comment = Comment::with([
            'element.user:id,username',
            'element.media',
        ])->find($commentId);

        if (!$comment) {
            return response()->json(['message' => 'Comment not found.'], 404);
        }

        $evacArea = EvacArea::where('element_id', $comment->parent_id)->first();

        // Reuse same comment detail format
        $detail = [
            'id'          => $comment->id,
            'element_id' => $comment->element_id, 
            'evac_area'   => [
                'id'   => $evacArea?->id,
                'name' => $evacArea?->name,
            ],
            'posted_by'   => [
                'id'       => $comment->element?->user?->id,
                'username' => $comment->element?->user?->username,
            ],
            'content'      => $comment->content,
            'upvotes'      => $comment->upvotes,
            'downvotes'    => $comment->downvotes,
            'posted_at'    => $comment->element?->posted_at
                ?->timezone('Asia/Manila')
                ->toDateTimeString(),
            'is_deactivated' => !is_null($comment->element?->deactivated_at),
            'media'        => $comment->element?->media
                ->map(fn ($m) => config('app.media_base_url') . '/' . $m->file_path)
                ->values()
                ->toArray() ?? [],
        ];

        // Append flag info
        if ($type === 'moderation') {
            $log = ModerationLog::where('element_id', $comment->element_id)
                ->whereNull('is_approved')
                ->first();

            $detail['flag_info'] = $log ? [
                'type'       => 'AI Moderation',
                'flagged_at' => $log->created_at
                    ->timezone('Asia/Manila')
                    ->toDateTimeString(),
            ] : null;

        } else {
            $flags = Flag::with('flag_reason')
                ->where('element_id', $comment->element_id)
                ->whereNull('is_approved')
                ->get();

            $detail['flag_info'] = [
                'type'       => 'Manual',
                'flag_count' => $flags->count(),
                'reasons'    => $flags
                    ->groupBy('reason_id')
                    ->map(fn ($group) => [
                        'reason'     => $group->first()->flag_reason->reason_label,
                        'flag_count' => $group->count(),
                        'first_flagged_at' => $group->min('flagged_at')
                            ?->timezone('Asia/Manila')
                            ->toDateTimeString(),
                    ])
                    ->values(),
            ];
        }

        return response()->json(['comment' => $detail]);
    }

    /**
     * GET /admin/flood-paths/flags/{floodPathId}
     */
    public function floodPathDetail(Request $request, int $floodPathId)
    {
        $type = $request->query('type', 'manual');

        $floodPath = FloodPath::with([
            'floodLevel:id,level_name,description',
            'socialElement.user:id,username',
            'socialElement:id,user_id,posted_at,deactivated_at,has_media',
            'socialElement.media',
        ])->find($floodPathId);

        if (!$floodPath) {
            return response()->json(['message' => 'Flood path not found.'], 404);
        }

        // Reuse same flood path detail format
        $detail = $this->formatFloodPath($floodPath);

        // Append flag info
        if ($type === 'moderation') {
            $log = ModerationLog::where('element_id', $floodPath->element_id)
                ->whereNull('is_approved')
                ->first();

            $detail['flag_info'] = $log ? [
                'type'       => 'AI Moderation',
                'flagged_at' => $log->created_at
                    ->timezone('Asia/Manila')
                    ->toDateTimeString(),
            ] : null;

        } else {
            $flags = Flag::with('flag_reason')
                ->where('element_id', $floodPath->element_id)
                ->whereNull('is_approved')
                ->get();

            $detail['flag_info'] = [
                'type'       => 'Manual',
                'flag_count' => $flags->count(),
                'reasons'    => $flags
                    ->groupBy('reason_id')
                    ->map(fn ($group) => [
                        'reason'           => $group->first()->flag_reason->reason_label,
                        'flag_count'       => $group->count(),
                        'first_flagged_at' => $group->min('flagged_at')
                            ?->timezone('Asia/Manila')
                            ->toDateTimeString(),
                    ])
                    ->values(),
            ];
        }

        return response()->json(['flood_path' => $detail]);
    }

    private function getAdmin(int $userId): ?\App\Models\Admin
    {
        return \App\Models\Admin::where('user_id', $userId)->first();
    }

    /**
     * PATCH /admin/flags/{elementId}/approve
     * Content is clean — clear all flags for this element
     */
    public function approve(Request $request, int $elementId)
    {
        $user  = $request->attributes->get('firebase_user');
        $admin = $this->getAdmin($user->id);

        if (!$admin) {
            return response()->json(['message' => 'Admin record not found.'], 403);
        }

        $this->resolveFlags($elementId, true, $admin->id);

        return response()->json([
            'message' => 'Content approved and flags cleared.',
        ]);
    }


    /**
     * PATCH /admin/flags/{elementId}/reject
     * Content is bad — deactivate and clear all flags
     */
    public function reject(Request $request, int $elementId)
    {
        $user  = $request->attributes->get('firebase_user');
        $admin = $this->getAdmin($user->id);

        if (!$admin) {
            return response()->json(['message' => 'Admin record not found.'], 403);
        }

        \App\Models\SocialElement::where('id', $elementId)
            ->update(['deactivated_at' => now()]);

        $this->resolveFlags($elementId, false, $admin->id);

        return response()->json([
            'message' => 'Content rejected and deactivated.',
        ]);
    }

    // ── Private Helpers ───────────────────────────────────────────────────────

    private function resolveFlags(int $elementId, bool $isApproved, int $adminId): void
    {
        $reviewedAt = now();

        // Resolve manual flags
        Flag::where('element_id', $elementId)
            ->whereNull('is_approved')
            ->update([
                'is_approved' => $isApproved,
                'reviewed_by' => $adminId,
                'reviewed_at' => $reviewedAt,
            ]);

        // Resolve AI moderation logs
        ModerationLog::where('element_id', $elementId)
            ->whereNull('is_approved')
            ->update([
                'is_approved' => $isApproved,
                'reviewed_by' => $adminId,
                'reviewed_at' => $reviewedAt,
            ]);
    }

    private function formatFloodPath(FloodPath $floodPath): array
    {
        return [
            'id'          => $floodPath->id,
            'element_id' => $floodPath->element_id,
            'flood_level' => [
                'id'         => $floodPath->floodLevel->id,
                'level_name' => $floodPath->floodLevel->level_name,
            ],
            'posted_by'   => [
                'id'       => $floodPath->socialElement->user?->id,
                'username' => $floodPath->socialElement->user?->username,
            ],
            'path'           => $floodPath->path->getGeometries()
                ->map(fn ($p) => [$p->latitude, $p->longitude])
                ->toArray(),
            'description'    => $floodPath->description,
            'upvotes'        => $floodPath->upvotes,
            'downvotes'      => $floodPath->downvotes,
            'last_confirmed' => $floodPath->last_confirmed
                ?->timezone('Asia/Manila')
                ->toDateTimeString(),
            'expiry'         => $floodPath->expiry
                ?->timezone('Asia/Manila')
                ->toDateTimeString(),
            'is_expired'     => $floodPath->expiry < now(),
            'is_deactivated' => !is_null($floodPath->socialElement->deactivated_at),
            'media'          => $floodPath->socialElement->media
                ->map(fn ($m) => config('app.media_base_url') . '/' . $m->file_path)
                ->values()
                ->toArray(),
        ];
    }
}