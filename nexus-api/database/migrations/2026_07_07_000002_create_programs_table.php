<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('programs', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->foreignId('owner_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('status')->default('On Track'); // On Track | At Risk | Delayed | Completed
            $table->unsignedTinyInteger('progress')->default(0);
            $table->unsignedInteger('budget')->default(0); // in $k
            $table->unsignedInteger('spent')->default(0);
            $table->string('risk')->default('Low'); // Low | Medium | High
            $table->unsignedTinyInteger('milestones')->default(0);
            $table->unsignedTinyInteger('milestones_done')->default(0);
            $table->date('start_date')->nullable();
            $table->date('end_date')->nullable();
            $table->softDeletes();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('programs');
    }
};
