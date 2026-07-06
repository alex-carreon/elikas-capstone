<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class FlagReasonsTableSeeder extends Seeder
{

    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {
        

        \DB::table('FlagReasons')->delete();
        
        \DB::table('FlagReasons')->insert(array (
            0 => 
            array (
                'id' => 8,
                'reason_label' => 'Dangerous/Misleading',
            ),
            1 => 
            array (
                'id' => 5,
                'reason_label' => 'False Information',
            ),
            2 => 
            array (
                'id' => 7,
                'reason_label' => 'Offensive Language',
            ),
            3 => 
            array (
                'id' => 6,
                'reason_label' => 'Spam/Irrelevant',
            ),
        ));
        
        
    }
}