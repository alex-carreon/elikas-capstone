<?php

namespace App\Http\Controllers\Votes;

use App\Http\Controllers\Controller;
use App\Models\Comment;
use App\Models\Vote;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class VoteCommentController extends Controller
{
    //COMMENT ON EVAC COMMENTS
    public function vote(Request $request, int $commentId)
    {
        try {
            $user = $request->attributes->get('firebase_user');

            $validated = $request->validate([
                'vote' => 'required|integer|in:1,-1',
            ]);

            $comment = Comment::with('element')->findOrFail($commentId);

            // Prevent voting on deactivated comments
            if ($comment->element?->deactivated_at) {
                return response()->json([
                    'message' => 'Comment is deactivated.',
                ], 403);
            }

            $elementId = $comment->element_id;
            $newVote = $validated['vote'];

            DB::transaction(function () use (
                $user,
                $elementId,
                $comment,
                $newVote
            ) {

                $existing = Vote::where('user_id', $user->id)
                    ->where('element_id', $elementId)
                    ->first();

                // First vote
                if (!$existing) {

                    Vote::create([
                        'user_id' => $user->id,
                        'element_id' => $elementId,
                        'vote' => $newVote,
                    ]);

                    $comment->increment(
                        $newVote === 1
                            ? 'upvotes'
                            : 'downvotes'
                    );
                }

                // Same vote again = remove vote
                elseif ($existing->vote === $newVote) {

                    if ($newVote === 1) {
                        $comment->decrement('upvotes');
                    } else {
                        $comment->decrement('downvotes');
                    }

                    $existing->delete();
                }

                // Switching vote
                else {

                    $existing->update([
                        'vote' => $newVote,
                    ]);

                    if ($newVote === 1) {

                        $comment->increment('upvotes');
                        $comment->decrement('downvotes');

                    } else {

                        $comment->increment('downvotes');
                        $comment->decrement('upvotes');
                    }
                }
            });

            $comment->refresh();

            $userVote = Vote::where('user_id', $user->id)
                ->where('element_id', $elementId)
                ->value('vote');

            return response()->json([
                'upvotes' => $comment->upvotes,
                'downvotes' => $comment->downvotes,
                'user_vote' => $userVote,
            ]);

        } catch (\Exception $e) {

            return response()->json([
                'error' => 'Failed to process vote',
                'details' => $e->getMessage(),
            ], 500);
        }
    }
}