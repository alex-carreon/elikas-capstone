<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

/**
 * Class Feedback
 * 
 * @property int $id
 * @property int $user_id
 * @property Carbon $sent_at
 * @property float $rating
 * @property string|null $message
 * 
 * @property User $user
 *
 * @package App\Models
 */
class Feedback extends Model
{
	protected $table = 'Feedback';
	public $timestamps = false;

	protected $casts = [
		'user_id' => 'int',
		'sent_at' => 'datetime',
		'rating' => 'float'
	];

	protected $fillable = [
		'user_id',
		'sent_at',
		'rating',
		'message'
	];

	public function user()
	{
		return $this->belongsTo(User::class, 'user_id');
	}
}
