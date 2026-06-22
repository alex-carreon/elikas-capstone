<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Intervention\Image\ImageManager;
use Intervention\Image\Drivers\Gd\Driver;
use Intervention\Image\Format;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;
use App\Enums\MediaCollection;

class MediaUploadService
{
    //Requires a file and a collection name, returns the URL of the uploaded media
    public function upload(UploadedFile $file, MediaCollection $collection): ?string
    {
        //Instantiate the ImageManager with GD driver
        $manager = ImageManager::usingDriver(Driver::class);

        //Decode the uploaded file into an Intervention Image instance
        $image = $manager->decode($file);

        //Get original dimensions
        $width = $image->width();
        $height = $image->height();

        //Scale the image down to a maximum of 1280px on the longest side, maintaining aspect ratio
        $scaled = $height > $width
            ? $image->scaleDown(height: 1280)
            : $image->scaleDown(width: 1280);

        //Encode the scaled image as JPEG and get the binary data
        $imagedata = (string) $scaled->encodeUsingFormat(Format::JPEG);

        //Generate a unique filename and construct the storage path
        $filename = Str::uuid() . '.jpg';
        $path = $collection->value . '/' . $filename;

        //upload to SFTP and return the path
        Storage::disk('sftp')->put($path, $imagedata);

        if (Storage::disk('sftp')->exists(config('app.media_base_url') . '/' . $path)) {
            return $path;
        } else {
            return null;
        }
    }
}
