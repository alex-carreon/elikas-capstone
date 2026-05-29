<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Location;

class LocationsController extends Controller
{
    
    /**
     * Returns all cities
     */
    public function cities()
    {
        $cities = Location::with('parentLocation')
            ->whereHas('locationLevel', function ($query) {
                $query->where('level_name', 'City');
            })
            ->select('id', 'name', 'parent_id')
            ->orderBy('name')
            ->get();

        return response()->json([
            'Cities' => $cities
        ]);
    }

    /**
     * GET /locations/barangays
     * /locations/barangays?city_id=10
     */
    public function barangays(Request $request)
    {
        $query = Location::with('parentLocation')
            ->whereHas('locationLevel', function ($q) {
                $q->where('level_name', 'Barangay');
            });

        // Filter by city if provided
        if ($request->filled('city_id')) {
            $query->where('parent_id', $request->city_id);
        }

        $barangays = $query
            ->select('id', 'name', 'parent_id')
            ->orderBy('name')
            ->get();

        return response()->json([
            'Barangays' => $barangays
        ]);
    }
}
