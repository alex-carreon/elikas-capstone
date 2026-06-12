<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use \OwenIt\Auditing\Contracts\Auditable;

/**
 * Class IndivAcc
 *
 * @property int $id
 * @property int $user_id
 * @property int|null $location_id
 *
 * @property User $user
 * @property Location|null $location
 *
 * @package App\Models
 */
class IndivAcc extends Model implements Auditable
{
    use \App\Services\Audit\CustomAuditable;

	protected $table = 'IndivAccs';
	public $timestamps = false;

	protected $casts = [
		'user_id' => 'int',
		'location_id' => 'int'
	];

	protected $fillable = [
		'user_id',
		'location_id'
	];

	public function user()
	{
		return $this->belongsTo(User::class, 'user_id');
	}

	public function location()
	{
		return $this->belongsTo(Location::class, 'location_id');
	}
}
