<?php

namespace App\Http\Controllers;

use App\Models\FloodPath;
use App\Models\Vote;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class VoteController extends Controller
{
    public function vote(Request $request, int $floodPathId)
    {
        try {
            $user = $request->attributes->get('firebase_user');

            $validated = $request->validate([
                'vote' => 'required|integer|in:1,-1',
            ]);

            $floodPath = FloodPath::notExpired()
                ->notDeactivated()
                ->findOrFail($floodPathId);

            $elementId = $floodPath->element_id;
            $newVote   = $validated['vote'];

            DB::transaction(function () use ($user, $elementId, $floodPath, $newVote) {

                $existing = Vote::where('user_id', $user->id)
                    ->where('element_id', $elementId)
                    ->first();

                if (!$existing) {
                    Vote::create([
                        'user_id'    => $user->id,
                        'element_id' => $elementId,
                        'vote'       => $newVote,
                    ]);

                    $floodPath->increment($newVote === 1 ? 'upvotes' : 'downvotes');

                } elseif ($existing->vote === $newVote) {
                    throw new \Exception('already_voted');

                } else {
                    $existing->update(['vote' => $newVote]);

                    if ($newVote === 1) {
                        $floodPath->increment('upvotes');
                        $floodPath->decrement('downvotes');
                    } else {
                        $floodPath->increment('downvotes');
                        $floodPath->decrement('upvotes');
                    }
                }
            });

            $floodPath->refresh();

            return response()->json([
                'upvotes'   => $floodPath->upvotes,
                'downvotes' => $floodPath->downvotes,
            ]);

        } catch (\Exception $e) {
            if ($e->getMessage() === 'already_voted') {
                return response()->json([
                    'message' => 'You have already voted on this post.',
                ], 409);
            }

            return response()->json([
                'error'   => 'Failed to process vote',
                'details' => $e->getMessage()
            ], 500);
        }
    }
}