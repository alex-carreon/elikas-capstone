<?php

namespace App\AuditResolvers;

use OwenIt\Auditing\Contracts\Auditable;
use OwenIt\Auditing\Contracts\Resolver;

class UserResolver implements \OwenIt\Auditing\Contracts\UserResolver
{
    public static function resolve()
    {
        $user = request()->attributes->get('firebase_user');
        return $user ? $user : null;
    }
}
