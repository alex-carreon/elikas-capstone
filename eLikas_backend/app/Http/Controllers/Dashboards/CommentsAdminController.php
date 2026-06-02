<?php

namespace App\Http\Controllers\Dashboards;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use Illuminate\Http\Request;

class CommentsAdminController extends Controller
{
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
