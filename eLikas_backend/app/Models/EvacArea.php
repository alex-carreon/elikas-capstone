<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class EvacArea extends Model
{
    protected $table = 'EvacAreas';
    public $timestamps = false;

    protected $casts = [
        'element_id'         => 'int',
        'location_id'        => 'int',
        'area_type'          => 'int',
        'capacity_level'     => 'int',
        'last_updated'       => 'datetime',
        'is_persistent'      => 'bool',
        'verified_by'        => 'int',
        'for_reg_flood'      => 'bool',
        'for_heavy_flood'    => 'bool',
        'has_accom'          => 'bool',
        'toilet_count'       => 'int',
        'kitchen_count'      => 'int',
        'has_DRRMO'          => 'bool',
        'has_health'         => 'bool',
        'pwd_friendly'       => 'bool',
        'has_catchment'      => 'bool',
        'child_prayer_count' => 'int',
        'breastfeed_count'   => 'int',
        'expiry'             => 'datetime',
    ];

    protected $fillable = [
        'element_id',
        'location_id',
        'area_type',
        'address',
        'description',
        'name',
        'capacity_level',
        'last_updated',
        'is_persistent',
        'verified_by',
        'for_reg_flood',
        'for_heavy_flood',
        'has_accom',
        'toilet_count',
        'kitchen_count',
        'has_DRRMO',
        'has_health',
        'pwd_friendly',
        'has_catchment',
        'child_prayer_count',
        'breastfeed_count',
        'other_facilities',
        'contact_person',
        'contact_number',
        'expiry',
    ];

    public function getLatAttribute(): ?float
    {
        if (array_key_exists('lat', $this->attributes)) {
            return $this->attributes['lat'] !== null ? (float) $this->attributes['lat'] : null;
        }

        $row = DB::select('SELECT ST_Y(location) as lat FROM EvacAreas WHERE id = ?', [$this->id]);
        return isset($row[0]) ? (float) $row[0]->lat : null;
    }

    public function getLngAttribute(): ?float
    {
        if (array_key_exists('lng', $this->attributes)) {
            return $this->attributes['lng'] !== null ? (float) $this->attributes['lng'] : null;
        }

        $row = DB::select('SELECT ST_X(location) as lng FROM EvacAreas WHERE id = ?', [$this->id]);
        return isset($row[0]) ? (float) $row[0]->lng : null;
    }

    public function getIsExpiredAttribute(): bool
    {
        return $this->expiry !== null && $this->expiry->lte(now());
    }

    public function scopeActive(Builder $query): Builder
    {
        return $query->whereHas('social_element', function (Builder $q) {
            $q->whereNull('deactivated_at');
        });
    }

    public function scopeFilter(Builder $query, Request $request): Builder
    {
        $bool = fn (string $key) => $request->has($key)
            ? filter_var($request->query($key), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE)
            : null;

        $active = $bool('active');
        if ($active === true) {
            $now = now();
            $query->where(fn (Builder $q) => $q->whereNull('expiry')->orWhere('expiry', '>', $now));
        } elseif ($active === false) {
            $query->whereNotNull('expiry')->where('expiry', '<=', now());
        }

        if ($request->filled('location_id'))    $query->where('location_id',    (int) $request->query('location_id'));
        if ($request->filled('area_type'))      $query->where('area_type',      (int) $request->query('area_type'));
        if ($request->filled('capacity_level')) $query->where('capacity_level', (int) $request->query('capacity_level'));

        foreach ([
            'is_persistent', 'for_reg_flood', 'for_heavy_flood',
            'has_accom', 'has_DRRMO', 'has_health', 'pwd_friendly', 'has_catchment',
        ] as $col) {
            $val = $bool($col);
            if ($val !== null) $query->where($col, $val);
        }

        $verified = $bool('verified');
        if ($verified === true)       $query->whereNotNull('verified_by');
        elseif ($verified === false)  $query->whereNull('verified_by');

        return $query;
    }

    public function scopeSelectLatLng(Builder $query): Builder
    {
        return $query->addSelect([
            DB::raw('ST_Y(location) as lat'),
            DB::raw('ST_X(location) as lng'),
        ]);
    }

    public function scopeDistanceFrom(Builder $query, float $lat, float $lng): Builder
    {
        $origin = "ST_GeomFromText('POINT({$lng} {$lat})')";

        return $query->addSelect(DB::raw("ST_Distance_Sphere(location, {$origin}) as distance_meters"));
    }

    public function scopeWithinRadius(Builder $query, int $radius): Builder
    {
        return $query->having('distance_meters', '<=', $radius)
            ->orderBy('distance_meters');
    }

    public function social_element()
    {
        return $this->belongsTo(SocialElement::class, 'element_id');
    }

    public function location_info()
    {
        return $this->belongsTo(Location::class, 'location_id');
    }

    public function evac_type()
    {
        return $this->belongsTo(EvacType::class, 'area_type');
    }

    public function capacity_level_info()
    {
        return $this->belongsTo(CapacityLevel::class, 'capacity_level');
    }

    public function gov_op()
    {
        return $this->belongsTo(GovOp::class, 'verified_by');
    }
}
