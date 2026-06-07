<?php

namespace App\Services;

use OpenAI;

class ModerationService
{
    public function moderate(string $content): array
    {
        $client = OpenAI::client(config('services.openai.api_key'));

        $response = $client->moderations()->create([
            'model' => 'omni-moderation-latest',
            'input' => $content,
        ]);

        // Convert the entire response to array first
        $result = $response->toArray()['results'][0];

        return [
            'flagged'         => $result['flagged'],
            'categories'      => $result['categories'],
            'category_scores' => $result['category_scores'],
        ];
    }
}