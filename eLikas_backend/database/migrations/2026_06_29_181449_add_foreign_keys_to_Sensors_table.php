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
        Schema::table('Sensors', function (Blueprint $table) {
            $table->foreign(['element_id'], 'Sensors_ibfk_1')->references(['id'])->on('SocialElements')->onUpdate('restrict')->onDelete('restrict');
            $table->foreign(['id'], 'Sensors_Locations_FK')->references(['id'])->on('Locations')->onUpdate('restrict')->onDelete('restrict');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('Sensors', function (Blueprint $table) {
            $table->dropForeign('Sensors_ibfk_1');
            $table->dropForeign('Sensors_Locations_FK');
        });
    }
};
