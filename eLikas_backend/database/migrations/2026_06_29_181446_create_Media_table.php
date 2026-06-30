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
        Schema::create('Media', function (Blueprint $table) {
            $table->integer('id', true);
            $table->integer('parent_id')->index('parent_id');
            $table->integer('user_id')->index('user_id');
            $table->string('file_path', 500);
            $table->string('file_type', 20);
            $table->dateTime('uploaded_at')->useCurrent();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('Media');
    }
};
