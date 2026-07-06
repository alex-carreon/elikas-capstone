<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class FloodLevelsTableSeeder extends Seeder
{

    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {
        

        \DB::table('FloodLevels')->delete();
        
        \DB::table('FloodLevels')->insert(array (
            0 => 
            array (
                'id' => 8,
                'level_name' => 'Gutter',
                'description' => 'Passable to all types of vehicles',
            ),
            1 => 
            array (
                'id' => 9,
                'level_name' => 'Half Knee',
                'description' => 'Passable to all types of vehicles',
            ),
            2 => 
            array (
                'id' => 10,
                'level_name' => 'Half Tire',
                'description' => 'Not passable to light vehicles',
            ),
            3 => 
            array (
                'id' => 11,
                'level_name' => 'Knee',
                'description' => 'Not passable to light vehicles',
            ),
            4 => 
            array (
                'id' => 12,
                'level_name' => 'Tire',
                'description' => 'Not passable to all types of vehicles',
            ),
            5 => 
            array (
                'id' => 13,
                'level_name' => 'Waist',
                'description' => 'Not passable to all types of vehicles',
            ),
            6 => 
            array (
                'id' => 14,
                'level_name' => 'Chest',
                'description' => 'Not passable to all types of vehicles',
            ),
        ));
        
        
    }
}