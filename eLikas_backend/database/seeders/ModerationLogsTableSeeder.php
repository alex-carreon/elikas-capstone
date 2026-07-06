<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class ModerationLogsTableSeeder extends Seeder
{

    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {
        

        \DB::table('ModerationLogs')->delete();
        
        
        
    }
}