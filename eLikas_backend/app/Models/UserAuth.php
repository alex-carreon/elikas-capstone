<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Class UserAuth
 * 
 * @property int $id
 * @property int $user_id
 * @property string $identity_uid
 * 
 * @property User $user
 *
 * @package App\Models
 */
class UserAuth extends Model
{
	protected $table = 'UserAuth';
	public $timestamps = false;

	protected $casts = [
		'user_id' => 'int'
	];

	protected $fillable = [
		'user_id',
		'identity_uid'
	];

	public function user()
	{
		return $this->belongsTo(User::class, 'user_id');
	}
}
