<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class LocationLevelsTableSeeder extends Seeder
{

    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {
        

        \DB::table('LocationLevels')->delete();
        
        \DB::table('LocationLevels')->insert(array (
            0 => 
            array (
                'id' => 3,
                'level_name' => 'Barangay',
            ),
            1 => 
            array (
                'id' => 2,
                'level_name' => 'City',
            ),
            2 => 
            array (
                'id' => 1,
                'level_name' => 'Region',
            ),
        ));
        
        
    }
}