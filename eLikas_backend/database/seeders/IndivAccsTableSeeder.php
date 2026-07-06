<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class IndivAccsTableSeeder extends Seeder
{

    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {
        

        \DB::table('IndivAccs')->delete();
        
        \DB::table('IndivAccs')->insert(array (
            0 => 
            array (
                'id' => 109,
                'user_id' => 121,
                'location_id' => 25,
            ),
        ));
        
        
    }
}