<?php

namespace App\Http\Controllers;

use App\Models\EmergencyContact;
use App\Models\SocialElement;
use App\Models\TargetTable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class EmergencyContactController extends Controller
{
    public function index(Request $request)
    {
        try {
            $query = EmergencyContact::with(['social_element.user', 'location:id,name'])
                ->whereHas('social_element', function ($q) {
                    $q->whereNull('deactivated_at');
                });

            if ($request->has('location_id')) {
                $query->where('location_id', $request->query('location_id'));
            }

            if ($request->has('location_name')) {
                $locationName = '%' . $this->escapeLike($request->query('location_name')) . '%';
                $query->whereHas('location', function ($q) use ($locationName) {
                    $q->where('name', 'LIKE', $locationName);
                });
            }
            if ($request->filled('location_id')) {
                $query->where('location_id', $request->query('location_id'));
            }

            $contacts = $query->orderByDesc('updated_at')
                ->get()
                ->map(function ($contact) {
                    return $this->formatContact($contact);
                });

            return response()->json([
                'emergency_contacts' => $contacts,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch emergency contacts',
                'details' => $e->getMessage(),
            ], 500);
        }
    }

    public function indexAdmin(Request $request)
    {
        try {
            $query = EmergencyContact::with(['social_element.user', 'location:id,name']);

            if ($request->filled('location_id')) {
                $query->where('location_id', $request->query('location_id'));
            }

            if ($request->filled('location_name')) {
                $locationName = '%' . $this->escapeLike($request->query('location_name')) . '%';
                $query->whereHas('location', function ($q) use ($locationName) {
                    $q->where('name', 'LIKE', $locationName);
                });
            }

            if ($request->filled('is_deactivated')) {
                $isDeactivated = filter_var($request->query('is_deactivated'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);

                if ($isDeactivated === null) {
                    return response()->json([
                        'error' => 'Invalid is_deactivated value. Use true or false.',
                    ], 422);
                }

                $query->whereHas('social_element', function ($q) use ($isDeactivated) {
                    if ($isDeactivated) {
                        $q->whereNotNull('deactivated_at');
                    } else {
                        $q->whereNull('deactivated_at');
                    }
                });
            }

            $contacts = $query->orderByDesc('updated_at')
                ->get()
                ->map(function ($contact) {
                    return $this->formatContact($contact);
                });

            return response()->json([
                'emergency_contacts' => $contacts,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch emergency contacts',
                'details' => $e->getMessage(),
            ], 500);
        }
    }

    public function show(int $id)
    {
        try {
            $contact = EmergencyContact::with(['social_element.user', 'location:id,name'])
                ->whereHas('social_element', function ($q) {
                    $q->whereNull('deactivated_at');
                })
                ->find($id);

            if (!$contact) {
                return response()->json([
                    'error' => 'Emergency contact not found',
                ], 404);
            }

            return response()->json([
                'emergency_contact' => $this->formatContact($contact),
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch emergency contact',
                'details' => $e->getMessage(),
            ], 500);
        }
    }

    public function getByLocationId(int $location_id)
    {
        try {
            $contacts = EmergencyContact::with(['social_element.user', 'location:id,name'])
                ->where('location_id', $location_id)
                ->whereHas('social_element', function ($q) {
                    $q->whereNull('deactivated_at');
                })
                ->orderByDesc('updated_at')
                ->get()
                ->map(function ($contact) {
                    return $this->formatContact($contact);
                });

            return response()->json([
                'emergency_contacts' => $contacts,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to fetch emergency contacts by location',
                'details' => $e->getMessage(),
            ], 500);
        }
    }

    public function store(Request $request)
    {
        try {
            $user = $request->attributes->get('firebase_user');

            $validated = $request->validate([
                'location_id' => 'required|integer|exists:Locations,id',
                'name' => 'required|string|max:255',
                'phone_number' => 'nullable|string|max:50',
                'mobile_number' => 'nullable|string|max:50',
                'address' => 'required|string|max:255',
            ]);

            DB::beginTransaction();

            $targetTable = TargetTable::where('table_name', 'EmergencyContacts')->first();

            if (!$targetTable) {
                DB::rollBack();

                return response()->json([
                    'error' => 'Target table entry for EmergencyContacts not found',
                ], 422);
            }

            $element = SocialElement::create([
                'user_id' => $user?->id ?? null,
                'posted_at' => now(),
                'type_id' => $targetTable->id,
                'has_media' => false,
            ]);

            $contact = EmergencyContact::create([
                'element_id' => $element->id,
                'location_id' => $validated['location_id'],
                'name' => $validated['name'],
                'phone_number' => $validated['phone_number'] ?? null,
                'mobile_number' => $validated['mobile_number'] ?? null,
                'address' => $validated['address'],
            ]);

            $contact->updated_at = now();
            $contact->save();

            DB::commit();

            $contact->load(['social_element.user', 'location:id,name']);

            return response()->json([
                'message' => 'Emergency contact created successfully',
                'emergency_contact' => $this->formatContact($contact, $user),
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'error' => 'Failed to create emergency contact',
                'details' => $e->getMessage(),
            ], 500);
        }
    }

    public function update(Request $request, int $id)
    {
        try {
            $validated = $request->validate([
                'location_id' => 'sometimes|integer|exists:Locations,id',
                'name' => 'sometimes|string|max:255',
                'phone_number' => 'sometimes|nullable|string|max:50',
                'mobile_number' => 'sometimes|nullable|string|max:50',
                'address' => 'sometimes|string|max:255',
            ]);

            if (empty($validated)) {
                return response()->json([
                    'message' => 'No valid fields provided for update.',
                ], 422);
            }

            $contact = EmergencyContact::with(['social_element.user', 'location:id,name'])
                ->whereHas('social_element', function ($q) {
                    $q->whereNull('deactivated_at');
                })
                ->find($id);

            if (!$contact) {
                return response()->json([
                    'error' => 'Emergency contact not found',
                ], 404);
            }

            $contact->fill($validated);
            $contact->updated_at = now();
            $contact->save();

            $contact->load(['social_element.user', 'location:id,name']);

            return response()->json([
                'message' => 'Emergency contact updated successfully',
                'emergency_contact' => $this->formatContact($contact),
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to update emergency contact',
                'details' => $e->getMessage(),
            ], 500);
        }
    }

    public function destroy(int $id)
    {
        try {
            $contact = EmergencyContact::with('social_element')
                ->whereHas('social_element', function ($q) {
                    $q->whereNull('deactivated_at');
                })
                ->find($id);

            if (!$contact) {
                return response()->json([
                    'error' => 'Emergency contact not found',
                ], 404);
            }

            if (!$contact->social_element) {
                return response()->json([
                    'error' => 'Emergency contact has no linked social element',
                ], 422);
            }

            $contact->social_element->deactivated_at = Carbon::now('UTC');
            $contact->social_element->save();

            return response()->json([
                'message' => 'Emergency contact deactivated successfully',
                'emergency_contact_id' => $contact->id,
                'deactivated_at' => $contact->social_element->deactivated_at
                    ? $contact->social_element->deactivated_at->timezone('Asia/Manila')->toDateTimeString()
                    : null,
                'is_deactivated' => $contact->social_element->deactivated_at !== null,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Failed to deactivate emergency contact',
                'details' => $e->getMessage(),
            ], 500);
        }
    }
        public function restore(int $id)
{
    try {
        $contact = EmergencyContact::with('social_element')->find($id);

        if (!$contact) {
            return response()->json([
                'error' => 'Emergency contact not found',
            ], 404);
        }

        if (!$contact->social_element) {
            return response()->json([
                'error' => 'Emergency contact has no linked social element',
            ], 422);
        }

        if ($contact->social_element->deactivated_at === null) {
            return response()->json([
                'message' => 'Emergency contact is already active',
                'emergency_contact' => $this->formatContact($contact->load('social_element.user')),
            ], 200);
        }

        $contact->social_element->deactivated_at = null;
        $contact->social_element->save();

        $contact->updated_at = now();
        $contact->save();

        $contact->load(['social_element.user', 'location:id,name']);

        return response()->json([
            'message' => 'Emergency contact restored successfully',
            'emergency_contact' => $this->formatContact($contact),
        ], 200);

    } catch (\Exception $e) {
        return response()->json([
            'error' => 'Failed to restore emergency contact',
            'details' => $e->getMessage(),
        ], 500);
    }
}

    private function formatContact(EmergencyContact $contact, $authenticatedUser = null): array
    {
        $user = $authenticatedUser ?? $contact->social_element?->user;
        return [
            'id' => $contact->id,
            'location_id' => $contact->location_id,
            'location_name' => $contact->location?->name,
            'name' => $contact->name,
            'address' => $contact->address,
            'phone_number' => $contact->phone_number,
            'mobile_number' => $contact->mobile_number,
            'last_updated' => $contact->updated_at
                ? $contact->updated_at->timezone('Asia/Manila')->format('M d, Y')
                : null,
            'posted_by' => $contact->social_element?->user?->role_id === 1
                ? 'Admin'
                : 'GovOp',
            'is_deactivated' => $contact->social_element?->deactivated_at !== null,
            'deactivated_at' => $contact->social_element?->deactivated_at
                ? $contact->social_element->deactivated_at->timezone('Asia/Manila')->toDateTimeString()
                : null,
        ];
    }

    private function escapeLike(string $value): string
    {
        return str_replace(['\\', '%', '_'], ['\\\\', '\\%', '\\_'], $value);
    }
}
