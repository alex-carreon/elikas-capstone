<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class Admin
 * 
 * @property int $id
 * @property int $user_id
 * 
 * @property User $user
 * @property Collection|Flag[] $flags
 * @property Collection|ModerationLog[] $moderation_logs
 *
 * @package App\Models
 */
class Admin extends Model
{
	protected $table = 'Admins';
	public $timestamps = false;

	protected $casts = [
		'user_id' => 'int'
	];

	protected $fillable = [
		'user_id'
	];

	public function user()
	{
		return $this->belongsTo(User::class, 'user_id');
	}

	public function flags()
	{
		return $this->hasMany(Flag::class, 'reviewed_by');
	}

	public function moderation_logs()
	{
		return $this->hasMany(ModerationLog::class, 'reviewed_by');
	}
}
