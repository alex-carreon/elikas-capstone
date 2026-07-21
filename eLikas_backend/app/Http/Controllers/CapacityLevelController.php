<?php

namespace App\Http\Controllers;

use App\Models\CapacityLevel;
use Illuminate\Support\Facades\DB;

class CapacityLevelController extends Controller
{
    public function index()
    {
        $capacityLevels = DB::table('CapacityLevels')
            ->select('id', 'capacity_level')
            ->orderBy('capacity_level')
            ->get()
            ->map(fn ($level) => [
                'id'             => $level->id,
                'capacity_level' => CapacityLevel::describe($level->capacity_level),
            ]);

        return response()->json($capacityLevels, 200);
    }
}
