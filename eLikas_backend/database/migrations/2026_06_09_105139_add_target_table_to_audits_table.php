<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $table = config('audit.drivers.database.table', 'audits');
        Schema::table($table, function (Blueprint $table) {
            // This single line does the work of defining the unsignedBigInteger AND setting the foreign key
            $table->foreignId('target_table')->nullable()->constrained('target_tables');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $table = config('audit.drivers.database.table', 'audits');
        Schema::table($table, function (Blueprint $table) {
            $table->dropForeign(['target_table']);
            $table->dropColumn('target_table');
        });
    }
};
