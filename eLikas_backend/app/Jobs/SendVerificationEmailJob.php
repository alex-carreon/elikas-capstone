<?php

namespace App\Jobs;

use App\Mail\VerifyEmailMail;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Support\Facades\Mail;

class SendVerificationEmailJob implements ShouldQueue
{
    use Dispatchable, Queueable;

    public function __construct(
        public string $email,
        public string $username,
        public string $link
    ) {}

    public function handle()
    {
        Mail::to($this->email)->send(
            new VerifyEmailMail($this->username, $this->link)
        );
    }
}