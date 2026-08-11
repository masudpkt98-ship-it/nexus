<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Persist the Task fields the relational columns can't represent, so nothing is
 * lost when the client cache is replaced by the server on load:
 *  - subtasks / evidence: nested document data (json)
 *  - assignee_name / avatar: the client uses a free-text assignee, not a user FK
 *  - milestone_id: client milestone reference
 * All nullable & additive — existing tasks and the loose client sync keep working.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->string('assignee_name')->nullable()->after('assignee_id');
            $table->string('avatar')->nullable()->after('assignee_name');
            $table->string('program_ref')->nullable()->after('program_id'); // client program id
            $table->string('milestone_id')->nullable()->after('program_ref');
            $table->json('subtasks')->nullable()->after('dependencies');
            $table->json('evidence')->nullable()->after('subtasks');
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropColumn(['assignee_name', 'avatar', 'program_ref', 'milestone_id', 'subtasks', 'evidence']);
        });
    }
};
