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
        Schema::table('Locations', function (Blueprint $table) {
            $table->foreign(['level_id'], 'Locations_ibfk_1')->references(['id'])->on('LocationLevels')->onUpdate('restrict')->onDelete('restrict');
            $table->foreign(['parent_id'], 'Locations_ibfk_2')->references(['id'])->on('Locations')->onUpdate('restrict')->onDelete('restrict');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('Locations', function (Blueprint $table) {
            $table->dropForeign('Locations_ibfk_1');
            $table->dropForeign('Locations_ibfk_2');
        });
    }
};
