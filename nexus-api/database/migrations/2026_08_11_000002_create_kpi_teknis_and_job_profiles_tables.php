<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Performance Dictionary reference data — KPI Teknis (technical KPIs per Job
 * Profile) and Job Profiles. Both are global catalogues (shared across the app,
 * feed the Mapping/cascade). Each dimension gets its own queryable column;
 * array fields (responsibilities, kpi_ids) are json. Keyed by the client id for
 * stable upsert (no temp-id reconciliation).
 */
return new class extends Migration
{
    public function up(): void
    {
        // KPI Teknis — one row per technical KPI, linked to a Job Profile.
        Schema::create('kpi_teknis', function (Blueprint $table) {
            $table->id();
            $table->string('kpi_id')->unique();          // client id (kt-…)
            $table->string('job_profile_id')->nullable(); // cascade link → job profile
            $table->string('kpi');
            $table->string('validitas')->nullable();
            $table->string('satuan')->nullable();
            $table->string('polaritas')->nullable();
            $table->string('tipe')->nullable();          // Jenis Cascade
            $table->string('prioritas')->nullable();     // Skala Prioritas
            $table->string('bobot')->nullable();
            $table->string('pengukuran')->nullable();    // Jenis Pengukuran
            $table->string('frekuensi')->nullable();
            $table->string('target')->nullable();        // Target Tahunan
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('job_profile_id');
        });

        // Job Profiles — role master used by mapping/cascade.
        Schema::create('job_profiles', function (Blueprint $table) {
            $table->id();
            $table->string('profile_id')->unique();      // client id (jp-…)
            $table->string('role');
            $table->string('level')->nullable();
            $table->string('unit')->nullable();
            $table->text('purpose')->nullable();
            $table->json('responsibilities')->nullable();
            $table->json('kpi_ids')->nullable();         // linked Corporate KPI ids
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('level');
            $table->index('unit');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('job_profiles');
        Schema::dropIfExists('kpi_teknis');
    }
};
