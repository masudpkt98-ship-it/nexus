<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('title');
            $table->text('description')->nullable();
            $table->string('status')->default('Backlog'); // Backlog | In Progress | Review | Done
            $table->string('priority')->default('Medium'); // Low | Medium | High | Critical
            $table->foreignId('assignee_id')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('program_id')->nullable()->constrained('programs')->nullOnDelete();
            $table->date('due_date')->nullable();
            $table->unsignedTinyInteger('checklist_total')->default(0);
            $table->unsignedTinyInteger('checklist_done')->default(0);
            $table->unsignedSmallInteger('comments_count')->default(0);
            $table->json('tags')->nullable();
            $table->softDeletes();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
