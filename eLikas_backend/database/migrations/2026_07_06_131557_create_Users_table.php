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
        Schema::create('Users', function (Blueprint $table) {
            $table->integer('id', true);
            $table->string('username', 20)->unique('username');
            $table->string('email', 50)->unique('email');
            $table->integer('role_id')->index('role_id');
            $table->dateTime('created_at')->useCurrent();
            $table->dateTime('deactivated_at')->nullable();
            $table->char('avatar_seed', 8)->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('Users');
    }
};
