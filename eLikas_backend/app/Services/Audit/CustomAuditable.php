<?php

namespace App\Services\Audit;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Database\Eloquent\Relations\MorphMany;
use Illuminate\Database\Eloquent\Relations\Pivot;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Arr;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\App;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Event;
use OwenIt\Auditing\Contracts\AttributeEncoder;
use OwenIt\Auditing\Contracts\AttributeRedactor;
use OwenIt\Auditing\Contracts\Auditable as ContractsAuditable;
use OwenIt\Auditing\Contracts\Resolver;
use OwenIt\Auditing\Events\AuditCustom;
use OwenIt\Auditing\Exceptions\AuditableTransitionException;
use OwenIt\Auditing\Exceptions\AuditingException;

// @phpstan-ignore trait.unused
trait CustomAuditable
{
    use \OwenIt\Auditing\Auditable {
        toAudit as baseToAudit;
    }

    /**
     * {@inheritdoc}
     */
    public function toAudit(): array
    {
        if (! $this->readyForAuditing()) {
            throw new AuditingException('A valid audit event has not been set');
        }

        $attributeGetter = $this->resolveAttributeGetter($this->auditEvent);

        if (! method_exists($this, $attributeGetter)) {
            throw new AuditingException(sprintf(
                'Unable to handle "%s" event, %s() method missing',
                $this->auditEvent,
                $attributeGetter
            ));
        }

        $this->resolveAuditExclusions();

        [$old, $new] = $this->$attributeGetter();

        if ($this->getAttributeModifiers() && ! $this->isCustomEvent) {
            foreach ($old as $attribute => $value) {
                $old[$attribute] = $this->modifyAttributeValue($attribute, $value);
            }

            foreach ($new as $attribute => $value) {
                $new[$attribute] = $this->modifyAttributeValue($attribute, $value);
            }
        }

        $morphPrefix = Config::get('audit.user.morph_prefix', 'user');

        $user = $this->resolveUser();

        return $this->transformAudit(array_merge([
            'old_values' => $old,
            'new_values' => $new,
            'event' => $this->auditEvent,
            'target_id' => $this->getKey(),
            $morphPrefix.'_id' => $user ? $user->getAuthIdentifier() : null,
            $morphPrefix.'_type' => $user ? $user->getMorphClass() : null,
        ], $this->runResolvers()));
    }
}
