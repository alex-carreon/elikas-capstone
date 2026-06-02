<?php

namespace App\Http\Controllers\PinControllers;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\EvacArea;
use App\Models\SocialElement;
use App\Models\MediaFile;
use Illuminate\Support\Facades\DB;
use MatanYadaev\EloquentSpatial\Objects\Point;
use Carbon\Carbon;
use App\Services\MediaUploadService;
use App\Enums\MediaCollection;
use Illuminate\Support\Facades\Storage;

class StoreEvacuationAreaController extends Controller
{
    public function __construct(
        protected MediaUploadService $mediaUploadService
    ) {}

    public function storeEvacuationArea(Request $request)
    {
        $uploadedPath = null;

        try {
            $user = $request->attributes->get('firebase_user');

            $request->validate([
                'name' => 'required|string|max:255',
                'address' => 'required|string|max:255',
                'lat' => 'required|numeric|between:-90,90',
                'lng' => 'required|numeric|between:-180,180',
                'location_id' => 'required|integer|exists:Locations,id',
                'area_type' => 'required|integer|exists:EvacTypes,id',
                'capacity_level' => 'required|integer|exists:CapacityLevels,id',
                'description' => 'nullable|string',
                'is_persistent' => 'boolean',
                'for_reg_flood' => 'boolean',
                'for_heavy_flood' => 'boolean',
                'has_accom' => 'boolean',
                'has_DRRMO' => 'boolean',
                'has_health' => 'boolean',
                'pwd_friendly' => 'boolean',
                'has_catchment' => 'boolean',
                'toilet_count' => 'nullable|integer|min:0',
                'kitchen_count' => 'nullable|integer|min:0',
                'child_prayer_count' => 'nullable|integer|min:0',
                'breastfeed_count' => 'nullable|integer|min:0',
                'other_facilities' => 'nullable|string',
                'contact_person' => 'nullable|string|max:255',
                'contact_number' => 'nullable|string|max:20',
                'expiry' => 'nullable|date|after:now',
                'file' => ['nullable', 'file', 'image', 'mimes:jpg,jpeg,png', 'max:8192'],
            ]);

            $expiry = $request->expiry
                ? Carbon::parse($request->expiry, 'Asia/Manila')->utc()
                : null;


            if ($request->hasFile('file')) {
                $uploadedPath = $this->mediaUploadService->upload($request->file('file'), MediaCollection::EvacAreas);
            }

            DB::beginTransaction();

            $element = SocialElement::create([
                'user_id' => $user->id,
                'posted_at' => now(),
                'type_id' => 1,
                'has_media' => !is_null($uploadedPath),
            ]);

            if ($uploadedPath) {
                $media = MediaFile::create([
                    'parent_id' => $element->id,
                    'user_id' => $user->id,
                    'file_path' => $uploadedPath,
                    'file_type' => 'jpg',
                    'uploaded_at' => now(),
                ]);
            }

            $pin = EvacArea::create([
                'element_id' => $element->id,
                'location_id' => $request->location_id,
                'location' => new Point((float) $request->lat, (float) $request->lng),
                'area_type' => $request->area_type,
                'address' => $request->address,
                'description' => $request->description,
                'name' => $request->name,
                'capacity_level' => $request->capacity_level,
                'last_updated' => now(),
                'is_persistent' => $request->is_persistent ?? false,
                'for_reg_flood' => $request->for_reg_flood ?? false,
                'for_heavy_flood' => $request->for_heavy_flood ?? false,
                'has_accom' => $request->has_accom ?? false,
                'has_DRRMO' => $request->has_DRRMO ?? false,
                'has_health' => $request->has_health ?? false,
                'pwd_friendly' => $request->pwd_friendly ?? false,
                'has_catchment' => $request->has_catchment ?? false,
                'toilet_count' => $request->toilet_count,
                'kitchen_count' => $request->kitchen_count,
                'child_prayer_count' => $request->child_prayer_count,
                'breastfeed_count' => $request->breastfeed_count,
                'other_facilities' => $request->other_facilities,
                'contact_person' => $request->contact_person,
                'contact_number' => $request->contact_number,
                'expiry' => $expiry,
            ]);

            DB::commit();

            return response()->json([
                'message' => 'Evacuation area created successfully',
                'pin_id' => $pin->id,
                'element_id' => $element->id,
                'media_path' => $uploadedPath,
            ], 201);

        } catch (\Exception $e) {

            DB::rollBack();

            if ($uploadedPath) {
                Storage::disk('sftp')->delete($uploadedPath);
            }

            return response()->json([
                'error' => 'Failed to create evacuation area',
                'details' => $e->getMessage()
            ], 500);
        }
    }
}
