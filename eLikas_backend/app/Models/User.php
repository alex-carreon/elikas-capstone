<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class User
 *
 * @property int $id
 * @property string $username
 * @property string $email
 * @property int $role_id
 * @property string|null $avatar_seed

 * @property Carbon $created_at
 * @property Carbon|null $deactivated_at
 *
 * @property Role $role
 * @property Collection|Admin[] $admins
 * @property Collection|AuditLog[] $audit_logs
 * @property Collection|Feedback[] $feedback
 * @property Collection|Flag[] $flags
 * @property Collection|GovOp[] $gov_ops
 * @property Collection|IndivAcc[] $indiv_accs
 * @property Collection|MediaFile[] $media
 * @property Collection|Name[] $names
 * @property Collection|PhoneNumber[] $phone_numbers
 * @property Collection|SocialElement[] $social_elements
 * @property Collection|UserAuth[] $user_auths
 * @property Collection|Vote[] $votes
 *
 * @package App\Models
 */
class User extends Model
{
	protected $table = 'Users';
	public $timestamps = false;

	protected $casts = [
		'role_id' => 'int',
		'created_at' => 'datetime',
		'deactivated_at' => 'datetime'
	];

	protected $fillable = [
		'username',
		'email',
		'role_id',
		'avatar_seed',
		'deactivated_at'
	];

	public function role()
	{
		return $this->belongsTo(Role::class, 'role_id');
	}

	public function admin()
	{
		return $this->hasMany(Admin::class, 'user_id');
	}

	public function auditLog()
	{
		return $this->hasMany(AuditLog::class, 'executor_id');
	}

	public function feedback()
	{
		return $this->hasMany(Feedback::class, 'user_id');
	}

	public function flag()
	{
		return $this->hasMany(Flag::class, 'user_id');
	}

	public function govOp()
	{
		return $this->hasOne(GovOp::class, 'user_id');
	}

	public function indivAcc()
	{
		return $this->hasOne(IndivAcc::class, 'user_id');
	}

	public function media()
	{
		return $this->hasMany(MediaFile::class, 'user_id');
	}

	public function name()
	{
		return $this->hasOne(Name::class, 'user_id');
	}

	public function phoneNumber()
	{
		return $this->hasOne(PhoneNumber::class, 'user_id');
	}

	public function socialElement()
	{
		return $this->hasMany(SocialElement::class, 'user_id');
	}

	public function userAuth()
	{
		return $this->hasOne(UserAuth::class, 'user_id');
	}

	public function vote()
	{
		return $this->hasMany(Vote::class, 'user_id');
	}
}
