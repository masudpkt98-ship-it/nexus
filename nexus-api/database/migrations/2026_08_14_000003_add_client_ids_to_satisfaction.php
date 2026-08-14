<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Give satisfaction services a client id, and NPS responses a service link.
 *
 * The page owns service ids (`svc-…`) and edits a service in place, so the upsert
 * key has to be that id rather than the auto-increment one it never sees.
 *
 * NPS itself needs no new table: the page collects a 1–5 rating and buckets it
 * promoter (5) / passive (4) / detractor (≤3), while nps_responses already stores
 * a 0–10 score that SatisfactionController buckets promoter (≥9) / detractor (≤6).
 * Storing rating × 2 maps the two scales exactly — 5→10, 4→8, 3→6, 2→4, 1→2 —
 * so the existing computation keeps working unchanged.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('satisfaction_services', function (Blueprint $table) {
            $table->string('service_id')->nullable()->after('id');
        });

        foreach (DB::table('satisfaction_services')->select('id')->get() as $row) {
            DB::table('satisfaction_services')->where('id', $row->id)->update(['service_id' => 'svc-'.$row->id]);
        }

        Schema::table('satisfaction_services', function (Blueprint $table) {
            $table->unique('service_id');
        });

        Schema::table('nps_responses', function (Blueprint $table) {
            // Which service the rating was about, when the respondent picked one.
            $table->string('service_id')->nullable()->after('score');
            $table->index('service_id');
        });
    }

    public function down(): void
    {
        Schema::table('nps_responses', function (Blueprint $table) {
            $table->dropIndex(['service_id']);
            $table->dropColumn('service_id');
        });
        Schema::table('satisfaction_services', function (Blueprint $table) {
            $table->dropUnique(['service_id']);
            $table->dropColumn('service_id');
        });
    }
};
