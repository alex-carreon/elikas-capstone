<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

/**
 * Class TargetTable
 * 
 * @property int $id
 * @property string $table_name
 * 
 * @property Collection|AuditLog[] $audit_logs
 * @property Collection|SocialElement[] $social_elements
 *
 * @package App\Models
 */
class TargetTable extends Model
{
	protected $table = 'TargetTables';
	public $timestamps = false;

	protected $fillable = [
		'table_name'
	];

	public function audit_logs()
	{
		return $this->hasMany(AuditLog::class, 'target_type');
	}

	public function social_elements()
	{
		return $this->hasMany(SocialElement::class, 'type_id');
	}
}
