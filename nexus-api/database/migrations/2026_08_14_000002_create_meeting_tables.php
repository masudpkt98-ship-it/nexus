<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Meetings: a client id for the existing table, plus the agenda and action items
 * that had no storage at all.
 *
 * The page already POSTed/PUT/DELETEd /meetings, but only a GET route existed —
 * every write 404'd into a `.catch(() => {})`, exactly like Documents before
 * dcd512e. MeetingResource exposed `'M'.$id`, an id the client could never map
 * back to a row, so `meeting_id` is backfilled to that same value: existing
 * clients keep the ids they already cached.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('meetings', function (Blueprint $table) {
            $table->string('meeting_id')->nullable()->after('id');
        });

        // Backfill before the unique index so seeded rows don't collide on NULL.
        foreach (DB::table('meetings')->select('id')->get() as $row) {
            DB::table('meetings')->where('id', $row->id)->update(['meeting_id' => 'M'.$row->id]);
        }

        Schema::table('meetings', function (Blueprint $table) {
            $table->unique('meeting_id');
        });

        Schema::create('meeting_agenda_items', function (Blueprint $table) {
            $table->id();
            $table->string('item_id')->unique();   // client id (ag-…)
            $table->text('text');
            $table->unsignedSmallInteger('position')->default(0);
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });

        Schema::create('meeting_action_items', function (Blueprint $table) {
            $table->id();
            $table->string('item_id')->unique();   // client id (ac-…)
            $table->string('assignee')->nullable();
            $table->text('text');
            $table->string('status')->default('Open'); // Open | Done
            $table->unsignedSmallInteger('position')->default(0);
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('meeting_action_items');
        Schema::dropIfExists('meeting_agenda_items');
        Schema::table('meetings', function (Blueprint $table) {
            $table->dropUnique(['meeting_id']);
            $table->dropColumn('meeting_id');
        });
    }
};
