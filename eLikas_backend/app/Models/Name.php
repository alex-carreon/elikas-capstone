<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Class Name
 * 
 * @property int $id
 * @property int $user_id
 * @property string $first_name
 * @property string $last_name
 * 
 * @property User $user
 *
 * @package App\Models
 */
class Name extends Model
{
	protected $table = 'Names';
	public $timestamps = false;

	protected $casts = [
		'user_id' => 'int'
	];

	protected $fillable = [
		'user_id',
		'first_name',
		'last_name'
	];

	public function user()
	{
		return $this->belongsTo(User::class, 'user_id');
	}
}
