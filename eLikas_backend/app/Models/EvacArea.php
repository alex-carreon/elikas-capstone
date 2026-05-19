<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class EvacArea
 *
 * @property int $id
 * @property int $element_id
 * @property int $location_id
 * @property point $location
 * @property int $area_type
 * @property string $address
 * @property string|null $description
 * @property string $name
 * @property int $capacity_level
 * @property Carbon|null $last_updated
 * @property bool $is_persistent
 * @property int|null $verified_by
 * @property bool|null $for_reg_flood
 * @property bool|null $for_heavy_flood
 * @property bool|null $has_accom
 * @property int|null $toilet_count
 * @property int|null $kitchen_count
 * @property bool|null $has_DRRMO
 * @property bool|null $has_health
 * @property bool|null $pwd_friendly
 * @property bool|null $has_catchment
 * @property int|null $child_prayer_count
 * @property int|null $breastfeed_count
 * @property string|null $other_facilities
 * @property string|null $contact_person
 * @property string|null $contact_number
 * @property Carbon|null $expiry
 *
 * @property SocialElement $social_element
 * @property EvacType $evac_type
 * @property GovOp|null $gov_op
 *
 * @package App\Models
 */
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
