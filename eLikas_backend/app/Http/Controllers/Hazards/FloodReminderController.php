<?php

namespace App\Http\Controllers\Hazards;

use App\Http\Controllers\Controller;
use App\Models\FloodPath;
use Illuminate\Http\Request;

class FloodReminderController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->attributes->get('firebase_user');

        $floodPaths = FloodPath::ownedBy($user->id)
            ->whereNull('dismissed_at')
            ->notExpired()
            ->notDeactivated()
            ->where(function ($q) {
                $q->whereNull('reminder_sent_at')
                  ->orWhere('reminder_sent_at', '<=', now()->subHour());
            })
            ->get();

        $reminders = [];

        foreach ($floodPaths as $fp) {

            $start = $fp->last_confirmed;
            $end = $fp->expiry;

            $totalSeconds = $start->diffInSeconds($end);

            $halfway = $start
                ->copy()
                ->addSeconds(
                    floor($totalSeconds / 2)
                );

            if (now()->gte($halfway)) {

                $fp->update([
                    'reminder_sent_at' => now(),
                ]);

                $reminders[] = [
                    'floodpath_id' => $fp->id,
                    'flood_description' => $fp->description,
                    'message' => 'Please confirm if this flood path is still valid.',
                    'expiry' => $fp->expiry
                        ->timezone('Asia/Manila')
                        ->toDateTimeString(),
                ];
            }
        }

        return response()->json([
            'count' => count($reminders),
            'reminders' => $reminders,
        ]);
    }

    public function remindLater(Request $request)
    {
        $user = $request->attributes->get('firebase_user');

        $request->validate([
            'ids'   => 'required|array|min:1',
            'ids.*' => 'integer',
        ]);

        $updated = FloodPath::whereIn('id', $request->ids)
            ->whereHas(
                'socialElement',
                fn ($q) => $q->where('user_id', $user->id)
            )
            ->update(['reminder_sent_at' => now()]);

        return response()->json([
            'message' => 'You will be reminded again in an hour.',
            'updated' => $updated,
        ]);
    }

    public function dismissReminder(Request $request)
    {
        $user = $request->attributes->get('firebase_user');

        $request->validate([
            'ids'   => 'required|array|min:1',
            'ids.*' => 'integer',
        ]);

        $updated = FloodPath::whereIn('id', $request->ids)
            ->whereHas(
                'socialElement',
                fn ($q) => $q->where('user_id', $user->id)
            )
            ->update(['dismissed_at' => now()]);

        return response()->json([
            'message' => 'Reminder dismissed.',
            'updated' => $updated,
        ]);
    }
}