<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class LocationsTableSeeder extends Seeder
{

    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {
        

        \DB::table('Locations')->delete();
        
        \DB::table('Locations')->insert(array (
            0 => 
            array (
                'id' => 1,
                'name' => 'Metro Manila',
                'level_id' => 1,
                'parent_id' => NULL,
            ),
            1 => 
            array (
                'id' => 2,
                'name' => 'San Juan City',
                'level_id' => 2,
                'parent_id' => 1,
            ),
            2 => 
            array (
                'id' => 3,
                'name' => 'Barangay Addition Hills',
                'level_id' => 3,
                'parent_id' => 2,
            ),
            3 => 
            array (
                'id' => 4,
                'name' => 'Barangay Balong Bato',
                'level_id' => 3,
                'parent_id' => 2,
            ),
            4 => 
            array (
                'id' => 5,
                'name' => 'Barangay Batis',
                'level_id' => 3,
                'parent_id' => 2,
            ),
            5 => 
            array (
                'id' => 6,
                'name' => 'Barangay Corazon de Jesus',
                'level_id' => 3,
                'parent_id' => 2,
            ),
            6 => 
            array (
                'id' => 7,
                'name' => 'Barangay Ermitaño',
                'level_id' => 3,
                'parent_id' => 2,
            ),
            7 => 
            array (
                'id' => 8,
                'name' => 'Barangay Greenhills',
                'level_id' => 3,
                'parent_id' => 2,
            ),
            8 => 
            array (
                'id' => 9,
                'name' => 'Barangay Isabelita',
                'level_id' => 3,
                'parent_id' => 2,
            ),
            9 => 
            array (
                'id' => 10,
                'name' => 'Barangay Kabayanan',
                'level_id' => 3,
                'parent_id' => 2,
            ),
            10 => 
            array (
                'id' => 11,
                'name' => 'Barangay Little Baguio',
                'level_id' => 3,
                'parent_id' => 2,
            ),
            11 => 
            array (
                'id' => 12,
                'name' => 'Barangay Maytunas',
                'level_id' => 3,
                'parent_id' => 2,
            ),
            12 => 
            array (
                'id' => 13,
                'name' => 'Barangay Onse',
                'level_id' => 3,
                'parent_id' => 2,
            ),
            13 => 
            array (
                'id' => 14,
                'name' => 'Barangay Pasadena',
                'level_id' => 3,
                'parent_id' => 2,
            ),
            14 => 
            array (
                'id' => 15,
                'name' => 'Barangay Pedro Cruz',
                'level_id' => 3,
                'parent_id' => 2,
            ),
            15 => 
            array (
                'id' => 16,
                'name' => 'Barangay Progreso',
                'level_id' => 3,
                'parent_id' => 2,
            ),
            16 => 
            array (
                'id' => 17,
                'name' => 'Barangay Rivera',
                'level_id' => 3,
                'parent_id' => 2,
            ),
            17 => 
            array (
                'id' => 18,
                'name' => 'Barangay Salapan',
                'level_id' => 3,
                'parent_id' => 2,
            ),
            18 => 
            array (
                'id' => 19,
                'name' => 'Barangay San Perfecto',
                'level_id' => 3,
                'parent_id' => 2,
            ),
            19 => 
            array (
                'id' => 20,
                'name' => 'Barangay Santa Lucia',
                'level_id' => 3,
                'parent_id' => 2,
            ),
            20 => 
            array (
                'id' => 21,
                'name' => 'Barangay St. Joseph',
                'level_id' => 3,
                'parent_id' => 2,
            ),
            21 => 
            array (
                'id' => 22,
                'name' => 'Barangay Tibagan',
                'level_id' => 3,
                'parent_id' => 2,
            ),
            22 => 
            array (
                'id' => 23,
                'name' => 'Barangay West Crame',
                'level_id' => 3,
                'parent_id' => 2,
            ),
            23 => 
            array (
                'id' => 24,
                'name' => 'Outside San Juan',
                'level_id' => 2,
                'parent_id' => NULL,
            ),
            24 => 
            array (
                'id' => 25,
                'name' => 'Unregistered Barangay',
                'level_id' => 3,
                'parent_id' => 24,
            ),
        ));
        
        
    }
}