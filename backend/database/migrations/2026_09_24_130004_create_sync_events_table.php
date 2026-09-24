<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('sync_events', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->timestamp('occurred_at');
            $table->string('payment_id')->index();
            $table->string('transaction_ref');
            $table->string('closer_name');
            $table->string('student_name');
            $table->unsignedInteger('amount');
            $table->string('program');
            $table->enum('status', ['SYNCED', 'DEDUPLICATED', 'VALIDATION_FAILED']);
            $table->unsignedInteger('verification_latency_ms');
            $table->text('details');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('sync_events');
    }
};
