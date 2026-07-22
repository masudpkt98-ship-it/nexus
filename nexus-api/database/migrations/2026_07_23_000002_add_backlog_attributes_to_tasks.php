<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Backlog attributes from Task.png / BusinessValue.png. All nullable & additive
 * so existing tasks and the loose client sync keep working.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->string('category')->nullable()->after('priority');       // Project, Improvement, Incident, …
            $table->string('business_value')->nullable()->after('category'); // Revenue Increase, Cost Reduction, …
            $table->unsignedSmallInteger('effort_value')->nullable()->after('business_value');
            $table->string('effort_unit')->nullable()->after('effort_value'); // Jam | Hari
            $table->string('requester')->nullable()->after('effort_unit');
            $table->string('sprint')->nullable()->after('requester');        // Target Sprint / Periode
            $table->json('dependencies')->nullable()->after('sprint');       // ids of dependent tasks
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropColumn([
                'category', 'business_value', 'effort_value', 'effort_unit',
                'requester', 'sprint', 'dependencies',
            ]);
        });
    }
};
