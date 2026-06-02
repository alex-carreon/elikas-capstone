<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;

/**
 * Class EmergencyContact
 *
 * @property int $id
 * @property int $element_id
 * @property int $location_id
 * @property string $name
 * @property string|null $phone_number
 * @property string|null $mobile_number
 * @property string $address
 * @property Carbon $updated_at
 *
 * @property SocialElement $social_element
 * @property Location $location
 *
 * @package App\Models
 */
class EmergencyContact extends Model
{
	protected $table = 'EmergencyContacts';
	public $timestamps = false;

	protected $casts = [
		'element_id' => 'int',
		'location_id' => 'int',
        'updated_at' => 'datetime'
	];

	protected $fillable = [
		'element_id',
		'location_id',
		'name',
		'phone_number',
		'mobile_number',
		'address'
	];

	public function social_element()
	{
		return $this->belongsTo(SocialElement::class, 'element_id');
	}

	public function location()
	{
		return $this->belongsTo(Location::class, 'location_id');
	}
}
