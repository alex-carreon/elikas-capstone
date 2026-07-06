<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class AdminsTableSeeder extends Seeder
{

    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {
        

        \DB::table('Admins')->delete();
        
        \DB::table('Admins')->insert(array (
            0 => 
            array (
                'id' => 3,
                'user_id' => 118,
            ),
            1 => 
            array (
                'id' => 4,
                'user_id' => 123,
            ),
        ));
        
        
    }
}