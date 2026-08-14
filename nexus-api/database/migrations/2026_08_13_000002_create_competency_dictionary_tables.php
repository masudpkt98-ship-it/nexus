<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Kamus Kompetensi — the competency catalogue behind /competency/dictionary and
 * the reference the Matrix, Gap Analysis and Job Profile pages read from.
 *
 * Global (not unit-scoped) like the Performance Dictionary: one catalogue that
 * every competency surface resolves against. Each dimension gets its own column
 * so the catalogue stays queryable by category / job family / function, with the
 * per-level indicators kept as JSON because their count follows the level scale.
 *
 * `comp_id` is the client-owned upsert key (same convention as corporate_kpis).
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('competency_dictionary', function (Blueprint $table) {
            $table->id();
            $table->string('comp_id')->unique();            // client id (tc-…), stable upsert key
            $table->string('code')->nullable();             // Kode Kompetensi, e.g. TC-001
            $table->string('name');
            $table->string('category');                     // Kompetensi Teknis | Manajerial | Perilaku
            $table->text('definition')->nullable();
            $table->json('indicators')->nullable();         // [{level, indicator}] — length follows the level scale
            $table->json('key_actions')->nullable();        // Perilaku Utama (behavioural dict; no per-level scale)
            $table->string('job_family')->nullable();       // Daftar grouping
            $table->string('job_family_name')->nullable();
            $table->string('function_name')->nullable();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('category');
            $table->index('code');
            $table->index('job_family_name');
        });

        // The proficiency scale (Knowledgeable → Expert). Small and global; the
        // level number is the identity, so it doubles as the upsert key.
        Schema::create('competency_levels', function (Blueprint $table) {
            $table->id();
            $table->unsignedTinyInteger('level')->unique();
            $table->string('name');
            $table->text('description')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('competency_levels');
        Schema::dropIfExists('competency_dictionary');
    }
};
