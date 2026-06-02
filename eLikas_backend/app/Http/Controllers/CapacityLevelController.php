<?php

namespace App\Http\Controllers;

use Illuminate\Support\Facades\DB;

class CapacityLevelController extends Controller
{
    public function index()
    {
        $capacityLevels = DB::table('CapacityLevels')
            ->select('id', 'capacity_level')
            ->orderBy('capacity_level')
            ->get();

        return response()->json($capacityLevels, 200);
    }
}
