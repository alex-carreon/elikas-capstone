<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class GovOpsTableSeeder extends Seeder
{

    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {
        

        \DB::table('GovOps')->delete();
        
        \DB::table('GovOps')->insert(array (
            0 => 
            array (
                'id' => 9,
                'user_id' => 122,
                'level_id' => 2,
                'location_id' => 8,
                'point_person' => 'Kurt Andrei',
                'point_position' => 'Developer Lead',
            ),
        ));
        
        
    }
}