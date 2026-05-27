<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use MatanYadaev\EloquentSpatial\Objects\Point;
use MatanYadaev\EloquentSpatial\Traits\HasSpatial;

class EvacArea extends Model
{
    use HasSpatial;

    protected $table = 'EvacAreas';
    public $timestamps = false;

    protected $casts = [
        'element_id'         => 'int',
        'location_id'        => 'int',
        'location'           => Point::class,
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
        'location',              // ← added so Eloquent create() can set the Point
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
