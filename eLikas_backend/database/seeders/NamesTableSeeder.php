<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class NamesTableSeeder extends Seeder
{

    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {
        

        \DB::table('Names')->delete();
        
        \DB::table('Names')->insert(array (
            0 => 
            array (
                'id' => 110,
                'user_id' => 121,
                'first_name' => 'Pest',
                'last_name' => 'Testing',
            ),
        ));
        
        
    }
}