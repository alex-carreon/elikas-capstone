<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class SocialElement
 *
 * @property int $id
 * @property int|null $user_id
 * @property Carbon $posted_at
 * @property int $type_id
 * @property bool $has_media
 * @property Carbon|null $deactivated_at
 *
 * @property User|null $user
 * @property TargetTable $target_table
 * @property Collection|Comment[] $comments
 * @property Collection|EmergencyContact[] $emergency_contacts
 * @property Collection|EvacArea[] $evac_areas
 * @property Collection|Flag[] $flags
 * @property Collection|FloodPath[] $flood_paths
 * @property Collection|MediaFile[] $media
 * @property Collection|ModerationLog[] $moderation_logs
 * @property Collection|Sensor[] $sensors
 * @property Collection|Vote[] $votes
 *
 * @package App\Models
 */
class SocialElement extends Model
{
	protected $table = 'SocialElements';
	public $timestamps = false;

	protected $casts = [
		'user_id' => 'int',
		'posted_at' => 'datetime',
		'type_id' => 'int',
		'has_media' => 'bool',
		'deactivated_at' => 'datetime'
	];

	protected $fillable = [
		'user_id',
		'posted_at',
		'type_id',
		'has_media',
		'deactivated_at'
	];

	public function user()
	{
		return $this->belongsTo(User::class, 'user_id');
	}

	public function targetTable()
	{
		return $this->belongsTo(TargetTable::class, 'type_id');
	}

	// Gets the comment that OWNS this social element (the comment itself)
	public function comment()
	{
		return $this->hasOne(Comment::class, 'element_id');
	}

	// Gets comments that were posted UNDER this social element (e.g. evac area's comments)
	public function comments()
	{
		return $this->hasMany(Comment::class, 'parent_id');
	}

	public function emergencyContact()
	{
		return $this->hasMany(EmergencyContact::class, 'element_id');
	}

	public function evacArea()
	{
		return $this->hasMany(EvacArea::class, 'element_id');
	}

	public function flag()
	{
		return $this->hasMany(Flag::class, 'element_id');
	}

	//changed from hasMany
	public function floodPath()
	{
		return $this->hasOne(FloodPath::class, 'element_id');
	}

	public function media()
	{
		return $this->hasMany(MediaFile::class, 'parent_id');
	}

	public function moderationLog()
	{
		return $this->hasMany(ModerationLog::class, 'element_id');
	}

	public function sensor()
	{
		return $this->hasMany(Sensor::class, 'element_id');
	}

	public function vote()
	{
		return $this->hasMany(Vote::class, 'element_id');
	}
}
