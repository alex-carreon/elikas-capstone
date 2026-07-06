<?php

namespace App\Http\Controllers\Flags;

use App\Http\Controllers\Controller;
use App\Models\Flag;
use App\Models\FloodPath;
use Illuminate\Http\Request;
use App\Mail\ContentFlaggedMail;
use Illuminate\Support\Facades\Mail;

class FlagFloodController extends Controller
{
    /** Flags needed before admins are alerted */
    protected int $flagThreshold = 3;

    /**
     * POST /flood-paths/{floodPathId}/flag
     */
    public function store(Request $request, int $floodPathId)
    {
        $user = $request->attributes->get('firebase_user');

        $validated = $request->validate([
            'reason_id' => ['required', 'integer', 'exists:FlagReasons,id'],
        ]);

        $floodPath = FloodPath::with('socialElement')->find($floodPathId);

        if (!$floodPath) {
            return response()->json([
                'message' => 'Flood path not found.',
            ], 404);
        }

        // Prevent flagging deactivated flood paths
        if ($floodPath->socialElement->deactivated_at) {
            return response()->json([
                'message' => 'Flood path is no longer active.',
            ], 403);
        }

        // Prevent flagging own flood path
        if ($floodPath->socialElement->user_id === $user->id) {
            return response()->json([
                'message' => 'You cannot flag your own flood path.',
            ], 403);
        }

        // Prevent duplicate flag from same user on same flood path
        $alreadyFlagged = Flag::where('user_id', $user->id)
            ->where('element_id', $floodPath->element_id)
            ->exists();

        if ($alreadyFlagged) {
            return response()->json([
                'message' => 'You have already flagged this flood path.',
            ], 409);
        }

        Flag::create([
            'user_id'     => $user->id,
            'element_id'  => $floodPath->element_id,
            'reason_id'   => $validated['reason_id'],
            'flagged_at'  => now(),
            'is_approved' => null,
        ]);

         // Notify admins once the flag count hits the threshold 
        $flagCount = Flag::where('element_id', $floodPath->element_id)->count();

        if ($flagCount === $this->flagThreshold) {
            $posterName = $floodPath->socialElement?->user?->name;

            Mail::to(config('mail.admin_notification_emails'))->send(
                new ContentFlaggedMail([
                    'type' => 'flood_path',
                    'content_id' => $floodPath->id,
                    'element_id' => $floodPath->element_id,
                    'flag_count' => $flagCount,
                    'content' => $floodPath->description ?? null,
                    'posted_by' => $posterName ? trim($posterName->first_name . ' ' . $posterName->last_name) : 'Unknown',
                    'posted_by_id' => $floodPath->socialElement?->user_id,
                ])
            );
        }

        return response()->json([
            'message' => 'Flood path flagged successfully.',
        ], 201);
    }
}