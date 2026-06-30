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
        Schema::table('Votes', function (Blueprint $table) {
            $table->foreign(['user_id'], 'Votes_ibfk_1')->references(['id'])->on('Users')->onUpdate('restrict')->onDelete('restrict');
            $table->foreign(['element_id'], 'Votes_ibfk_2')->references(['id'])->on('SocialElements')->onUpdate('restrict')->onDelete('restrict');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('Votes', function (Blueprint $table) {
            $table->dropForeign('Votes_ibfk_1');
            $table->dropForeign('Votes_ibfk_2');
        });
    }
};
