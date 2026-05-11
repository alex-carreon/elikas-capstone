<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class LocationLevel
 * 
 * @property int $id
 * @property string $level_name
 * 
 * @property Collection|GovOp[] $gov_ops
 * @property Collection|Location[] $locations
 *
 * @package App\Models
 */
class LocationLevel extends Model
{
	protected $table = 'LocationLevels';
	public $timestamps = false;

	protected $fillable = [
		'level_name'
	];

	public function govOp()
	{
		return $this->hasMany(GovOp::class, 'level_id');
	}

	public function location()
	{
		return $this->hasMany(Location::class, 'level_id');
	}
}
