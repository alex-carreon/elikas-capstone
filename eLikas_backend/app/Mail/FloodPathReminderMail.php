<?php

namespace App\Mail;

use App\Models\FloodPath;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class FloodPathReminderMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public FloodPath $floodPath
    ) {}

    public function build()
    {
        return $this
            ->subject('🌊 Flood Path Confirmation Reminder')
            ->view('flood-path-reminder');
    }
}