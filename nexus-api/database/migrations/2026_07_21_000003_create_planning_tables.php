<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Performance Planning — one row per planned KPI. The rich PlanningKpi
        // shape is kept verbatim in `payload` (json); dedicated columns carry the
        // owning unit so reads/writes are row-level scoped (see PlanningController).
        Schema::create('planning_kpis', function (Blueprint $table) {
            $table->id();
            $table->string('kpi_id')->unique();  // PlanningKpi.id (pk-… / korp-…)
            $table->string('unit_key');          // owning unit ("korporat", "dir:…", "recap")
            $table->string('unit_name')->nullable();
            $table->string('directorate')->nullable();
            $table->string('period');            // year, e.g. "2026"
            $table->json('payload');             // the full PlanningKpi object
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['unit_key', 'period']);
            $table->index('directorate');
            $table->index('unit_name');
        });

        // KPI Owner per unit.
        Schema::create('planning_owners', function (Blueprint $table) {
            $table->id();
            $table->string('unit_key')->unique();
            $table->string('unit_name')->nullable();
            $table->string('directorate')->nullable();
            $table->string('jabatan')->nullable();
            $table->string('name')->nullable();
            $table->string('npk')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('directorate');
            $table->index('unit_name');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('planning_owners');
        Schema::dropIfExists('planning_kpis');
    }
};
