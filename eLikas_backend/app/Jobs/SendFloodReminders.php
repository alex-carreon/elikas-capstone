<?php

namespace App\Jobs;

use App\Models\FloodPath;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use App\Mail\FloodPathReminderMail;

class SendFloodReminders implements ShouldQueue
{
    use Dispatchable, Queueable;

    public function handle()
    {
        $floodPaths = FloodPath::with(['socialElement' => function ($q) {
                $q->select('id', 'user_id', 'deactivated_at');
            }, 'socialElement.user' => function ($q) {
                $q->select('id', 'email');
            }])
            ->whereNull('dismissed_at')
            ->notExpired()
            ->notDeactivated()
            ->where(function ($q) {
                $q->whereNull('reminder_sent_at')
                ->orWhere('reminder_sent_at', '<=', now()->subHour());
            })
            ->get();

        Log::info('Flood reminder job ran. Paths found: ' . $floodPaths->count());

        foreach ($floodPaths as $fp) {

            $start = $fp->last_confirmed;
            $end = $fp->expiry;

            $totalSeconds = $start->diffInSeconds($end);

            $halfway = $start
                ->copy()
                ->addSeconds(floor($totalSeconds / 2));

            if (now()->gte($halfway)) {

                $owner = $fp->socialElement->user;

                try {
                    Mail::to($owner->email)
                        ->send(new FloodPathReminderMail($fp));
                

                    $fp->update(['reminder_sent_at' => now()]);
                    Log::info("Flood reminder sent to {$owner->email} for flood path {$fp->id}.");
                } catch (\Exception $e) {
                    Log::error("Failed to send flood reminder for flood path {$fp->id}: " . $e->getMessage());
                }
            }
        }
    }
}