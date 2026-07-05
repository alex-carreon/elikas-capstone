<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ContentFlaggedMail extends Mailable
{
    use Queueable, SerializesModels;

    public array $details;

    public function __construct(array $details)
    {
        $this->details = $details;
    }

    public function build()
    {
        return $this->subject('⚠️ Content flagged 3 times — review needed')
            ->view('content-flagged')
            ->with('details', $this->details);
    }
}