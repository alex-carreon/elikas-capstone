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

        // Handles ?current_status[]=yellow&current_status[]=red
        if ($request->filled('current_status')) {
            $query->whereIn('current_status', $request->input('current_status'));
        }

        // Exact match for location
        if ($request->filled('location_id')) {
            $locationIds = $this->resolveLocationIds((int) $request->input('location_id'));

            $query->whereHas('social_element.user', function (Builder $userQuery) use ($locationIds) {
                // 1. Ensure the user actually IS a GovOp first
                $userQuery->has('govOp')->whereHas('govOp', function (Builder $govOpQuery) use ($locationIds) {
                    // 2. Then constrain by the location IDs
                    $govOpQuery->whereIn('location_id', $locationIds);
                });
            });
        }

        // Search string for address
        if ($request->filled('address')) {
            $query->where('address', 'LIKE', '%' . $this->escapeLike($request->address) . '%');
        }

        // Last online comparisons — useful for finding "ghost active" sensors
        // e.g. ?last_online_before=2025-01-01
        //      ?last_online_after=2025-06-01
        //      ?last_online_minutes_ago=30  (sensors silent for X+ minutes)
        if ($request->filled('last_online_before') && strtotime($request->input('last_online_before'))) {
            $query->where('last_online', '<=', $request->date('last_online_before'));
        }

        if ($request->filled('last_online_after') && strtotime($request->input('last_online_after'))) {
            $query->where('last_online', '>=', $request->date('last_online_after'));
        }

        // Active/deactivated filter — joins through social_element
        // ?is_active=1  → deactivated_at IS NULL
        // ?is_active=0  → deactivated_at IS NOT NULL
        if ($request->has('is_active') && in_array($request->input('is_active'), ['0', '1'], true)) {
            $query->whereHas('social_element', function (Builder $q) use ($request) {
                $request->input('is_active') === '1'
                    ? $q->whereNull('deactivated_at')
                    : $q->whereNotNull('deactivated_at');
            });
        }

        // Sorting
        $sortable = [
            'name',
            'sensor_code',
            'current_status',
            'last_online',
            'barangay',
        ];

        $sortBy    = $request->input('sort_by', 'name');       // default sort column
        $sortOrder = in_array($request->input('sort_order'), ['asc', 'desc'])
            ? $request->input('sort_order')
            : 'asc';

        if (in_array($sortBy, $sortable)) {
            $query->orderBy($sortBy, $sortOrder === 'desc' ? 'desc' : 'asc');
        }

        return $query;
    }

    private function escapeLike(string $value): string
    {
        // Escapes \, %, and _ so they are treated as literal characters in a LIKE query
        return str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $value);
    }

    private function resolveLocationIds(int $locationId): array
    {
        // get the target ID and all its descendants
        $result = \Illuminate\Support\Facades\DB::select("
            WITH RECURSIVE descendants AS (
                -- anchor member: start with the specified location ID
                SELECT id FROM Locations WHERE id = :root_id
                UNION ALL

                -- recursive member: find children of the current set
                SELECT l.id FROM Locations l
                INNER JOIN descendants d ON l.parent_id = d.id
            )
            SELECT id FROM descendants
        ", ['root_id' => $locationId]);

        $ids = array_column($result, 'id');

        return empty($ids) ? [null] : $ids;
    }
}
