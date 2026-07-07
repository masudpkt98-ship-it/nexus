<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('meetings', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('scheduled_label')->nullable();
            $table->dateTime('scheduled_at')->nullable();
            $table->unsignedSmallInteger('attendees')->default(0);
            $table->unsignedSmallInteger('action_items')->default(0);
            $table->timestamps();
        });

        Schema::create('knowledge_docs', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('category');
            $table->string('version')->default('v1.0');
            $table->string('type')->default('SOP'); // SOP | Guideline | Template | Presentation
            $table->string('approval')->default('Approved'); // Approved | Pending
            $table->string('owner')->nullable();
            $table->date('updated_on')->nullable();
            $table->timestamps();
        });

        Schema::create('notifications_center', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('channel')->default('In-App'); // In-App | Email | WhatsApp | Push
            $table->string('kind')->default('system'); // deadline | approval | training | birthday | system
            $table->string('title');
            $table->string('time_label')->nullable();
            $table->boolean('read')->default(false);
            $table->timestamps();
        });

        Schema::create('activities', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('actor');
            $table->string('action');
            $table->string('target');
            $table->string('type')->default('task'); // task | approval | kpi | training | request | meeting
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('activities');
        Schema::dropIfExists('notifications_center');
        Schema::dropIfExists('knowledge_docs');
        Schema::dropIfExists('meetings');
    }
};
