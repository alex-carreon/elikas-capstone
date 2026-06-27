<?php

namespace App\Mail;

use Illuminate\Mail\Mailable;

class ForgotPasswordMail extends Mailable
{
    public function __construct(
        public string $username,
        public string $link
    ) {}

    public function build()
    {
        return $this->subject('Reset your eLikas password')
            ->view('forgot-password')
            ->with([
                'username' => $this->username,
                'link' => $this->link,
            ]);
    }
}