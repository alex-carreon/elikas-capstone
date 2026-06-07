<?php

namespace App\Http\Controllers\Dashboards;

use App\Http\Controllers\Controller;
use App\Models\FloodPath;
use Illuminate\Http\Request;
use MatanYadaev\EloquentSpatial\Objects\LineString;
use MatanYadaev\EloquentSpatial\Objects\Point;

class FloodPathAdminController extends Controller
{
    public function index(Request $request)
    {
        $floodLevel = $request->query('flood_level');
        $isExpired = $request->query('is_expired');
        $isDeactivated = $request->query('is_deactivated');

        $query = FloodPath::with([
            'floodLevel:id,level_name',
            'socialElement:id,user_id,posted_at,deactivated_at',
        ]);

        // Filter by flood level
        if ($floodLevel) {
            $query->whereHas('floodLevel', function ($q) use ($floodLevel) {
                $q->where('level_name', $floodLevel);
            });
        }

        // Filter by expiration status
        if (!is_null($isExpired)) {
            $isExpired = filter_var($isExpired, FILTER_VALIDATE_BOOLEAN);

            if ($isExpired) {
                $query->where('expiry', '<', now());
            } else {
                $query->where('expiry', '>=', now());
            }
        }

        // Filter by deactivation status
        if (!is_null($isDeactivated)) {
            $isDeactivated = filter_var($isDeactivated, FILTER_VALIDATE_BOOLEAN);

            if ($isDeactivated) {
                $query->whereHas('socialElement', function ($q) {
                    $q->whereNotNull('deactivated_at');
                });
            } else {
                $query->whereHas('socialElement', function ($q) {
                    $q->whereNull('deactivated_at');
                });
            }
        }

        $floodPaths = $query
            ->orderByDesc('last_confirmed')
            ->get();

        return response()->json([
            'count' => $floodPaths->count(),
            'flood_paths' => $floodPaths->map(fn ($fp) => [
                'id' => $fp->id,
                'description' => $fp->description,
                'level' => $fp->floodLevel->level_name,
                'posted_at' => $fp->socialElement->posted_at
                    ? $fp->socialElement->posted_at
                        ->timezone('Asia/Manila')
                        ->toDateTimeString()
                    : null,
                'is_expired' => $fp->expiry < now(),
                'is_deactivated' => !is_null(
                    $fp->socialElement->deactivated_at
                ),
            ]),
        ]);
    }
}
