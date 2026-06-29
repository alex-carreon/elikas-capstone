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
        Schema::create('SMSBroadcasts', function (Blueprint $table) {
            $table->integer('id', true);
            $table->integer('sender_id')->index('sender_id');
            $table->integer('location_id')->index('location_id');
            $table->text('message_content');
            $table->integer('status')->index('status');
            $table->dateTime('scheduled_for')->useCurrent();
            $table->dateTime('sent_at')->nullable();
            $table->integer('total_recipients');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('SMSBroadcasts');
    }
};
