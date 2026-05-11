<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

/**
 * Class SMSTemplate
 * 
 * @property int $id
 * @property int $optr_id
 * @property string $template_name
 * @property string $message_content
 * @property Carbon $created_at
 * 
 * @property GovOp $gov_op
 *
 * @package App\Models
 */
class SMSTemplate extends Model
{
	protected $table = 'SMSTemplates';
	public $timestamps = false;

	protected $casts = [
		'optr_id' => 'int'
	];

	protected $fillable = [
		'optr_id',
		'template_name',
		'message_content'
	];

	public function gov_op()
	{
		return $this->belongsTo(GovOp::class, 'optr_id');
	}
}
