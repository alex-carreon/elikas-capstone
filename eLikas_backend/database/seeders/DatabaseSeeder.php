<?php

namespace Database\Seeders;

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        Schema::disableForeignKeyConstraints();

        $this->call(AdminsTableSeeder::class);
        $this->call(AuditLogsTableSeeder::class);
        $this->call(BroadcastStatusTableSeeder::class);
        $this->call(CapacityLevelsTableSeeder::class);
        $this->call(CommentsTableSeeder::class);
        $this->call(EmergencyContactsTableSeeder::class);
        $this->call(EvacAreasTableSeeder::class);
        $this->call(EvacTypesTableSeeder::class);
        $this->call(FeedbackTableSeeder::class);
        $this->call(FlagReasonsTableSeeder::class);
        $this->call(FlagsTableSeeder::class);
        $this->call(FloodLevelsTableSeeder::class);
        $this->call(FloodPathsTableSeeder::class);
        $this->call(GovOpsTableSeeder::class);
        $this->call(IndivAccsTableSeeder::class);
        $this->call(JobsTableSeeder::class);
        $this->call(JobBatchesTableSeeder::class);
        $this->call(LocationLevelsTableSeeder::class);
        $this->call(LocationsTableSeeder::class);
        $this->call(MediaTableSeeder::class);
        $this->call(ModerationLogsTableSeeder::class);
        $this->call(NamesTableSeeder::class);
        $this->call(PhoneNumbersTableSeeder::class);
        $this->call(RolesTableSeeder::class);
        $this->call(SensorLogsTableSeeder::class);
        $this->call(SensorsTableSeeder::class);
        $this->call(SMSBroadcastsTableSeeder::class);
        $this->call(SMSTemplatesTableSeeder::class);
        $this->call(SocialElementsTableSeeder::class);
        $this->call(TargetTablesTableSeeder::class);
        $this->call(UserAuthTableSeeder::class);
        $this->call(UsersTableSeeder::class);
        $this->call(VotesTableSeeder::class);

        Schema::enableForeignKeyConstraints();
    }
}
