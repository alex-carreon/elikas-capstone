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
        Schema::table('EvacAreas', function (Blueprint $table) {
            $table->foreign(['element_id'], 'EvacAreas_ibfk_1')->references(['id'])->on('SocialElements')->onUpdate('restrict')->onDelete('restrict');
            $table->foreign(['location_id'], 'EvacAreas_ibfk_2')->references(['id'])->on('Locations')->onUpdate('restrict')->onDelete('restrict');
            $table->foreign(['area_type'], 'EvacAreas_ibfk_3')->references(['id'])->on('EvacTypes')->onUpdate('restrict')->onDelete('restrict');
            $table->foreign(['capacity_level'], 'EvacAreas_ibfk_4')->references(['id'])->on('CapacityLevels')->onUpdate('restrict')->onDelete('restrict');
            $table->foreign(['verified_by'], 'EvacAreas_ibfk_5')->references(['id'])->on('GovOps')->onUpdate('restrict')->onDelete('restrict');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('EvacAreas', function (Blueprint $table) {
            $table->dropForeign('EvacAreas_ibfk_1');
            $table->dropForeign('EvacAreas_ibfk_2');
            $table->dropForeign('EvacAreas_ibfk_3');
            $table->dropForeign('EvacAreas_ibfk_4');
            $table->dropForeign('EvacAreas_ibfk_5');
        });
    }
};
