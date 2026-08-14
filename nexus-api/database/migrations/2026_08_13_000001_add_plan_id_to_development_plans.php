<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Give development_plans a stable client id.
 *
 * The Competency hub already rendered plans returned by GET /competency, but the
 * resource exposed no id — the frontend fabricated a positional `dp-{n}` on every
 * load, so an edit made against one load's ids could land on a different row after
 * the next. There were also no write routes at all, so plan edits lived only in
 * localStorage and were overwritten by the server list on the next sign-in.
 *
 * `plan_id` is the upsert key the frontend owns (same convention as corporate_kpis
 * / kpi_teknis / job_profiles). Existing seeded rows are backfilled to `dp-{id}`.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('development_plans', function (Blueprint $table) {
            $table->string('plan_id')->nullable()->after('id');
        });

        // Backfill before the unique index so seeded rows don't collide on NULL.
        foreach (DB::table('development_plans')->select('id')->get() as $row) {
            DB::table('development_plans')->where('id', $row->id)->update(['plan_id' => 'dp-'.$row->id]);
        }

        Schema::table('development_plans', function (Blueprint $table) {
            $table->unique('plan_id');
        });
    }

    public function down(): void
    {
        Schema::table('development_plans', function (Blueprint $table) {
            $table->dropUnique(['plan_id']);
            $table->dropColumn('plan_id');
        });
    }
};
