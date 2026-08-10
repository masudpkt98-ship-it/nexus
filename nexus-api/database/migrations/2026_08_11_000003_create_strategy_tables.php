<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Strategy — the corporate strategy artifact (Vision, Mission, Core Values,
 * SWOT, Strategic Goals). Global (one company strategy); objectives.manage to
 * write. Typed columns per dimension (not a blob) so it stays queryable.
 *
 * strategy_items holds the light artifacts (vision/mission/value/swot) keyed by
 * kind; strategy_goals is the richer Strategic Goal with its nested strategies.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('strategy_items', function (Blueprint $table) {
            $table->id();
            $table->string('kind');                    // vision | mission | value | swot
            $table->string('item_id')->unique();       // client id (ms-… / cv-… / sw-… / vision)
            $table->text('text')->nullable();          // mission/swot/vision statement
            $table->string('letter')->nullable();      // core value initial
            $table->string('title')->nullable();       // core value title
            $table->text('description')->nullable();    // core value description
            $table->string('swot_type')->nullable();   // Strength | Weakness | Opportunity | Threat
            $table->integer('position')->default(0);   // display order
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('kind');
            $table->index('swot_type');
        });

        Schema::create('strategy_goals', function (Blueprint $table) {
            $table->id();
            $table->string('goal_id')->unique();       // client id (sg-…)
            $table->string('code')->nullable();        // Kode Sasaran (PRD-01)
            $table->string('division')->nullable();    // Bidang (owning function)
            $table->string('title');                   // Sasaran statement
            $table->string('target')->nullable();      // RKAP horizon
            $table->string('owner')->nullable();
            $table->text('description')->nullable();
            $table->json('strategies')->nullable();    // [{strategy, programs}]
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('division');
            $table->index('code');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('strategy_goals');
        Schema::dropIfExists('strategy_items');
    }
};
