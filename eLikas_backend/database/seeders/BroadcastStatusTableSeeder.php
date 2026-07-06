<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class BroadcastStatusTableSeeder extends Seeder
{

    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {
        

        \DB::table('BroadcastStatus')->delete();
        
        \DB::table('BroadcastStatus')->insert(array (
            0 => 
            array (
                'id' => 3,
                'status_name' => 'Cancelled',
            ),
            1 => 
            array (
                'id' => 4,
                'status_name' => 'Failed',
            ),
            2 => 
            array (
                'id' => 1,
                'status_name' => 'Scheduled',
            ),
            3 => 
            array (
                'id' => 2,
                'status_name' => 'Sent',
            ),
        ));
        
        
    }
}