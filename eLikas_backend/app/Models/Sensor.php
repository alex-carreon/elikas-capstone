<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use MatanYadaev\EloquentSpatial\Objects\Point;
use MatanYadaev\EloquentSpatial\Traits\HasSpatial;
use \OwenIt\Auditing\Contracts\Auditable;

/**
 * Class Sensor
 *
 * @property int $id
 * @property int $element_id
 * @property string $sensor_code
 * @property float $depth
 * @property string $name
 * @property point $location
 * @property string $addressa
 * @property Carbon|null $last_online
 *
 * @property SocialElement $social_element
 * @property Collection|SensorLog[] $sensor_logs
 *
 * @package App\Models
 */
class Sensor extends Model implements Auditable
{
    use HasSpatial;
    use \App\Services\Audit\CustomAuditable;

	protected $table = 'Sensors';
	public $timestamps = false;

	protected $casts = [
		'element_id' => 'int',
        'location_id' => 'int',
		'mount_height' => 'float',
		'location' => Point::class,
		'last_online' => 'datetime',
        'yellow_level' => 'float',
        'red_level' => 'float',
        'orange_level' => 'float',
	];

	protected $fillable = [
        'element_id',
		'mount_height',
		'name',
		'location',
		'address',
        'yellow_level',
        'red_level',
        'orange_level',
        'location_id'
	];

    protected $auditExclude = [
        'auditable_type',
        'auditable_id'
    ];

	public function social_element()
	{
		return $this->belongsTo(SocialElement::class, 'element_id');
	}

	public function sensor_logs()
	{
		return $this->hasMany(SensorLog::class, 'sensor_code', 'sensor_code')
            ->orderBy('sensor_timestamp', 'desc');
	}

    public function latest_log()
    {
        return $this->hasOne(SensorLog::class, 'sensor_code', 'sensor_code')->latestOfMany();
    }

    public function mount_location()
    {
        return $this->belongsTo(Location::class, 'location_id');
    }
}
