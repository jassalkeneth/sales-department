<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payments', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('transaction_ref')->unique();
            $table->string('student_id')->index();
            $table->string('student_name');
            $table->string('closer_id')->index();
            $table->string('closer_name');
            $table->string('program');
            $table->unsignedInteger('amount');
            $table->string('payment_type');
            $table->unsignedTinyInteger('installment_number');
            $table->unsignedTinyInteger('total_installments');
            $table->enum('status', ['pending', 'verified', 'rejected', 'refunded']);
            $table->timestamp('created_at_source')->nullable();
            $table->timestamp('verified_at')->nullable();
            $table->string('verified_by')->nullable();
            $table->text('finance_notes')->nullable();
            $table->boolean('is_duplicate_flag')->default(false);
            $table->timestamps();

            $table->foreign('student_id')->references('id')->on('student_enrollments')->cascadeOnDelete();
            $table->foreign('closer_id')->references('id')->on('closers');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
    }
};
