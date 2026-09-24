<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('verification_audit_logs', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('payment_id')->index();
            $table->string('transaction_ref');
            $table->enum('previous_status', ['pending', 'verified', 'rejected', 'refunded']);
            $table->enum('new_status', ['pending', 'verified', 'rejected', 'refunded']);
            $table->string('officer_name');
            $table->timestamp('occurred_at');
            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('verification_audit_logs');
    }
};
