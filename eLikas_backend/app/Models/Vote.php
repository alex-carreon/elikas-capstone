<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Class Vote
 * 
 * @property int $id
 * @property int $user_id
 * @property int $element_id
 * @property int $vote
 * 
 * @property User $user
 * @property SocialElement $social_element
 *
 * @package App\Models
 */
class Vote extends Model
{
	protected $table = 'Votes';
	public $timestamps = false;

	protected $casts = [
		'user_id' => 'int',
		'element_id' => 'int',
		'vote' => 'int'
	];

	protected $fillable = [
		'user_id',
		'element_id',
		'vote'
	];

	public function user()
	{
		return $this->belongsTo(User::class, 'user_id');
	}

	public function social_element()
	{
		return $this->belongsTo(SocialElement::class, 'element_id');
	}
}
