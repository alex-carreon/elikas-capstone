<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class SensorLogsTableSeeder extends Seeder
{

    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {
        

        \DB::table('SensorLogs')->delete();
        
        
        
    }
}