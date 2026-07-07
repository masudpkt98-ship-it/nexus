<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // AI Assistant insights
        Schema::create('ai_insights', function (Blueprint $table) {
            $table->id();
            $table->string('type'); // risk | recommendation | prediction | summary
            $table->string('title');
            $table->text('body');
            $table->unsignedTinyInteger('confidence')->default(80);
            $table->unsignedSmallInteger('position')->default(0);
            $table->timestamps();
        });

        // Customer satisfaction by service line
        Schema::create('satisfaction_services', function (Blueprint $table) {
            $table->id();
            $table->string('service');
            $table->decimal('score', 3, 2)->default(0); // out of 5
            $table->unsignedSmallInteger('position')->default(0);
            $table->timestamps();
        });

        // Raw NPS survey responses (0-10) — NPS is computed from these
        Schema::create('nps_responses', function (Blueprint $table) {
            $table->id();
            $table->unsignedTinyInteger('score'); // 0-10
            $table->timestamps();
        });

        // Generic monthly metric time-series (kpi, satisfaction, indices…)
        Schema::create('metric_points', function (Blueprint $table) {
            $table->id();
            $table->string('series')->index();
            $table->string('label', 16);
            $table->decimal('value', 8, 2);
            $table->unsignedSmallInteger('position')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('metric_points');
        Schema::dropIfExists('nps_responses');
        Schema::dropIfExists('satisfaction_services');
        Schema::dropIfExists('ai_insights');
    }
};
