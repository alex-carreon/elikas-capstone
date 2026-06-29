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
        Schema::create('FloodPaths', function (Blueprint $table) {
            $table->integer('id', true);
            $table->integer('element_id')->index('element_id');
            $table->integer('level_id')->index('level_id');
            $table->dateTime('last_confirmed')->useCurrent();
            $table->geometry('path', 'lineString');
            $table->text('description')->nullable();
            $table->integer('upvotes')->default(0);
            $table->integer('downvotes')->default(0);
            $table->dateTime('expiry');
            $table->dateTime('reminder_sent_at')->nullable();
            $table->dateTime('dismissed_at')->nullable();

            $table->spatialIndex(['path'], 'idx_flood_path');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('FloodPaths');
    }
};
