<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

/**
 * Class SMSBroadcast
 * 
 * @property int $id
 * @property int $sender_id
 * @property int $location_id
 * @property string $message_content
 * @property int $status
 * @property Carbon $scheduled_for
 * @property Carbon|null $sent_at
 * @property int $total_recipients
 * 
 * @property GovOp $gov_op
 * @property Location $location
 * @property BroadcastStatus $broadcast_status
 *
 * @package App\Models
 */
class SMSBroadcast extends Model
{
	protected $table = 'SMSBroadcasts';
	public $timestamps = false;

	protected $casts = [
		'sender_id' => 'int',
		'location_id' => 'int',
		'status' => 'int',
		'scheduled_for' => 'datetime',
		'sent_at' => 'datetime',
		'total_recipients' => 'int'
	];

	protected $fillable = [
		'sender_id',
		'location_id',
		'message_content',
		'status',
		'scheduled_for',
		'sent_at',
		'total_recipients'
	];

	public function gov_op()
	{
		return $this->belongsTo(GovOp::class, 'sender_id');
	}

	public function location()
	{
		return $this->belongsTo(Location::class, 'location_id');
	}

	public function broadcast_status()
	{
		return $this->belongsTo(BroadcastStatus::class, 'status');
	}
}
