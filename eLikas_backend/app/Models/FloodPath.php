<?php

/**
 * Created by Reliese Model.
 */

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use MatanYadaev\EloquentSpatial\Objects\LineString;
use MatanYadaev\EloquentSpatial\Traits\HasSpatial;
use Illuminate\Database\Eloquent\Builder;

/**
 * Class FloodPath
 *
 * @property int $id
 * @property int $element_id
 * @property int $level_id
 * @property Carbon $last_confirmed
 * @property LineString $path
 * @property string|null $description
 * @property int $upvotes
 * @property int $downvotes
 * @property Carbon $expiry
 *
 * @property SocialElement $social_element
 * @property FloodLevel $flood_level
 *
 * @package App\Models
 */
class FloodPath extends Model
{
	use HasSpatial;

    protected $table = 'FloodPaths';
    public $timestamps = false;

    protected $casts = [
        'element_id'     => 'int',
        'level_id'       => 'int',
        'last_confirmed' => 'datetime',
        'path'           => LineString::class,
        'upvotes'        => 'int',
        'downvotes'      => 'int',
        'expiry'         => 'datetime',
        'reminder_sent_at' => 'datetime',
        'dismissed_at'     => 'datetime',
    ];

    protected $fillable = [
        'element_id',
        'level_id',
        'last_confirmed',
        'path',
        'description',
        'upvotes',
        'downvotes',
        'expiry',
        'reminder_sent_at',
        'dismissed_at',
    ];

    public function socialElement()
    {
        return $this->belongsTo(SocialElement::class, 'element_id');
    }

    public function floodLevel()
    {
        return $this->belongsTo(FloodLevel::class, 'level_id');
    }

	//NOT EXPIRED
	public function scopeNotExpired(Builder $query): Builder
	{
		return $query->where('expiry', '>', now());
	}

	//NOT DEACTIVATED
	public function scopeNotDeactivated(Builder $query): Builder
	{
		return $query->whereHas('socialElement', fn ($q) =>
			$q->whereNull('deactivated_at')
		);
	}

	//OWNED BY USER
	public function scopeOwnedBy(Builder $query, int $userId): Builder
	{
		return $query->whereHas('socialElement', fn ($q) =>
			$q->where('user_id', $userId)
		);
	}
}