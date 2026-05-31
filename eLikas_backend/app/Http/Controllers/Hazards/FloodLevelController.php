<?php

namespace App\Http\Controllers\Hazards;

use App\Http\Controllers\Controller;
use App\Models\FloodLevel;
use Illuminate\Http\Request;

class FloodLevelController extends Controller
{
    /**
     * GET /flood-levels
     *
     * Returns all flood levels for use in dropdowns/selectors 
     */
    public function index()
    {
        $levels = FloodLevel::select('id', 'level_name', 'description')
            ->orderBy('id')
            ->get();
 
        return response()->json([
            'flood_levels' => $levels,
        ], 200);
    }

    /**
     * POST /flood-levels
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'level_name'  => ['required', 'string', 'max:255', 'unique:FloodLevels,level_name'],
            'description' => ['nullable', 'string', 'max:1000'],
        ]);
 
        $level = FloodLevel::create($validated);
 
        return response()->json([
            'message'     => 'Flood level created successfully.',
            'flood_level' => $level,
        ], 201);
    }

    /**
     * PATCH /flood-levels/{id}
     */
    public function update(Request $request, int $id)
    {
        $level = FloodLevel::find($id);
 
        if (!$level) {
            return response()->json([
                'message' => 'Flood level not found.',
            ], 404);
        }
 
        $validated = $request->validate([
            'level_name'  => ['sometimes', 'string', 'max:255', 'unique:FloodLevels,level_name,' . $id],
            'description' => ['sometimes', 'nullable', 'string', 'max:1000'],
        ]);

        if (empty($validated)) {
            return response()->json([
                'message' => 'No valid fields provided for update.',
            ], 422);
        }
 
        $level->update($validated);
    
        return response()->json([
            'message'     => 'Flood level updated successfully.',
            'flood_level' => $level,
        ], 200);
    }

    /**
     * GET /flood-levels/{id}
     */
    public function show(int $id)
    {
        $level = FloodLevel::select('id', 'level_name', 'description')
            ->find($id);

        if (!$level) {
            return response()->json([
                'message' => 'Flood level not found.',
            ], 404);
        }

        return response()->json([
            'flood_level' => $level,
        ], 200);
    }
 
}

