<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Quarterly (Triwulan) versioning for the Employee Directory.
 *
 * Before: employees were keyed uniquely by `npk`, so a new quarter's import
 * overwrote the previous record — a person's position history was lost.
 * After: each (npk, period) is its own snapshot, so importing "TW2-2026" never
 * touches "TW1-2026". This preserves per-employee job history across quarters.
 *
 * Existing rows are backfilled to a single default period so nothing is lost.
 */
return new class extends Migration
{
    private const DEFAULT_PERIOD = 'TW1-2026';

    public function up(): void
    {
        // 1) Add the period column and backfill existing rows.
        Schema::table('employees', function (Blueprint $table) {
            $table->string('period')->default(self::DEFAULT_PERIOD)->after('npk');
        });

        // 2) Swap the uniqueness from `npk` alone to (npk, period).
        Schema::table('employees', function (Blueprint $table) {
            $table->dropUnique(['npk']);          // drops employees_npk_unique
            $table->unique(['npk', 'period']);    // one row per employee per quarter
            $table->index('period');
        });
    }

    public function down(): void
    {
        Schema::table('employees', function (Blueprint $table) {
            $table->dropUnique(['npk', 'period']);
            $table->dropIndex(['period']);
            $table->unique('npk');
            $table->dropColumn('period');
        });
    }
};
