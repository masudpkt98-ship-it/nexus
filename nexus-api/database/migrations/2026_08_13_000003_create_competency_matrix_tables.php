<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Competency Matrix — the required standard per group and each employee's
 * assessed level against it (/competency/matrix).
 *
 * A "group" is a competency's Job Family, falling back to its category, which is
 * how the page buckets the catalogue. Group keys are free text coming from the
 * imported spreadsheets, so they are stored as-is and only ever compared exactly.
 *
 * Standards are one row per (group, competency) so a single cell edit is one
 * upsert. An assessment is one row per (group, employee) with the per-competency
 * levels as JSON — the page always writes a whole employee row, and the columns
 * are exactly the catalogue's competencies, which change with every import.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('competency_standards', function (Blueprint $table) {
            $table->id();
            $table->string('group_key');
            $table->string('comp_id');                 // → competency_dictionary.comp_id
            $table->unsignedTinyInteger('required_level')->default(0); // 0 = no standard set
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['group_key', 'comp_id']);
            $table->index('comp_id');
        });

        Schema::create('competency_assessments', function (Blueprint $table) {
            $table->id();
            $table->string('group_key');
            $table->string('npk');                     // employee NPK, or the name when unmatched
            $table->string('name');
            $table->json('levels')->nullable();        // {compId: actualLevel}
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['group_key', 'npk']);
            $table->index('npk');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('competency_assessments');
        Schema::dropIfExists('competency_standards');
    }
};
