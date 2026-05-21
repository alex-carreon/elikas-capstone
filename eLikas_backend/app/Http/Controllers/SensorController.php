<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Sensor;

class SensorController extends Controller
{
    // ---------------------------------------------------------------
    // MAP MARKERS — minimal data, active only for public
    // ---------------------------------------------------------------
    public function index(Request $request)
    {
        try {
            $user = $request->attributes->get('firebase_user');
            $isPrivileged = $user && in_array($user->role_id, [1, 2]);

            $query = Sensor::with('social_element');

            // Public only sees active sensors
            if (!$isPrivileged) {
                $query->whereHas('social_element', function ($q) {
                    $q->whereNull('deactivated_at');
                });
            }

            $sensors = $query->get();

            return response()->json($sensors->map(function ($sensor) {
                return [
                    'id'           => $sensor->id,
                    'name'         => $sensor->name,
                    'location'     => $sensor->location
                        ? [$sensor->location->latitude, $sensor->location->longitude]
                        : null,
                    'depth'        => $sensor->depth,
                    'near_overflow' => $sensor->near_overflow ?? false,
                    'deactivated'  => $sensor->social_element?->deactivated_at ? true : false,
                ];
            }));
        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Failed to fetch sensors',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    // ---------------------------------------------------------------
    // LIST VIEW — more info, filterable
    // ---------------------------------------------------------------
    public function list(Request $request)
    {
        try {
            $user = $request->attributes->get('firebase_user');
            $isPrivileged = $user && in_array($user->role_id, [1, 2]);

            $query = Sensor::with('social_element.user.govOp.location');

            // Public only sees active sensors
            if (!$isPrivileged) {
                $query->whereHas('social_element', function ($q) {
                    $q->whereNull('deactivated_at');
                });
            }

            // Filter by location
            if ($request->filled('location_id')) {
                $query->whereHas('social_element.user.govOp', function ($q) use ($request) {
                    $q->where('location_id', $request->location_id);
                });
            }

            // Filter by status — admin/brgy only
            if ($isPrivileged && $request->filled('status')) {
                $query->whereHas('social_element', function ($q) use ($request) {
                    if ($request->status === 'active') {
                        $q->whereNull('deactivated_at');
                    } else {
                        $q->whereNotNull('deactivated_at');
                    }
                });
            }

            $sensors = $query->get();

            return response()->json($sensors->map(function ($sensor) use ($isPrivileged) {
                $element = $sensor->social_element;
                $govOp   = $element?->user?->govOp;

                $data = [
                    'id'           => $sensor->id,
                    'name'         => $sensor->name,
                    'depth'        => $sensor->depth,
                    'near_overflow' => $sensor->near_overflow ?? false,
                    'address'      => $sensor->address,
                    'barangay'     => $govOp?->location?->name ?? null,
                    'last_online'  => $sensor->last_online,
                    'deactivated'  => $element?->deactivated_at ? true : false,
                ];

                if ($isPrivileged) {
                    $data['sensor_code']    = $sensor->sensor_code;
                    $data['element_id']     = $sensor->element_id;
                    $data['location_level'] = $govOp?->locationLevel?->level_name ?? null;
                    $data['owner']          = [
                        'user_id'        => $element?->user?->id,
                        'username'       => $element?->user?->username,
                        'point_person'   => $govOp?->point_person,
                        'point_position' => $govOp?->point_position,
                    ];
                }

                return $data;
            }));
        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Failed to fetch sensors',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    // ---------------------------------------------------------------
    // SINGLE SENSOR — full detail
    // ---------------------------------------------------------------
    public function show(Request $request, $id)
    {
        try {
            $user = $request->attributes->get('firebase_user');
            $isPrivileged = $user && in_array($user->role_id, [1, 2]);

            $sensor = Sensor::with('social_element.user.govOp.location')->findOrFail($id);
            $element = $sensor->social_element;
            $govOp   = $element?->user?->govOp;

            // Public cannot view deactivated sensors
            if (!$isPrivileged && $element?->deactivated_at) {
                return response()->json(['error' => 'Sensor not found'], 404);
            }

            $data = [
                'id'           => $sensor->id,
                'name'         => $sensor->name,
                'depth'        => $sensor->depth,
                'near_overflow' => $sensor->near_overflow ?? false,
                'location'     => $sensor->location
                    ? [$sensor->location->latitude, $sensor->location->longitude]
                    : null,
                'address'      => $sensor->address,
                'barangay'     => $govOp?->location?->name ?? null,
                'last_online'  => $sensor->last_online,
                'deactivated'  => $element?->deactivated_at ? true : false,
            ];

            if ($isPrivileged) {
                $data['sensor_code']    = $sensor->sensor_code;
                $data['element_id']     = $sensor->element_id;
                $data['location_level'] = $govOp?->locationLevel?->level_name ?? null;
                $data['owner']          = [
                    'user_id'        => $element?->user?->id,
                    'username'       => $element?->user?->username,
                    'point_person'   => $govOp?->point_person,
                    'point_position' => $govOp?->point_position,
                ];
            }

            return response()->json($data);
        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Failed to fetch sensor',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    // ---------------------------------------------------------------
    // DEACTIVATE — sets deactivated_at on the parent social element
    // ---------------------------------------------------------------
    public function deactivate(Request $request, $id)
    {
        try {
            $sensor = Sensor::with('social_element')->findOrFail($id);

            $sensor->social_element->update([
                'deactivated_at' => now()
            ]);

            return response()->json(['message' => 'Sensor deactivated successfully']);
        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Failed to deactivate sensor',
                'details' => $e->getMessage()
            ], 500);
        }
    }
}
