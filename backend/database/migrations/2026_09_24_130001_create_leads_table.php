<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leads', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('full_name');
            $table->string('email');
            $table->string('phone');
            $table->string('target_program');
            $table->string('assigned_closer_id')->index();
            $table->enum('stage', ['new_lead', 'contacted', 'demo_call', 'negotiation', 'enrolled', 'closed_won', 'lost']);
            $table->unsignedInteger('estimated_deal_value');
            $table->string('source');
            $table->text('notes')->nullable();
            $table->string('enrollment_id')->nullable();
            $table->timestamp('created_at_source')->nullable();
            $table->timestamp('last_activity_at')->nullable();
            $table->timestamps();

            $table->foreign('assigned_closer_id')->references('id')->on('closers');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leads');
    }
};
