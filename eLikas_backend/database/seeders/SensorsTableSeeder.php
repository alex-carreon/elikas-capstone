<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class SensorsTableSeeder extends Seeder
{

    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {
        

        \DB::table('Sensors')->delete();
        
        
        
    }
}