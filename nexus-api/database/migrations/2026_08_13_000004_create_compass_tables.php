<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * COMPASS — the editable Competency Development surfaces that had no storage
 * beyond this browser: Gap Analysis levels, Job Profile descriptions and OJT.
 *
 * The read-only COMPASS pages (LMS, Learning Journey, Mentoring, Certification,
 * Assessment) render committed seeds and take no user input, so they have no
 * table here — there is nothing of the user's to lose.
 */
return new class extends Migration
{
    public function up(): void
    {
        // Gap Analysis: an employee's current level per competency. The page keys
        // these as `npk|code`; split into columns so a person's assessed levels
        // can be queried directly (the Passport page reads the same data).
        Schema::create('competency_current_levels', function (Blueprint $table) {
            $table->id();
            $table->string('npk');
            $table->string('comp_code');               // competency code, e.g. TC-001
            $table->unsignedTinyInteger('level')->default(0); // 0 = not assessed
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['npk', 'comp_code']);
        });

        // Job Profile: the job description captured per jabatan, imported from the
        // .docx/.xlsx job profiles. Keyed by the page's normalized jabatan key.
        Schema::create('job_descriptions', function (Blueprint $table) {
            $table->id();
            $table->string('desc_key')->unique();      // normalized jabatan (match key)
            $table->string('jabatan_name')->nullable();
            $table->string('kode_jabatan')->nullable();
            $table->string('direktorat')->nullable();
            $table->string('kompartemen')->nullable();
            $table->string('departemen')->nullable();
            $table->text('purpose')->nullable();
            $table->json('responsibilities')->nullable(); // [{text, kpis:[…]}]
            $table->text('dimensi')->nullable();
            $table->text('authority')->nullable();
            $table->text('relations')->nullable();
            $table->text('qualifications')->nullable();
            $table->text('certifications')->nullable();
            $table->text('risks')->nullable();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('jabatan_name');
        });

        // OJT & Job Shadowing: status cycles through Belum → Berjalan → Selesai.
        Schema::create('ojt_items', function (Blueprint $table) {
            $table->id();
            $table->string('item_id')->unique();       // client id, stable upsert key
            $table->string('employee');
            $table->string('role')->nullable();
            $table->string('kind');                    // OJT | Job Shadowing
            $table->text('activity')->nullable();
            $table->string('mentor')->nullable();
            $table->string('status')->default('Belum');
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('kind');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ojt_items');
        Schema::dropIfExists('job_descriptions');
        Schema::dropIfExists('competency_current_levels');
    }
};
