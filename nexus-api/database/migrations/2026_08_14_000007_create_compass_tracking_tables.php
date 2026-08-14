<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The five COMPASS tracking modules — LMS, Learning Journey, Mentoring,
 * Certification and Assessment.
 *
 * These pages rendered committed seeds and accepted no input, so they were left
 * out of the earlier persistence work: there was nothing of the user's to lose.
 * They now take real records, so they need real tables.
 *
 * `compass_assessment_records` is deliberately NOT called competency_assessments:
 * that name already belongs to the Competency Matrix, which stores an employee's
 * level per competency per group. This one is a single assessment event (method,
 * assessor, score, status) and shares nothing with it but the word.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('compass_lms_modules', function (Blueprint $table) {
            $table->id();
            $table->string('module_id')->unique();     // client id, stable upsert key
            $table->string('title');
            $table->string('competency')->nullable();  // linked competency topic
            $table->string('type')->default('Video');  // Video | PDF | Animasi | eBook | Quiz | SOP
            $table->string('duration')->nullable();    // display label, e.g. "15 menit"
            $table->unsignedTinyInteger('level')->default(1); // target level 1..5
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('type');
            $table->index('competency');
        });

        Schema::create('compass_journeys', function (Blueprint $table) {
            $table->id();
            $table->string('journey_id')->unique();
            $table->string('employee');
            $table->string('role')->nullable();
            // [{week, items:[…]}] — the week count varies per journey, so the
            // sequence is stored whole rather than as a child table nothing else joins.
            $table->json('weeks')->nullable();
            $table->unsignedTinyInteger('progress')->default(0);
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('employee');
        });

        Schema::create('compass_mentoring_sessions', function (Blueprint $table) {
            $table->id();
            $table->string('session_id')->unique();
            $table->string('employee');
            $table->string('mentor')->nullable();
            $table->string('kind')->default('Mentoring'); // Mentoring | Coaching
            $table->string('topic')->nullable();
            $table->text('notes')->nullable();
            $table->text('action_plan')->nullable();
            $table->date('date')->nullable();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('employee');
        });

        Schema::create('compass_certifications', function (Blueprint $table) {
            $table->id();
            $table->string('cert_id')->unique();
            $table->string('employee');
            $table->string('title');
            $table->string('level')->nullable();
            $table->string('status')->default('In Progress'); // Competent | In Progress | Expired
            $table->date('issued')->nullable();
            $table->date('expires')->nullable();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('employee');
            $table->index('status');
        });

        Schema::create('compass_assessment_records', function (Blueprint $table) {
            $table->id();
            $table->string('record_id')->unique();
            $table->string('employee');
            $table->string('competency')->nullable();
            $table->string('method')->default('Quiz'); // Quiz | Praktik | Wawancara | …
            $table->string('assessor')->nullable();
            // Null until the assessment is graded — distinct from a score of 0.
            $table->unsignedTinyInteger('score')->nullable();
            $table->string('status')->default('Dijadwalkan'); // Dijadwalkan | Dinilai | Lulus | Tidak Lulus
            $table->date('date')->nullable();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('employee');
            $table->index('status');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('compass_assessment_records');
        Schema::dropIfExists('compass_certifications');
        Schema::dropIfExists('compass_mentoring_sessions');
        Schema::dropIfExists('compass_journeys');
        Schema::dropIfExists('compass_lms_modules');
    }
};
