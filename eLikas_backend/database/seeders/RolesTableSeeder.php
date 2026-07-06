<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class RolesTableSeeder extends Seeder
{

    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {
        

        \DB::table('Roles')->delete();
        
        \DB::table('Roles')->insert(array (
            0 => 
            array (
                'id' => 1,
                'role_name' => 'admin',
            ),
            1 => 
            array (
                'id' => 2,
                'role_name' => 'brgy_op',
            ),
            2 => 
            array (
                'id' => 3,
                'role_name' => 'indiv',
            ),
        ));
        
        
    }
}