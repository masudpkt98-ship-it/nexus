<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Stable per-employee access PIN for the public /progress portal.
        Schema::create('progress_pins', function (Blueprint $table) {
            $table->id();
            $table->string('npk')->unique();
            $table->string('pin');
            $table->timestamps();
        });

        // Published per-employee KPI progress, one row per (period, NPK).
        // `metrics` holds the 6-metric status map exactly as the card renders it.
        Schema::create('progress_records', function (Blueprint $table) {
            $table->id();
            $table->string('period_id'); // e.g. "2026-Triwulanan-1"
            $table->integer('year');
            $table->string('gran');
            $table->integer('value');
            $table->string('npk');
            $table->string('name')->nullable();
            $table->string('position')->nullable();
            $table->string('unit')->nullable();
            $table->string('directorate')->nullable();
            $table->string('compartment')->nullable();
            $table->json('metrics');
            $table->string('period_label')->nullable();
            $table->timestamp('published_at')->nullable();
            $table->timestamps();

            $table->unique(['period_id', 'npk']);
            $table->index('npk');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('progress_records');
        Schema::dropIfExists('progress_pins');
    }
};
