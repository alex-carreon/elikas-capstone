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
                'description'    => $fp->description,
                // 'level'=> $fp->floodLevel->level_name,
                'posted_at' => $fp->socialElement->posted_at
                    ? $fp->socialElement->posted_at->timezone('Asia/Manila')->toDateTimeString()
                    : null,
                // 'path' => $this->formatPath($fp->path),
                // 'is_expired' => $fp->expiry < now(), 
                // 'is_deactivated' => !is_null( $fp->socialElement->deactivated_at ),
            ]),
        ]);
    }
}
