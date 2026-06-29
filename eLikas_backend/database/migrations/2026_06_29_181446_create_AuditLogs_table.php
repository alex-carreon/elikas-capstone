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
        Schema::create('AuditLogs', function (Blueprint $table) {
            $table->integer('id', true);
            $table->string('user_type')->nullable();
            $table->integer('user_id')->nullable();
            $table->string('event');
            $table->integer('target_id');
            $table->text('old_values')->nullable();
            $table->text('new_values')->nullable();
            $table->integer('target_table_id')->index('auditlogs_targettables_fk');
            $table->string('ip_address', 45)->nullable();
            $table->string('user_agent', 1023)->nullable();
            $table->timestamp('created_at')->useCurrent();
            $table->string('log_id', 10)->unique('auditlogs_unique');

            $table->index(['user_id', 'user_type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('AuditLogs');
    }
};
