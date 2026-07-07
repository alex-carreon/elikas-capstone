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
        Schema::create('Sensors', function (Blueprint $table) {
            $table->integer('id', true);
            $table->integer('element_id')->index('element_id');
            $table->string('sensor_code', 20)->default('concat(\'SR-\',ucase(substr(replace(uuid(),\'-\',\'\'),1,6)))')->unique('sensors_unique');
            $table->decimal('mount_height', 4);
            $table->string('name', 50);
            $table->geometry('location', 'point');
            $table->text('address');
            $table->dateTime('last_online')->nullable();
            $table->integer('location_id')->index('sensors_locations_fk_1');
            $table->decimal('yellow_level', 4);
            $table->decimal('orange_level', 4);
            $table->decimal('red_level', 4);
            $table->string('current_status', 20)->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('Sensors');
    }
};
