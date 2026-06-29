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
        Schema::table('Flags', function (Blueprint $table) {
            $table->foreign(['user_id'], 'Flags_ibfk_1')->references(['id'])->on('Users')->onUpdate('restrict')->onDelete('restrict');
            $table->foreign(['element_id'], 'Flags_ibfk_2')->references(['id'])->on('SocialElements')->onUpdate('restrict')->onDelete('restrict');
            $table->foreign(['reason_id'], 'Flags_ibfk_3')->references(['id'])->on('FlagReasons')->onUpdate('restrict')->onDelete('restrict');
            $table->foreign(['reviewed_by'], 'Flags_ibfk_4')->references(['id'])->on('Admins')->onUpdate('restrict')->onDelete('restrict');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('Flags', function (Blueprint $table) {
            $table->dropForeign('Flags_ibfk_1');
            $table->dropForeign('Flags_ibfk_2');
            $table->dropForeign('Flags_ibfk_3');
            $table->dropForeign('Flags_ibfk_4');
        });
    }
};
