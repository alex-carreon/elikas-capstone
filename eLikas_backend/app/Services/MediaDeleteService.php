<?php

namespace App\Services;

use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Exception;

class MediaDeleteService
{
    public function delete(String $path): bool
    {
        try {
            return Storage::disk('sftp')->delete($path);
        } catch (Exception $e) {
            Log::error("Failed to delete media at path: {$path}. Error: {$e->getMessage()}");
            return false;
        }
    }
}
