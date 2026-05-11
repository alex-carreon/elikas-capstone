<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Class PhoneNumber
 * 
 * @property int $id
 * @property int $user_id
 * @property string $phone_no
 * 
 * @property User $user
 *
 * @package App\Models
 */
class PhoneNumber extends Model
{
	protected $table = 'PhoneNumbers';
	public $timestamps = false;

	protected $casts = [
		'user_id' => 'int'
	];

	protected $fillable = [
		'user_id',
		'phone_no'
	];

	public function user()
	{
		return $this->belongsTo(User::class, 'user_id');
	}
}
