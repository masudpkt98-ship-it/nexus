<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Corporate KPI catalogue (Performance Dictionary) — the TOP of the KPI cascade
 * that Planning → Monitoring → Appraisal descend from. Global (not unit-scoped):
 * everyone sees the same corporate catalogue; only performance.manage may write.
 *
 * Unlike planning_kpis (which keeps a payload blob), every dimension gets its own
 * queryable column so the catalogue can be filtered by perspective / strategic
 * goal / cascade level — the "rapi & bisa di-query" requirement.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('corporate_kpis', function (Blueprint $table) {
            $table->id();
            $table->string('kpi_id')->unique();          // client id (ck-…), stable upsert key
            $table->string('code')->nullable();          // human code, e.g. CK-01
            $table->string('name');
            $table->string('perspective')->nullable();   // Balanced Scorecard perspective
            $table->string('unit')->nullable();          // measure unit (%, index, …)
            $table->string('target')->nullable();        // kept as string to match the form
            $table->string('strategic_goal_id')->nullable(); // cascade link → strategy goal
            $table->json('cascadable_to')->nullable();    // subordinate levels that may adopt it
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('code');
            $table->index('perspective');
            $table->index('strategic_goal_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('corporate_kpis');
    }
};
