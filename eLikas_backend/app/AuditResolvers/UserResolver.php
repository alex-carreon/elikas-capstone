<?php

namespace App\AuditResolvers;

class UserResolver implements \OwenIt\Auditing\Contracts\UserResolver
{
    public static function resolve()
    {
        $user = request()->attributes->get('firebase_user');
        return $user ? $user : null;
    }
}
