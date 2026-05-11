<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class CapacityLevel
 * 
 * @property int $id
 * @property string $capacity_level
 * 
 * @property Collection|EvacArea[] $evac_areas
 *
 * @package App\Models
 */
class CapacityLevel extends Model
{
	protected $table = 'CapacityLevels';
	public $timestamps = false;

	protected $fillable = [
		'capacity_level'
	];

	public function evac_areas()
	{
		return $this->hasMany(EvacArea::class, 'capacity_level');
	}
}
