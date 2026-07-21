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

	private const DESCRIPTIONS = [
		'Small'  => 'Small (1-49 people)',
		'Medium' => 'Medium (50-99 people)',
		'Large'  => 'Large (100+ people)',
	];

	public static function describe(?string $rawLabel): ?string
	{
		return self::DESCRIPTIONS[$rawLabel] ?? $rawLabel;
	}

	public function evac_areas()
	{
		return $this->hasMany(EvacArea::class, 'capacity_level');
	}
}
