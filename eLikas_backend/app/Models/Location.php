<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class Location
 *
 * @property int $id
 * @property string $name
 * @property int $level_id
 * @property int|null $parent_id
 *
 * @property LocationLevel $location_level
 * @property Location|null $location
 * @property Collection|EmergencyContact[] $emergency_contacts
 * @property Collection|EvacArea[] $evac_areas
 * @property Collection|GovOp[] $gov_ops
 * @property Collection|IndivAcc[] $indiv_accs
 * @property Collection|Location[] $locations
 * @property Collection|SMSBroadcast[] $s_m_s_broadcasts
 *
 * @package App\Models
 */
class Location extends Model
{
	protected $table = 'Locations';
	public $timestamps = false;

	protected $casts = [
		'level_id' => 'int',
		'parent_id' => 'int'
	];

	protected $fillable = [
		'name',
		'level_id',
		'parent_id'
	];

	public function locationLevel()
	{
		return $this->belongsTo(LocationLevel::class, 'level_id');
	}

	 // Parent location
	public function parentLocation()
	{
		return $this->belongsTo(Location::class, 'parent_id');
	}

	// Child locations
	public function childLocation()
	{
		return $this->hasMany(Location::class, 'parent_id');
	}

	// public function fullLocation()
	// {
	// 	$parts = [];
	// 	$current = $this;

	// 	while ($current) {
	// 		$parts[] = $current->name;
	// 		$current = $current->parentLocation;
	// 	}

	// 	return implode(', ', $parts);
	// }

	public function getFullLocationAttribute()
	{
		$parts = [];
		$current = $this;

		while ($current) {
			$parts[] = $current->name;
			$current = $current->parentLocation;
		}

		return implode(', ', $parts);
	}

	public function getCityLocationAttribute()
	{
		$parts = [];
		$current = $this;

		while ($current) {

			// Skip barangay level
			if ($current->locationLevel?->level_name !== 'Barangay') {
				$parts[] = $current->name;
			}

			$current = $current->parentLocation;
		}

		return implode(', ', $parts);
	}

	public function emergencyContact()
	{
		return $this->hasMany(EmergencyContact::class, 'location_id', 'id');
	}

	public function evacArea()
	{
		return $this->hasMany(EvacArea::class, 'location_id');
	}

	public function govOp()
	{
		return $this->hasMany(GovOp::class, 'location_id');
	}

	public function indivAcc()
	{
		return $this->hasMany(IndivAcc::class, 'location_id');
	}

	public function smsBroadcast()
	{
		return $this->hasMany(SMSBroadcast::class, 'location_id', 'id');
	}
}
