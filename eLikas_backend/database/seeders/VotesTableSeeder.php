<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class VotesTableSeeder extends Seeder
{

    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {
        

        \DB::table('Votes')->delete();
        
        
        
    }
}