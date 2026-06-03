<?php

namespace App\Http\Controllers\Dashboards;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Models\EvacArea;
use Illuminate\Http\Request;

class CommentsAdminController extends Controller
{

    /**
     * GET /admin/evac-areas/{evacAreaId}/comments
     *
     * Returns all comments for an evacuation area,
     * including deactivated comments.
     */
    public function index(int $evacAreaId)
    {
        $evacArea = EvacArea::with('social_element')
            ->find($evacAreaId);

        if (!$evacArea) {
            return response()->json([
                'message' => 'Evacuation area not found.',
            ], 404);
        }

        $comments = Comment::with([
            'element.user:id,username',
            'element.media',
        ])
        ->where('parent_id', $evacArea->element_id)
        ->orderByDesc('id')
        ->get();

        return response()->json([
            'count' => $comments->count(),

            'comments' => $comments->map(function ($comment) {

                return [
                    'id' => $comment->id,

                    'content' => $comment->content,

                    'commented_by' => [
                        'id' => $comment->element?->user?->id,
                        'username' => $comment->element?->user?->username,
                    ],

                    'posted_at' => $comment->element?->posted_at
                        ? $comment->element->posted_at
                            ->timezone('Asia/Manila')
                            ->toDateTimeString()
                        : null,

                    'is_deactivated' =>
                        !is_null($comment->element?->deactivated_at),

                    'media' => $comment->element?->media
                        ->map(fn ($m) =>
                            config('app.media_base_url') . '/' . $m->file_path
                        )
                        ->values()
                        ->toArray() ?? [],
                ];
            }),
        ]);
    }

    /**
     * GET /admin/comments/{id}
     *
     * Returns full comment details.
     */
    public function show(int $id)
    {
        $comment = Comment::with([
            'element.user:id,username',
            'element.media',
            'socialElement.evacArea',
        ])->find($id);

        if (!$comment) {
            return response()->json([
                'message' => 'Comment not found.',
            ], 404);
        }

        $evacArea = EvacArea::where(
            'element_id',
            $comment->parent_id
        )->first();

        return response()->json([
            'comment' => [

                'id' => $comment->id,

                'evac_area' => [
                    'id' => $evacArea?->id,
                    'name' => $evacArea?->name,
                ],

                'posted_by' => [
                    'id' => $comment->element?->user?->id,
                    'username' => $comment->element?->user?->username,
                ],

                'content' => $comment->content,

                'upvotes' => $comment->upvotes,

                'downvotes' => $comment->downvotes,

                'posted_at' => $comment->element?->posted_at
                    ? $comment->element->posted_at
                        ->timezone('Asia/Manila')
                        ->toDateTimeString()
                    : null,

                'is_deactivated' =>
                    !is_null($comment->element?->deactivated_at),

                'media' => $comment->element?->media
                    ->map(fn ($m) =>
                        config('app.media_base_url') . '/' . $m->file_path
                    )
                    ->values()
                    ->toArray() ?? [],
            ]
        ]);
    }
    /**
     * PATCH /admin/comments/{id}
     */
    public function update(Request $request, int $id)
    {
        $comment = Comment::with('element')->find($id);

        if (
            !$comment ||
            !$comment->element ||
            $comment->element->deactivated_at
        ) {
            return response()->json([
                'message' => 'Comment not found.',
            ], 404);
        }

        $validated = $request->validate([
            'content' => ['required', 'string', 'max:1000'],
        ]);

        $comment->update([
            'content' => $validated['content'],
        ]);

        return response()->json([
            'message' => 'Comment updated successfully.',
            'comment_id' => $comment->id,
        ], 200);
    }

    /**
     * PATCH /admin/comments/{id}/deactivate
     * Deactivates the SocialElement instead of deleting rows.
     */
    public function deactivate(Request $request, int $id)
    {
        $user = $request->attributes->get('firebase_user');

        $comment = Comment::with('element')->find($id);

        if (
            !$comment ||
            !$comment->element ||
            $comment->element->deactivated_at
        ) {
            return response()->json([
                'message' => 'Comment not found.',
            ], 404);
        }

        $deactivatedAt = now();

        $comment->element->update([
            'deactivated_at' => $deactivatedAt,
        ]);

        return response()->json([
            'message' => 'Comment deactivated successfully.',

            'deactivated_at' => $deactivatedAt
                ->timezone('Asia/Manila')
                ->toDateTimeString(),

            'deactivated_by' => [
                'id' => $user->id,
                'role_id' => $user->role_id,
            ],
        ], 200);
    }
}
