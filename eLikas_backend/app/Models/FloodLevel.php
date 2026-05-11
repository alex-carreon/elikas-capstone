<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class FloodLevel
 * 
 * @property int $id
 * @property string $level_name
 * @property string|null $description
 * 
 * @property Collection|FloodPath[] $flood_paths
 *
 * @package App\Models
 */
class FloodLevel extends Model
{
	protected $table = 'FloodLevels';
	public $timestamps = false;

	protected $fillable = [
		'level_name',
		'description'
	];

	public function flood_paths()
	{
		return $this->hasMany(FloodPath::class, 'level_id');
	}
}
