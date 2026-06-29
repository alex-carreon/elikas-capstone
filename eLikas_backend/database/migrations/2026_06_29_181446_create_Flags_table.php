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
        Schema::create('Flags', function (Blueprint $table) {
            $table->integer('id', true);
            $table->integer('user_id')->index('user_id');
            $table->integer('element_id')->index('element_id');
            $table->integer('reason_id')->index('reason_id');
            $table->dateTime('flagged_at')->useCurrent();
            $table->boolean('is_approved')->nullable();
            $table->integer('reviewed_by')->nullable()->index('reviewed_by');
            $table->dateTime('reviewed_at')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('Flags');
    }
};
