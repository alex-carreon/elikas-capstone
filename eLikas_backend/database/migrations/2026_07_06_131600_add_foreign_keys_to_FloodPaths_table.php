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
        Schema::table('FloodPaths', function (Blueprint $table) {
            $table->foreign(['element_id'], 'FloodPaths_ibfk_1')->references(['id'])->on('SocialElements')->onUpdate('restrict')->onDelete('restrict');
            $table->foreign(['level_id'], 'FloodPaths_ibfk_2')->references(['id'])->on('FloodLevels')->onUpdate('restrict')->onDelete('restrict');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('FloodPaths', function (Blueprint $table) {
            $table->dropForeign('FloodPaths_ibfk_1');
            $table->dropForeign('FloodPaths_ibfk_2');
        });
    }
};
