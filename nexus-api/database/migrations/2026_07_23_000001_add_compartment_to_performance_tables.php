<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Kompartemen (SVP) each row belongs to — lets KPI Partner Manajemen be
        // scoped to their compartment instead of the whole directorate.
        foreach (['appraisals', 'realizations', 'planning_kpis', 'planning_owners'] as $table) {
            Schema::table($table, function (Blueprint $t) {
                $t->string('compartment')->nullable()->index()->after('directorate');
            });
        }
    }

    public function down(): void
    {
        foreach (['appraisals', 'realizations', 'planning_kpis', 'planning_owners'] as $table) {
            Schema::table($table, function (Blueprint $t) {
                $t->dropColumn('compartment');
            });
        }
    }
};
