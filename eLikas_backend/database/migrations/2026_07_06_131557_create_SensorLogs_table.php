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
        Schema::create('SensorLogs', function (Blueprint $table) {
            $table->integer('id', true);
            $table->string('sensor_code', 20)->index('sensor_id');
            $table->dateTime('sensor_timestamp');
            $table->dateTime('log_time')->useCurrent();
            $table->decimal('water_level', 6);
            $table->string('status_level', 20);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('SensorLogs');
    }
};
