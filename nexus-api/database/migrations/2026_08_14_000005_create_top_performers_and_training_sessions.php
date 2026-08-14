<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * The last two localStorage-only surfaces.
 *
 * `top_performers` backs the Performance hub's ranking. Its localStorage key is
 * "appraisals", which is NOT the appraisals table — that one holds the KPI
 * cascade's per-level appraisal rows and has an entirely different shape. The
 * name collision is the reason this list was overlooked; the table is named for
 * what the page actually shows.
 *
 * `training_sessions` backs the Development page's training calendar. `date` and
 * `seats` stay strings because the page displays them verbatim ("Mon · Jul 13 ·
 * 09:00", "12 / 20") rather than computing with them.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('top_performers', function (Blueprint $table) {
            $table->id();
            $table->string('perf_id')->unique();   // client id (ap-…), stable upsert key
            $table->string('name');
            $table->string('avatar', 4)->nullable();
            $table->string('role')->nullable();
            $table->unsignedTinyInteger('score')->default(0);
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('score');
        });

        Schema::create('training_sessions', function (Blueprint $table) {
            $table->id();
            $table->string('session_id')->unique(); // client id (ts-…)
            $table->string('name');
            $table->string('date')->nullable();     // display label, not a timestamp
            $table->string('seats')->nullable();    // "12 / 20"
            $table->unsignedSmallInteger('position')->default(0);
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('training_sessions');
        Schema::dropIfExists('top_performers');
    }
};
