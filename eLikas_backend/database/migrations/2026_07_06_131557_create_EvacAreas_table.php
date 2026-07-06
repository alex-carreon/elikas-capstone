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
        Schema::create('EvacAreas', function (Blueprint $table) {
            $table->integer('id', true);
            $table->integer('element_id')->index('element_id');
            $table->integer('location_id')->index('location_id');
            $table->geometry('location', 'point');
            $table->integer('area_type')->index('area_type');
            $table->text('address');
            $table->text('description')->nullable();
            $table->string('name', 50);
            $table->integer('capacity_level')->index('capacity_level');
            $table->dateTime('last_updated')->nullable();
            $table->boolean('is_persistent')->default(false);
            $table->integer('verified_by')->nullable()->index('verified_by');
            $table->boolean('for_reg_flood')->nullable();
            $table->boolean('for_heavy_flood')->nullable();
            $table->boolean('has_accom')->nullable();
            $table->integer('toilet_count')->nullable();
            $table->integer('kitchen_count')->nullable();
            $table->boolean('has_DRRMO')->nullable();
            $table->boolean('has_health')->nullable();
            $table->boolean('pwd_friendly')->nullable();
            $table->boolean('has_catchment')->nullable();
            $table->integer('child_prayer_count')->nullable();
            $table->integer('breastfeed_count')->nullable();
            $table->text('other_facilities')->nullable();
            $table->string('contact_person', 100)->nullable();
            $table->string('contact_number', 15)->nullable();
            $table->dateTime('expiry')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('EvacAreas');
    }
};
