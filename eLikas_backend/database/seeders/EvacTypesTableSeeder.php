<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class EvacTypesTableSeeder extends Seeder
{

    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {
        

        \DB::table('EvacTypes')->delete();
        
        \DB::table('EvacTypes')->insert(array (
            0 => 
            array (
                'id' => 1,
                'evac_type' => 'Barangay Hall',
            ),
            1 => 
            array (
                'id' => 4,
                'evac_type' => 'Church',
            ),
            2 => 
            array (
                'id' => 3,
                'evac_type' => 'Covered Court / Gymnasium',
            ),
            3 => 
            array (
                'id' => 2,
                'evac_type' => 'Multi-Purpose Hall',
            ),
            4 => 
            array (
                'id' => 5,
                'evac_type' => 'Private Residence / Individual House',
            ),
        ));
        
        
    }
}