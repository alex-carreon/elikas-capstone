<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class UsersTableSeeder extends Seeder
{

    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {
        

        \DB::table('Users')->delete();
        
        \DB::table('Users')->insert(array (
            0 => 
            array (
                'id' => 118,
                'username' => 'eLikas',
                'email' => 'elikasteam@gmail.com',
                'role_id' => 1,
                'created_at' => '2026-06-28 20:39:08',
                'deactivated_at' => NULL,
                'avatar_seed' => NULL,
            ),
            1 => 
            array (
                'id' => 121,
                'username' => 'Pest Testing',
                'email' => 'ruz2d.test@inbox.testmail.app',
                'role_id' => 3,
                'created_at' => '2026-06-30 01:19:56',
                'deactivated_at' => NULL,
                'avatar_seed' => 'ofrg9r1k',
            ),
            2 => 
            array (
                'id' => 122,
                'username' => 'Greenhills',
                'email' => 'ruz2d.greenhills@inbox.testmail.app',
                'role_id' => 2,
                'created_at' => '2026-06-29 23:52:24',
                'deactivated_at' => NULL,
                'avatar_seed' => NULL,
            ),
            3 => 
            array (
                'id' => 123,
                'username' => 'Kurt Admin',
                'email' => 'ruz2d.admin@inbox.testmail.app',
                'role_id' => 1,
                'created_at' => '2026-06-30 01:14:40',
                'deactivated_at' => NULL,
                'avatar_seed' => NULL,
            ),
        ));
        
        
    }
}