<?php

namespace App\Services;

use Illuminate\Http\Request;
use Illuminate\Database\Eloquent\Builder;
use App\Models\AuditLog;

class AuditLogQuery
{
    public function transform(Builder $query, Request $request): Builder
    {
        // LIKE search for log_id
        // if ($request->filled('log_id')) {
        //     $query->where('log_id', 'LIKE', '%' . $this->escapeLike($request->log_id) . '%');
        // }

        if ($request->filled('search')) {
            $searchTerm = $this->escapeLike($request->search);

            $query->where(function ($q) use ($searchTerm) {
                // Look inside the user relationship
                $q->whereHas('user', function ($userQuery) use ($searchTerm) {

                    // 1. Search through the user -> name relationship
                    $userQuery->whereHas('name', function ($nameQuery) use ($searchTerm) {
                        $nameQuery->where('first_name', 'LIKE', '%' . $searchTerm . '%')
                                ->orWhere('last_name', 'LIKE', '%' . $searchTerm . '%');
                    })

                    // 2. OR search through user -> govOp -> location relationship
                    ->orWhereHas('govOp.location', function ($locationQuery) use ($searchTerm) {
                        $locationQuery->where('name', 'LIKE', '%' . $searchTerm . '%');
                    });

                })
                // 3. FIX: Move this OUT of the user scope, straight onto the parent query ($q)
                ->orWhere('log_id', 'LIKE', '%' . $searchTerm . '%');
            });
        }

        // Exact match for user_id
        if ($request->filled('user_id')) {
            $query->where('user_id', $request->input('user_id'));
        }

        // Exact match for user_type
        if ($request->filled('user_type')) {
            $query->where('user_type', $request->input('user_type'));
        }

        // Exact match for target_id
        if ($request->filled('target_id')) {
            $query->where('target_id', $request->input('target_id'));
        }

        // Handles ?event[]=created&event[]=deleted
        if ($request->filled('event')) {
            $query->whereIn('event', $request->input('event'));
        }

        // Handles ?target_table_id[]=1, etc.
        if ($request->filled('target_table_id')) {
            $query->whereIn('target_table_id', $request->input('target_table_id'));
        }

        // Date comparisons
        if ($request->filled('logged_before') && strtotime($request->input('logged_before'))) {
            $query->where('created_at', '<=', $request->date('logged_before'));
        }

        if ($request->filled('logged_after') && strtotime($request->input('logged_after'))) {
            $query->where('created_at', '>=', $request->date('logged_after'));
        }

        // --- SORTING ENGINE SYSTEM ---
        $sortOrder = in_array($request->query('sort_order'), ['asc', 'desc']) ? $request->query('sort_order') : 'desc';
        $query->orderBy('created_at', $sortOrder);
        return $query;
    }

    private function escapeLike(string $value): string
    {
        return str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $value);
    }
}
