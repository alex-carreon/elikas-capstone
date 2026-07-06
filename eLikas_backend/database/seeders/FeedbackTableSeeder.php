<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class FeedbackTableSeeder extends Seeder
{

    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {
        

        \DB::table('Feedback')->delete();
        
        
        
    }
}