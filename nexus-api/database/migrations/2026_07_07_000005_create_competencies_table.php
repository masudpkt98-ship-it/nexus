<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('competencies', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('category');
            $table->unsignedTinyInteger('required_level')->default(3);
            $table->unsignedTinyInteger('current_level')->default(0);
            $table->timestamps();
        });

        Schema::create('development_plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('employee');
            $table->string('avatar', 4)->nullable();
            $table->string('role');
            $table->unsignedTinyInteger('readiness')->default(0);
            $table->unsignedTinyInteger('gaps')->default(0);
            $table->string('next_step')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('development_plans');
        Schema::dropIfExists('competencies');
    }
};
