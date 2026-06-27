<?php

namespace App\Mail;

use App\Models\SocialElement;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class ContentRejectedMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public SocialElement $element,
        public string $reason,    
        public ?string $snippet,    
        public string $contentType,
    ) {}

    public function build()
    {
        return $this->subject('Your content has been removed')
            ->view('content-rejected', [
                'user'        => $this->element->user,
                'reason'      => $this->reason,
                'snippet'     => $this->snippet,
                'contentType' => $this->contentType,
            ]);
    }
}