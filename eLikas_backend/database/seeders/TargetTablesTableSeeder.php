<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class TargetTablesTableSeeder extends Seeder
{

    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {
        

        \DB::table('TargetTables')->delete();
        
        \DB::table('TargetTables')->insert(array (
            0 => 
            array (
                'id' => 3,
                'table_name' => 'Comments',
            ),
            1 => 
            array (
                'id' => 5,
                'table_name' => 'EmergencyContacts',
            ),
            2 => 
            array (
                'id' => 1,
                'table_name' => 'EvacAreas',
            ),
            3 => 
            array (
                'id' => 2,
                'table_name' => 'FloodPaths',
            ),
            4 => 
            array (
                'id' => 8,
                'table_name' => 'GovOps',
            ),
            5 => 
            array (
                'id' => 7,
                'table_name' => 'IndivAccs',
            ),
            6 => 
            array (
                'id' => 9,
                'table_name' => 'Locations',
            ),
            7 => 
            array (
                'id' => 10,
                'table_name' => 'Names',
            ),
            8 => 
            array (
                'id' => 11,
                'table_name' => 'PhoneNumbers',
            ),
            9 => 
            array (
                'id' => 4,
                'table_name' => 'Sensors',
            ),
            10 => 
            array (
                'id' => 12,
                'table_name' => 'SMSTemplates',
            ),
            11 => 
            array (
                'id' => 13,
                'table_name' => 'SocialElements',
            ),
            12 => 
            array (
                'id' => 6,
                'table_name' => 'Users',
            ),
        ));
        
        
    }
}