<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class BroadcastStatus
 * 
 * @property int $id
 * @property string $status_name
 * 
 * @property Collection|SMSBroadcast[] $s_m_s_broadcasts
 *
 * @package App\Models
 */
class BroadcastStatus extends Model
{
	protected $table = 'BroadcastStatus';
	public $timestamps = false;

	protected $fillable = [
		'status_name'
	];

	public function s_m_s_broadcasts()
	{
		return $this->hasMany(SMSBroadcast::class, 'status');
	}
}
