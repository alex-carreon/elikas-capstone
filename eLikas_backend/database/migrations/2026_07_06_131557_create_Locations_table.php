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
        Schema::create('Locations', function (Blueprint $table) {
            $table->integer('id', true);
            $table->string('name', 100);
            $table->integer('level_id')->index('level_id');
            $table->integer('parent_id')->nullable()->index('parent_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('Locations');
    }
};
