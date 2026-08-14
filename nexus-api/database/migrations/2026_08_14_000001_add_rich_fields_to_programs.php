<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Give programs the fields the page actually edits, and milestones a table.
 *
 * ProgramResource returns `id => code` (PRG-01) but the routes bound {program} by
 * numeric id, so every edit and delete 404'd silently — the same defect Tasks had
 * before f5f4a32. The owner is free text in the UI but only existed here as an
 * owner_id foreign key, and the Strategic Goal / OKR links had no columns at all,
 * so both were dropped whenever the server list replaced the client cache.
 *
 * Milestones were never persisted anywhere: the page keeps a full list per
 * program, while `programs.milestones` is only a count.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('programs', function (Blueprint $table) {
            $table->string('owner_name')->nullable()->after('owner_id'); // free-text owner from the form
            $table->json('goal_ids')->nullable();                        // linked Strategic Goals
            $table->json('okr_ids')->nullable();                         // linked OKR objectives
        });

        Schema::create('program_milestones', function (Blueprint $table) {
            $table->id();
            $table->string('milestone_id')->unique();  // client id (mst-…), stable upsert key
            $table->string('program_code');            // → programs.code, the id the frontend uses
            $table->string('name');
            $table->date('due')->nullable();
            $table->string('status')->default('Planned'); // Planned | In Progress | Done
            $table->unsignedTinyInteger('progress')->default(0);
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('program_code');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('program_milestones');
        Schema::table('programs', function (Blueprint $table) {
            $table->dropColumn(['owner_name', 'goal_ids', 'okr_ids']);
        });
    }
};
