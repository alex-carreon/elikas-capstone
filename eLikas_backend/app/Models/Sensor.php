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

/**
 * Class Sensor
 *
 * @property int $id
 * @property int $element_id
 * @property string $sensor_code
 * @property float $depth
 * @property string $name
 * @property point $location
 * @property string $address
 * @property Carbon|null $last_online
 *
 * @property SocialElement $social_element
 * @property Collection|SensorLog[] $sensor_logs
 *
 * @package App\Models
 */
class Sensor extends Model
{
    use HasSpatial;

	protected $table = 'Sensors';
	public $timestamps = false;

	protected $casts = [
		'element_id' => 'int',
		'mount_height' => 'float',
		'location' => Point::class,
		'last_online' => 'datetime',
        'yellow_level' => 'float',
        'red_level' => 'float'
	];

	protected $fillable = [
		'element_id',
		'sensor_code',
		'mount_height',
		'name',
		'location',
		'address',
		'last_online',
        'yellow_level',
        'red_level',
        'current_status'
	];

	public function social_element()
	{
		return $this->belongsTo(SocialElement::class, 'element_id');
	}

	public function sensor_logs()
	{
		return $this->hasMany(SensorLog::class, 'sensor_id');
	}
}
