<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class UserAuthTableSeeder extends Seeder
{

    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {
        

        \DB::table('UserAuth')->delete();
        
        \DB::table('UserAuth')->insert(array (
            0 => 
            array (
                'id' => 121,
                'user_id' => 121,
                'identity_uid' => '4X073cxI5MUhiQHS4RjxkMOv2dj2',
            ),
            1 => 
            array (
                'id' => 122,
                'user_id' => 118,
                'identity_uid' => 'wLFl1bguyihmfmFI2EmyvDA2D4k1',
            ),
            2 => 
            array (
                'id' => 123,
                'user_id' => 122,
                'identity_uid' => 'uCka02BowHXUkyVfEFPd3KDyaB43',
            ),
            3 => 
            array (
                'id' => 124,
                'user_id' => 123,
                'identity_uid' => 'Dz1n9K8emzLpqD72kW0Tt7IsEHk1',
            ),
        ));
        
        
    }
}