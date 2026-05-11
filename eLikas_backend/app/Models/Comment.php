<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

/**
 * Class Comment
 * 
 * @property int $id
 * @property int $element_id
 * @property int $parent_id
 * @property string|null $content
 * @property int $upvotes
 * @property int $downvotes
 * 
 * @property SocialElement $social_element
 *
 * @package App\Models
 */
class Comment extends Model
{
	protected $table = 'Comments';
	public $timestamps = false;

	protected $casts = [
		'element_id' => 'int',
		'parent_id' => 'int',
		'upvotes' => 'int',
		'downvotes' => 'int'
	];

	protected $fillable = [
		'element_id',
		'parent_id',
		'content',
		'upvotes',
		'downvotes'
	];

	public function social_element()
	{
		return $this->belongsTo(SocialElement::class, 'parent_id');
	}
}
