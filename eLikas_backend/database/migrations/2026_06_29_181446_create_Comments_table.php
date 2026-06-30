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
        Schema::create('Comments', function (Blueprint $table) {
            $table->integer('id', true);
            $table->integer('element_id')->index('element_id');
            $table->integer('parent_id')->index('parent_id');
            $table->text('content')->nullable();
            $table->integer('upvotes')->default(0);
            $table->integer('downvotes')->default(0);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('Comments');
    }
};
