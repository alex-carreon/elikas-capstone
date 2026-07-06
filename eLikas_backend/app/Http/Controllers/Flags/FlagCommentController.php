<?php

namespace App\Http\Controllers\Flags;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;

use App\Models\Comment;
use App\Models\Flag;
use App\Models\FlagReason;
use App\Mail\ContentFlaggedMail;
use Illuminate\Support\Facades\Mail;

class FlagCommentController extends Controller
{
    /** Flags needed before admins are alerted */
    protected int $flagThreshold = 3;

    /**
     * POST /comments/{commentId}/flag
     */
    public function store(Request $request, int $commentId)
    {
        $user = $request->attributes->get('firebase_user');

        $validated = $request->validate([
            'reason_id' => ['required', 'integer', 'exists:FlagReasons,id'],
        ]);

        $comment = Comment::find($commentId);

        if (!$comment) {
            return response()->json([
                'message' => 'Comment not found.',
            ], 404);
        }

        // Prevent flagging own comment
        if ($comment->element?->user_id === $user->id) {
            return response()->json([
                'message' => 'You cannot flag your own comment.',
            ], 403);
        }

        // Prevent duplicate flag from same user on same comment
        $alreadyFlagged = Flag::where('user_id', $user->id)
            ->where('element_id', $comment->element_id)
            ->exists();

        if ($alreadyFlagged) {
            return response()->json([
                'message' => 'You have already flagged this comment.',
            ], 409);
        }

        Flag::create([
            'user_id'     => $user->id,
            'element_id'  => $comment->element_id,
            'reason_id'   => $validated['reason_id'],
            'flagged_at'  => now(),
            'is_approved' => null,
        ]);

        // Notify admins once the flag count hits the threshold
        $flagCount = Flag::where('element_id', $comment->element_id)->count();

        if ($flagCount === $this->flagThreshold) {
            $posterName = $comment->element?->user?->name;

            Mail::to(config('mail.admin_notification_emails'))->send(
                new ContentFlaggedMail([
                    'type' => 'comment',
                    'content_id' => $comment->id,
                    'element_id' => $comment->element_id,
                    'flag_count' => $flagCount,
                    'content' => $comment->content ?? null,
                    'posted_by' => $posterName ? trim($posterName->first_name.' '.$posterName->last_name) : 'Unknown',
                    'posted_by_id' => $comment->element?->user_id,
                ])
            );
        }

        return response()->json([
            'message' => 'Comment flagged successfully.',
        ], 201);
    }

    /**
     * GET /flag-reasons
     */
    public function reasons()
    {
        return response()->json([
            'reasons' => FlagReason::all(['id', 'reason_label']),
        ]);
    }
}
