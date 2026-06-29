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
        Schema::create('EmergencyContacts', function (Blueprint $table) {
            $table->integer('id', true);
            $table->integer('element_id')->index('element_id');
            $table->integer('location_id')->index('location_id');
            $table->string('name', 50)->unique('name');
            $table->string('phone_number', 15)->nullable();
            $table->string('mobile_number', 15)->nullable();
            $table->text('address');
            $table->dateTime('updated_at')->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('EmergencyContacts');
    }
};
