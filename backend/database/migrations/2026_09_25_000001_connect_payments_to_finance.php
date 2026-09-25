<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('closers', function (Blueprint $table) {
            $table->string('email')->nullable()->change();
        });

        Schema::table('student_enrollments', function (Blueprint $table) {
            $table->decimal('total_contract_value', 14, 2)->change();
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->decimal('amount', 14, 2)->change();
            $table->unsignedBigInteger('finance_transaction_id')->nullable()->unique()->after('id');
            $table->string('finance_verification_status')->nullable()->after('status');
            $table->string('income_product')->nullable()->after('payment_type');
            $table->timestamp('finance_updated_at')->nullable()->after('verified_at');
        });

        Schema::table('sync_events', function (Blueprint $table) {
            $table->decimal('amount', 14, 2)->change();
            $table->unsignedBigInteger('verification_latency_ms')->change();
        });
    }

    public function down(): void
    {
        Schema::table('sync_events', function (Blueprint $table) {
            $table->unsignedInteger('verification_latency_ms')->change();
            $table->unsignedInteger('amount')->change();
        });

        Schema::table('payments', function (Blueprint $table) {
            $table->dropUnique(['finance_transaction_id']);
            $table->dropColumn([
                'finance_transaction_id',
                'finance_verification_status',
                'income_product',
                'finance_updated_at',
            ]);
            $table->unsignedInteger('amount')->change();
        });

        Schema::table('student_enrollments', function (Blueprint $table) {
            $table->unsignedInteger('total_contract_value')->change();
        });

        Schema::table('closers', function (Blueprint $table) {
            $table->string('email')->nullable(false)->change();
        });
    }
};
