<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class GovOp
 * 
 * @property int $id
 * @property int $user_id
 * @property int $level_id
 * @property int $location_id
 * @property string|null $point_person
 * @property string|null $point_position
 * 
 * @property User $user
 * @property LocationLevel $location_level
 * @property Location $location
 * @property Collection|EvacArea[] $evac_areas
 * @property Collection|SMSBroadcast[] $s_m_s_broadcasts
 * @property Collection|SMSTemplate[] $s_m_s_templates
 *
 * @package App\Models
 */
class GovOp extends Model
{
	protected $table = 'GovOps';
	public $timestamps = false;

	protected $casts = [
		'user_id' => 'int',
		'level_id' => 'int',
		'location_id' => 'int'
	];

	protected $fillable = [
		'user_id',
		'level_id',
		'location_id',
		'point_person',
		'point_position'
	];

	public function user()
	{
		return $this->belongsTo(User::class, 'user_id');
	}

	public function location_level()
	{
		return $this->belongsTo(LocationLevel::class, 'level_id');
	}

	public function location()
	{
		return $this->belongsTo(Location::class, 'location_id');
	}

	public function evac_areas()
	{
		return $this->hasMany(EvacArea::class, 'verified_by');
	}

	public function s_m_s_broadcasts()
	{
		return $this->hasMany(SMSBroadcast::class, 'sender_id');
	}

	public function s_m_s_templates()
	{
		return $this->hasMany(SMSTemplate::class, 'optr_id');
	}
}
