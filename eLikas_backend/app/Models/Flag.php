<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

/**
 * Class Flag
 * 
 * @property int $id
 * @property int $user_id
 * @property int $element_id
 * @property int $reason_id
 * @property Carbon $flagged_at
 * @property bool|null $is_approved
 * @property int|null $reviewed_by
 * @property Carbon|null $reviewed_at
 * 
 * @property User $user
 * @property SocialElement $social_element
 * @property FlagReason $flag_reason
 * @property Admin|null $admin
 *
 * @package App\Models
 */
class Flag extends Model
{
	protected $table = 'Flags';
	public $timestamps = false;

	protected $casts = [
		'user_id' => 'int',
		'element_id' => 'int',
		'reason_id' => 'int',
		'flagged_at' => 'datetime',
		'is_approved' => 'bool',
		'reviewed_by' => 'int',
		'reviewed_at' => 'datetime'
	];

	protected $fillable = [
		'user_id',
		'element_id',
		'reason_id',
		'flagged_at',
		'is_approved',
		'reviewed_by',
		'reviewed_at'
	];

	public function user()
	{
		return $this->belongsTo(User::class, 'user_id');
	}

	public function social_element()
	{
		return $this->belongsTo(SocialElement::class, 'element_id');
	}

	public function flag_reason()
	{
		return $this->belongsTo(FlagReason::class, 'reason_id');
	}

	public function admin()
	{
		return $this->belongsTo(Admin::class, 'reviewed_by');
	}
}
