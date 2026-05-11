<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

/**
 * Class FloodPath
 * 
 * @property int $id
 * @property int $element_id
 * @property int $level_id
 * @property Carbon $last_confirmed
 * @property linestring $path
 * @property string|null $description
 * @property int $upvotes
 * @property int $downvotes
 * @property Carbon $expiry
 * 
 * @property SocialElement $social_element
 * @property FloodLevel $flood_level
 *
 * @package App\Models
 */
class FloodPath extends Model
{
	protected $table = 'FloodPaths';
	public $timestamps = false;

	protected $casts = [
		'element_id' => 'int',
		'level_id' => 'int',
		'last_confirmed' => 'datetime',
		'path' => 'linestring',
		'upvotes' => 'int',
		'downvotes' => 'int',
		'expiry' => 'datetime'
	];

	protected $fillable = [
		'element_id',
		'level_id',
		'last_confirmed',
		'path',
		'description',
		'upvotes',
		'downvotes',
		'expiry'
	];

	public function social_element()
	{
		return $this->belongsTo(SocialElement::class, 'element_id');
	}

	public function flood_level()
	{
		return $this->belongsTo(FloodLevel::class, 'level_id');
	}
}
