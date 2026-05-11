<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class EvacType
 * 
 * @property int $id
 * @property string $evac_type
 * 
 * @property Collection|EvacArea[] $evac_areas
 *
 * @package App\Models
 */
class EvacType extends Model
{
	protected $table = 'EvacTypes';
	public $timestamps = false;

	protected $fillable = [
		'evac_type'
	];

	public function evac_areas()
	{
		return $this->hasMany(EvacArea::class, 'area_type');
	}
}
