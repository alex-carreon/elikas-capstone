<?php

namespace App\Http\Controllers;

use App\Exceptions\NoRouteFoundException;
use App\Services\RoutingService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EvacRouteController extends Controller
{
    public function getRoute(Request $request, RoutingService $routing): JsonResponse
    {
        $validated = $request->validate([
            'start_lon' => ['required', 'numeric', 'between:-180,180'],
            'start_lat' => ['required', 'numeric', 'between:-90,90'],
            'end_lon'   => ['required', 'numeric', 'between:-180,180'],
            'end_lat'   => ['required', 'numeric', 'between:-90,90'],
        ]);

        try {
            $route = $routing->getEvacuationRoute(
                (float) $validated['start_lon'],
                (float) $validated['start_lat'],
                (float) $validated['end_lon'],
                (float) $validated['end_lat'],
            );

            return response()->json($route);

        } catch (NoRouteFoundException $e) {
            return response()->json(['message' => $e->getMessage()], 422);
        }
    }
}
