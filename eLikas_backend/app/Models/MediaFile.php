<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

/**
 * Class MediaFile
 *
 * @property int $id
 * @property int $parent_id
 * @property int $user_id
 * @property string $file_path
 * @property string $file_type
 * @property Carbon $uploaded_at
 *
 * @property SocialElement $social_element
 * @property User $user
 *
 * @package App\Models
 */
class MediaFile extends Model
{
	protected $table = 'Media';
	public $timestamps = false;

	protected $casts = [
		'parent_id' => 'int',
		'user_id' => 'int',
		'uploaded_at' => 'datetime'
	];

	protected $fillable = [
		'parent_id',
		'user_id',
		'file_path',
		'file_type',
		'uploaded_at'
	];

	public function social_element()
	{
		return $this->belongsTo(SocialElement::class, 'parent_id');
	}

	public function user()
	{
		return $this->belongsTo(User::class, 'user_id');
	}
}
