<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class CapacityLevelsTableSeeder extends Seeder
{

    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {
        

        \DB::table('CapacityLevels')->delete();
        
        \DB::table('CapacityLevels')->insert(array (
            0 => 
            array (
                'id' => 4,
                'capacity_level' => 'Full',
            ),
            1 => 
            array (
                'id' => 1,
                'capacity_level' => 'Large',
            ),
            2 => 
            array (
                'id' => 2,
                'capacity_level' => 'Medium',
            ),
            3 => 
            array (
                'id' => 3,
                'capacity_level' => 'Small',
            ),
        ));
        
        
    }
}