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
        Schema::table('Comments', function (Blueprint $table) {
            $table->foreign(['element_id'], 'Comments_ibfk_1')->references(['id'])->on('SocialElements')->onUpdate('restrict')->onDelete('restrict');
            $table->foreign(['parent_id'], 'Comments_ibfk_2')->references(['id'])->on('SocialElements')->onUpdate('restrict')->onDelete('restrict');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('Comments', function (Blueprint $table) {
            $table->dropForeign('Comments_ibfk_1');
            $table->dropForeign('Comments_ibfk_2');
        });
    }
};
