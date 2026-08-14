<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Give knowledge docs a client id so the page can address one.
 *
 * The page POSTed, PUT and DELETEd /knowledge-docs while only a GET route
 * existed, so every write 404'd into a silent .catch — the module looked live
 * (it even showed a LiveBadge) but nothing ever left the browser. On top of that
 * KnowledgeDocResource exposed `'D'.$id`, which no route could resolve back, so
 * the writes could not have landed even with routes in place.
 *
 * `doc_id` is backfilled to that same `D{id}` value, so ids already cached by
 * clients keep resolving.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('knowledge_docs', function (Blueprint $table) {
            $table->string('doc_id')->nullable()->after('id');
        });

        foreach (DB::table('knowledge_docs')->select('id')->get() as $row) {
            DB::table('knowledge_docs')->where('id', $row->id)->update(['doc_id' => 'D'.$row->id]);
        }

        Schema::table('knowledge_docs', function (Blueprint $table) {
            $table->unique('doc_id');
        });
    }

    public function down(): void
    {
        Schema::table('knowledge_docs', function (Blueprint $table) {
            $table->dropUnique(['doc_id']);
            $table->dropColumn('doc_id');
        });
    }
};
