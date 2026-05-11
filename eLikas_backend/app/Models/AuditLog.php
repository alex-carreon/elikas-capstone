<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

/**
 * Class AuditLog
 * 
 * @property int $id
 * @property string $log_id
 * @property int $executor_id
 * @property int $action
 * @property int $target_type
 * @property int $target_id
 * @property string|null $old_value
 * @property string|null $new_value
 * @property Carbon $created_at
 * 
 * @property User $user
 * @property AuditAction $audit_action
 * @property TargetTable $target_table
 *
 * @package App\Models
 */
class AuditLog extends Model
{
	protected $table = 'AuditLogs';
	public $timestamps = false;

	protected $casts = [
		'executor_id' => 'int',
		'action' => 'int',
		'target_type' => 'int',
		'target_id' => 'int'
	];

	protected $fillable = [
		'log_id',
		'executor_id',
		'action',
		'target_type',
		'target_id',
		'old_value',
		'new_value'
	];

	public function user()
	{
		return $this->belongsTo(User::class, 'executor_id');
	}

	public function audit_action()
	{
		return $this->belongsTo(AuditAction::class, 'action');
	}

	public function target_table()
	{
		return $this->belongsTo(TargetTable::class, 'target_type');
	}
}
