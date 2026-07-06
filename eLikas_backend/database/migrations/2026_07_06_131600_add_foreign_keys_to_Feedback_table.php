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
        Schema::table('Feedback', function (Blueprint $table) {
            $table->foreign(['user_id'], 'Feedback_ibfk_1')->references(['id'])->on('Users')->onUpdate('restrict')->onDelete('restrict');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('Feedback', function (Blueprint $table) {
            $table->dropForeign('Feedback_ibfk_1');
        });
    }
};
