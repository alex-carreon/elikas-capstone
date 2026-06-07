<?php
namespace App\Services;

use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\Builder;

class SensorQuery {

    public function transform(Builder $query, Request $request): Builder
    {
        // LIKE search for name
        if ($request->filled('name')) {
            $query->where('name', 'LIKE', '%' . $this->escapeLike($request->name) . '%');
        }

        // LIKE search for sensor_code
        if ($request->filled('sensor_code')) {
            $query->where('sensor_code', 'LIKE', '%' . $this->escapeLike($request->sensor_code) . '%');
        }

        // LIKE search for address
        if ($request->filled('address')) {
            $query->where('address', 'LIKE', '%' . $this->escapeLike($request->address) . '%');
        }

        // omni-search across name, sensor_code, and address
        if ($request->filled('search')) {
            $term = $this->escapeLike($request->input('search'));
            $query->where(function (Builder $q) use ($term) {
                $q->where('sensor_code', 'LIKE', '%' . $term . '%')
                ->orWhere('name', 'LIKE', '%' . $term . '%')
                ->orWhere('address', 'LIKE', '%' . $term . '%');
            });
        }

        // Handles ?current_status[]=yellow&current_status[]=red
        if ($request->filled('current_status')) {
            $query->whereIn('current_status', $request->input('current_status'));
        }

        // Exact match for location
        if ($request->filled('location_id')) {
            $locationIds = $this->resolveLocationIds((int) $request->input('location_id'));
            $query->whereIn('location_id', $locationIds);
        }

        // Last online comparisons
        if ($request->filled('last_online_before') && strtotime($request->input('last_online_before'))) {
            $query->where('last_online', '<=', $request->date('last_online_before'));
        }

        if ($request->filled('last_online_after') && strtotime($request->input('last_online_after'))) {
            $query->where('last_online', '>=', $request->date('last_online_after'));
        }

        // Active/deactivated filter — joins through social_element
        if ($request->has('is_active') && in_array($request->input('is_active'), ['0', '1'], true)) {
            $query->whereHas('social_element', function (Builder $q) use ($request) {
                $request->input('is_active') === '1'
                    ? $q->whereNull('deactivated_at')
                    : $q->whereNotNull('deactivated_at');
            });
        }

        // --- SORTING ENGINE SYSTEM ---
        $sortBy    = $request->input('sort_by', 'name');
        $sortOrder = in_array($request->input('sort_order'), ['asc', 'desc']) ? $request->input('sort_order') : 'asc';

        switch ($sortBy) {
            case 'posted_at':
                // 1. Sort by a column inside the related table using a clean Eloquent subquery
                $query->orderBy(
                    \App\Models\SocialElement::select('posted_at')
                        ->whereColumn('SocialElements.id', 'Sensors.element_id')
                        ->limit(1),
                    $sortOrder
                );
                break;

            case 'last_online_null':
                // 2. Push never-awake/setup sensors (where last_online IS NULL) to a designated boundary.
                // In MariaDB/MySQL, "last_online IS NULL" evaluates to 1 if null, 0 if not null.
                if ($sortOrder === 'desc') {
                    // Show never-awake/setup sensors first, then active ones decreasing by date
                    $query->orderByRaw('last_online IS NULL DESC')->orderBy('last_online', 'desc');
                } else {
                    // Show active ones oldest-first, pushing never-awake/setup sensors to the absolute bottom
                    $query->orderByRaw('last_online IS NULL ASC')->orderBy('last_online', 'asc');
                }
                break;

            default:
                // Standard internal column sort validation fallback
                $sortable = ['name', 'sensor_code', 'current_status', 'last_online', 'barangay'];
                if (in_array($sortBy, $sortable)) {
                    $query->orderBy($sortBy, $sortOrder);
                }
                break;
        }

        return $query;
    }

    private function escapeLike(string $value): string
    {
        return str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $value);
    }

    private function resolveLocationIds(int $locationId): array
    {
        $result = \Illuminate\Support\Facades\DB::select("
            WITH RECURSIVE descendants AS (
                SELECT id FROM Locations WHERE id = :root_id
                UNION ALL
                SELECT l.id FROM Locations l
                INNER JOIN descendants d ON l.parent_id = d.id
            )
            SELECT id FROM descendants
        ", ['root_id' => $locationId]);

        $ids = array_column($result, 'id');
        return empty($ids) ? [null] : $ids;
    }
}
