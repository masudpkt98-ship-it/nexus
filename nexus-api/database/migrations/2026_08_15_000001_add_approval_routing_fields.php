<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Wiring for the Cost Optimization approval queue.
 *
 * `cost_activities.created_by` records who raised an activity. Without it the
 * result of a decision has nowhere to go — `updated_by` is whoever touched the
 * row last, which after an approval is the approver, not the submitter.
 *
 * `notifications_center.link` lets a notification point at what it is about, so
 * "Proposal menunggu persetujuan" can open that activity instead of leaving the
 * reader to find it. The table already had a nullable user_id for targeting and
 * an 'approval' kind — both were simply never used.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('cost_activities', function (Blueprint $table) {
            $table->foreignId('created_by')->nullable()->after('status')->constrained('users')->nullOnDelete();
        });

        Schema::table('notifications_center', function (Blueprint $table) {
            $table->string('link')->nullable()->after('title');
        });
    }

    public function down(): void
    {
        Schema::table('notifications_center', function (Blueprint $table) {
            $table->dropColumn('link');
        });
        Schema::table('cost_activities', function (Blueprint $table) {
            $table->dropConstrainedForeignId('created_by');
        });
    }
};
