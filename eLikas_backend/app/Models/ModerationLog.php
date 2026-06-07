<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

/**
 * Class ModerationLog
 * 
 * @property int $id
 * @property int $element_id
 * @property Carbon $created_at
 * @property bool|null $is_approved
 * @property int|null $reviewed_by
 * @property Carbon|null $reviewed_at
 * 
 * @property SocialElement $social_element
 * @property Admin|null $admin
 *
 * @package App\Models
 */
class ModerationLog extends Model
{
	protected $table = 'ModerationLogs';
	public $timestamps = false;

	protected $casts = [
		'element_id' => 'int',
		'is_approved' => 'bool',
		'reviewed_by' => 'int',
		'reviewed_at' => 'datetime'
	];

	protected $fillable = [
		'element_id',
		'is_approved',
		'reviewed_by',
		'reviewed_at'
	];

	public function socialElement()
	{
		return $this->belongsTo(SocialElement::class, 'element_id');
	}

	public function admin()
	{
		return $this->belongsTo(Admin::class, 'reviewed_by');
	}
}
