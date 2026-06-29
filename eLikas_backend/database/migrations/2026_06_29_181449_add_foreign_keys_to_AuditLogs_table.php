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
        Schema::table('AuditLogs', function (Blueprint $table) {
            $table->foreign(['target_table_id'], 'AuditLogs_TargetTables_FK')->references(['id'])->on('TargetTables')->onUpdate('restrict')->onDelete('restrict');
            $table->foreign(['user_id'], 'AuditLogs_Users_FK')->references(['id'])->on('Users')->onUpdate('restrict')->onDelete('restrict');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('AuditLogs', function (Blueprint $table) {
            $table->dropForeign('AuditLogs_TargetTables_FK');
            $table->dropForeign('AuditLogs_Users_FK');
        });
    }
};
