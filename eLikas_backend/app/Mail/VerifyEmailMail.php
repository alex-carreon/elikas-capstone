<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;

class VerifyEmailMail extends Mailable
{
    public function __construct(
        public string $username,
        public string $link
    ) {}

    public function build()
    {
        return $this->subject('Verify your eLikas account')
            ->view('verify-email')
            ->with([
                'username' => $this->username,
                'link' => $this->link,
            ]);
    }
}