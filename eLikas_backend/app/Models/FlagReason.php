<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class FlagReason
 * 
 * @property int $id
 * @property string $reason_label
 * 
 * @property Collection|Flag[] $flags
 *
 * @package App\Models
 */
class FlagReason extends Model
{
	protected $table = 'FlagReasons';
	public $timestamps = false;

	protected $fillable = [
		'reason_label'
	];

	public function flags()
	{
		return $this->hasMany(Flag::class, 'reason_id');
	}
}
