<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('closers', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('name');
            $table->string('email')->unique();
            $table->string('title');
            $table->string('avatar_url')->nullable();
            $table->unsignedInteger('monthly_target');
            $table->unsignedInteger('collection_target');
            $table->string('effective_period');
            $table->decimal('base_commission_pct', 5, 2);
            $table->decimal('accelerator_pct', 5, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('closers');
    }
};
