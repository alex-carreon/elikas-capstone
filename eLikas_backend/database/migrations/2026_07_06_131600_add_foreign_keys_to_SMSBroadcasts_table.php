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
        Schema::table('SMSBroadcasts', function (Blueprint $table) {
            $table->foreign(['sender_id'], 'SMSBroadcasts_ibfk_1')->references(['id'])->on('GovOps')->onUpdate('restrict')->onDelete('restrict');
            $table->foreign(['location_id'], 'SMSBroadcasts_ibfk_2')->references(['id'])->on('Locations')->onUpdate('restrict')->onDelete('restrict');
            $table->foreign(['status'], 'SMSBroadcasts_ibfk_3')->references(['id'])->on('BroadcastStatus')->onUpdate('restrict')->onDelete('restrict');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('SMSBroadcasts', function (Blueprint $table) {
            $table->dropForeign('SMSBroadcasts_ibfk_1');
            $table->dropForeign('SMSBroadcasts_ibfk_2');
            $table->dropForeign('SMSBroadcasts_ibfk_3');
        });
    }
};
