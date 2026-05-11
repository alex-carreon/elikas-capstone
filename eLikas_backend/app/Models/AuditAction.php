<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class AuditAction
 * 
 * @property int $id
 * @property string $action_name
 * 
 * @property Collection|AuditLog[] $audit_logs
 *
 * @package App\Models
 */
class AuditAction extends Model
{
	protected $table = 'AuditActions';
	public $timestamps = false;

	protected $fillable = [
		'action_name'
	];

	public function audit_logs()
	{
		return $this->hasMany(AuditLog::class, 'action');
	}
}
