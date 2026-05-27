<?php

namespace App\Http\Controllers\Dashboards;

use App\Http\Controllers\Controller;
use App\Models\FloodPath;
use Illuminate\Http\Request;
use MatanYadaev\EloquentSpatial\Objects\LineString;
use MatanYadaev\EloquentSpatial\Objects\Point;

class FloodPathAdminController extends Controller
{
    public function index()
    {
        $floodPaths = FloodPath::with([
                'floodLevel:id,level_name',
                'socialElement:id,user_id,posted_at,deactivated_at',
            ])
            // ->notExpired()
            // ->notDeactivated()
            ->orderByDesc('last_confirmed')
            ->get();

        return response()->json([
            'count' => $floodPaths->count(),
            'flood_paths' => $floodPaths->map(fn ($fp) => [
                'id'   => $fp->id,
                'level'=> $fp->floodLevel,
                'path' => $this->formatPath($fp->path),
                'is_expired' => $fp->expiry < now(), 'is_deactivated' => 
                !is_null( $fp->socialElement->deactivated_at ),
            ]),
        ]);
    }

    private function formatPath(LineString $path): array
    {
        return $path->getGeometries()
            ->map(fn(Point $point) => [$point->latitude, $point->longitude])
            ->toArray();
    }
}
