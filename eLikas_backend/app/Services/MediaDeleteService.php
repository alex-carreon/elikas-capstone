<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;
use App\Enums\MediaCollection;
use Exception;

class MediaDeleteService
{
    public function delete(String $path): bool
    {
        if (!Storage::disk('sftp')->exists(config('app.media_base_url') . '/' . $path) {
            return true;
        }

        try {
            return Storage::disk('sftp')->delete($path);
        } catch (Exception $e) {
            Log::error("Failed to delete media at path: {$path}. Error: {$e->getMessage()}");
            return false;
        }
    }
}
