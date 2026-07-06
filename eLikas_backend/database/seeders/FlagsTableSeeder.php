<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class FlagsTableSeeder extends Seeder
{

    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {
        

        \DB::table('Flags')->delete();
        
        
        
    }
}