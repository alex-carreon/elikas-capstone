<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Services\MediaDeleteService;
use App\Models\MediaFile;
use Illuminate\Support\Facades\DB;

class MediaCleanupController extends Controller
{
    public function destroy(Request $request, MediaDeleteService $deleteService)
    {
        // Require either 'id' or 'path', not both
        $request->validate([
            'id'   => 'required_without:path|numeric|nullable',
            'path' => 'required_without:id|string|nullable',
        ]);

        try {
            $id = $request->input('id');
            $path = $request->input('path');

            if ($id) {
                $mediaFile = MediaFile::find($id);

                if (!$mediaFile) {
                    return response()->json(['message' => 'No associated media record was found'], 404);
                }

                $filePath = $mediaFile->file_path ?? $path;

                if ($deleteService->delete($filePath)) {
                  DB::transaction(function () use ($mediaFile) {
                    $mediaFile->delete();
                    $remainingMediaCount = MediaFile::where('parent_id', $mediaFile->parent_id)->count();

                    if ($remainingMediaCount === 0) {
                        $mediaFile->social_element()->update(['has_media' => false]);
                    }
                  });
                  return response()->json(['message' => 'Media record and/or storage file deleted successfully'], 200);
                }
                return response()->json(['error' => 'Failed to clean up media files'], 500);
            }

            if ($path) {
                if ($deleteService->delete($path)) {
                    return response()->json(['message' => 'Media file deleted from storage successfully'], 200);
                }
                return response()->json(['error' => 'Failed to delete media file from storage server'], 500);
            }
        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'An unexpected error occurred during deletion',
                'details' => $e->getMessage(),
            ], 500);
        }
    }
}
