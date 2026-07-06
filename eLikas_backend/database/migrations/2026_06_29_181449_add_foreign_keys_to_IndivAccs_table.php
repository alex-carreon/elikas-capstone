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
        Schema::table('IndivAccs', function (Blueprint $table) {
            $table->foreign(['user_id'], 'IndivAccs_ibfk_1')->references(['id'])->on('Users')->onUpdate('restrict')->onDelete('restrict');
            $table->foreign(['location_id'], 'IndivAccs_ibfk_2')->references(['id'])->on('Locations')->onUpdate('restrict')->onDelete('restrict');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('IndivAccs', function (Blueprint $table) {
            $table->dropForeign('IndivAccs_ibfk_1');
            $table->dropForeign('IndivAccs_ibfk_2');
        });
    }
};
