<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('student_enrollments', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('lead_id')->nullable()->index();
            $table->string('full_name');
            $table->string('email');
            $table->string('phone');
            $table->string('program');
            $table->enum('tier', ['Standard', 'Premium', 'Elite Cohort']);
            $table->string('assigned_closer_id')->index();
            $table->unsignedInteger('total_contract_value');
            $table->string('payment_plan');
            $table->timestamp('enrolled_at');
            $table->enum('finance_status', ['pending_payment', 'partially_collected', 'fully_collected']);
            $table->timestamps();

            $table->foreign('assigned_closer_id')->references('id')->on('closers');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('student_enrollments');
    }
};
