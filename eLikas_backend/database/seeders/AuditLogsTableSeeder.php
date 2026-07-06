<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class AuditLogsTableSeeder extends Seeder
{

    /**
     * Auto generated seed file
     *
     * @return void
     */
    public function run()
    {
        

        \DB::table('AuditLogs')->delete();
        
        \DB::table('AuditLogs')->insert(array (
            0 => 
            array (
                'id' => 558,
                'user_type' => NULL,
                'user_id' => NULL,
                'event' => 'created',
                'target_id' => 117,
                'old_values' => '[]',
                'new_values' => '{"username":"Hazel Gamoras","email":"hsgamoras@gmail.com","role_id":3,"avatar_seed":"tvor52b7","id":117}',
                'target_table_id' => 6,
                'ip_address' => '127.0.0.1',
                'user_agent' => 'PostmanRuntime/7.54.0',
                'created_at' => '2026-06-28 20:21:19',
                'log_id' => 'CEC3BAE',
            ),
            1 => 
            array (
                'id' => 559,
                'user_type' => NULL,
                'user_id' => NULL,
                'event' => 'created',
                'target_id' => 107,
                'old_values' => '[]',
                'new_values' => '{"first_name":"Hazelle Ann","last_name":"Gamoras","user_id":117,"id":107}',
                'target_table_id' => 10,
                'ip_address' => '127.0.0.1',
                'user_agent' => 'PostmanRuntime/7.54.0',
                'created_at' => '2026-06-28 20:21:19',
                'log_id' => 'CECB5AD',
            ),
            2 => 
            array (
                'id' => 560,
                'user_type' => NULL,
                'user_id' => NULL,
                'event' => 'created',
                'target_id' => 34,
                'old_values' => '[]',
                'new_values' => '{"phone_no":"639081047526","user_id":117,"id":34}',
                'target_table_id' => 11,
                'ip_address' => '127.0.0.1',
                'user_agent' => 'PostmanRuntime/7.54.0',
                'created_at' => '2026-06-28 20:21:20',
                'log_id' => 'CED164C',
            ),
            3 => 
            array (
                'id' => 561,
                'user_type' => NULL,
                'user_id' => NULL,
                'event' => 'created',
                'target_id' => 106,
                'old_values' => '[]',
                'new_values' => '{"location_id":"14","user_id":117,"id":106}',
                'target_table_id' => 7,
                'ip_address' => '127.0.0.1',
                'user_agent' => 'PostmanRuntime/7.54.0',
                'created_at' => '2026-06-28 20:21:21',
                'log_id' => 'CEDCD7B',
            ),
            4 => 
            array (
                'id' => 562,
                'user_type' => NULL,
                'user_id' => NULL,
                'event' => 'created',
                'target_id' => 119,
                'old_values' => '[]',
                'new_values' => '{"username":"Kurt Haci\\u00f1as","email":"kurthacinas@gmail.com","role_id":3,"avatar_seed":"tvor52b7","id":119}',
                'target_table_id' => 6,
                'ip_address' => '127.0.0.1',
                'user_agent' => 'PostmanRuntime/7.54.0',
                'created_at' => '2026-06-29 11:43:59',
                'log_id' => 'CD14F3F',
            ),
            5 => 
            array (
                'id' => 563,
                'user_type' => NULL,
                'user_id' => NULL,
                'event' => 'created',
                'target_id' => 108,
                'old_values' => '[]',
                'new_values' => '{"first_name":"Kurt Andrei","last_name":"Haci\\u00f1as","user_id":119,"id":108}',
                'target_table_id' => 10,
                'ip_address' => '127.0.0.1',
                'user_agent' => 'PostmanRuntime/7.54.0',
                'created_at' => '2026-06-29 11:43:59',
                'log_id' => 'CD1C706',
            ),
            6 => 
            array (
                'id' => 564,
                'user_type' => NULL,
                'user_id' => NULL,
                'event' => 'created',
                'target_id' => 35,
                'old_values' => '[]',
                'new_values' => '{"phone_no":"639458576541","user_id":119,"id":35}',
                'target_table_id' => 11,
                'ip_address' => '127.0.0.1',
                'user_agent' => 'PostmanRuntime/7.54.0',
                'created_at' => '2026-06-29 11:44:00',
                'log_id' => 'CD222A6',
            ),
            7 => 
            array (
                'id' => 565,
                'user_type' => NULL,
                'user_id' => NULL,
                'event' => 'created',
                'target_id' => 107,
                'old_values' => '[]',
                'new_values' => '{"location_id":"13","user_id":119,"id":107}',
                'target_table_id' => 7,
                'ip_address' => '127.0.0.1',
                'user_agent' => 'PostmanRuntime/7.54.0',
                'created_at' => '2026-06-29 11:44:01',
                'log_id' => 'CD29192',
            ),
            8 => 
            array (
                'id' => 566,
                'user_type' => NULL,
                'user_id' => NULL,
                'event' => 'created',
                'target_id' => 120,
                'old_values' => '[]',
                'new_values' => '{"username":"zustin","email":"zustin1214@gmail.com","role_id":3,"avatar_seed":"tvor52b7","id":120}',
                'target_table_id' => 6,
                'ip_address' => '127.0.0.1',
                'user_agent' => 'PostmanRuntime/7.54.0',
                'created_at' => '2026-06-29 11:47:26',
                'log_id' => 'C4CE29F',
            ),
            9 => 
            array (
                'id' => 567,
                'user_type' => NULL,
                'user_id' => NULL,
                'event' => 'created',
                'target_id' => 109,
                'old_values' => '[]',
                'new_values' => '{"first_name":"Zachary Austin","last_name":"Abad","user_id":120,"id":109}',
                'target_table_id' => 10,
                'ip_address' => '127.0.0.1',
                'user_agent' => 'PostmanRuntime/7.54.0',
                'created_at' => '2026-06-29 11:47:28',
                'log_id' => 'C4E454B',
            ),
            10 => 
            array (
                'id' => 568,
                'user_type' => NULL,
                'user_id' => NULL,
                'event' => 'created',
                'target_id' => 36,
                'old_values' => '[]',
                'new_values' => '{"phone_no":"639668531738","user_id":120,"id":36}',
                'target_table_id' => 11,
                'ip_address' => '127.0.0.1',
                'user_agent' => 'PostmanRuntime/7.54.0',
                'created_at' => '2026-06-29 11:47:29',
                'log_id' => 'C4EADD6',
            ),
            11 => 
            array (
                'id' => 569,
                'user_type' => NULL,
                'user_id' => NULL,
                'event' => 'created',
                'target_id' => 108,
                'old_values' => '[]',
                'new_values' => '{"location_id":"15","user_id":120,"id":108}',
                'target_table_id' => 7,
                'ip_address' => '127.0.0.1',
                'user_agent' => 'PostmanRuntime/7.54.0',
                'created_at' => '2026-06-29 11:47:30',
                'log_id' => 'C4F3DA9',
            ),
        ));
        
        
    }
}