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
        Schema::table('SocialElements', function (Blueprint $table) {
            $table->foreign(['user_id'], 'SocialElements_ibfk_1')->references(['id'])->on('Users')->onUpdate('restrict')->onDelete('restrict');
            $table->foreign(['type_id'], 'SocialElements_ibfk_2')->references(['id'])->on('TargetTables')->onUpdate('restrict')->onDelete('restrict');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('SocialElements', function (Blueprint $table) {
            $table->dropForeign('SocialElements_ibfk_1');
            $table->dropForeign('SocialElements_ibfk_2');
        });
    }
};
