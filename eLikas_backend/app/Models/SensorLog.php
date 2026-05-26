<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

/**
 * Class SensorLog
 *
 * @property int $id
 * @property int $sensor_id
 * @property Carbon $sensor_timestamp
 * @property Carbon $log_time
 * @property float $distance
 * @property float $calculated_depth
 *
 * @property Sensor $sensor
 *
 * @package App\Models
 */
class SensorLog extends Model
{
	protected $table = 'SensorLogs';
	public $timestamps = false;

	protected $casts = [
		'sensor_id' => 'int',
		'sensor_timestamp' => 'datetime',
		'log_time' => 'datetime',
		'water_level' => 'float',
	];

	protected $fillable = [
		'sensor_id',
		'sensor_timestamp',
		'log_time',
		'water_level',
		'status_level'
	];

	public function sensor()
	{
		return $this->belongsTo(Sensor::class, 'sensor_id');
	}
}
