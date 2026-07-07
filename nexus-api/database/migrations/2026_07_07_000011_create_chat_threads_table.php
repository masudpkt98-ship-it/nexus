<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('chat_threads', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('title')->default('New chat');
            $table->timestamps();

            $table->index(['user_id', 'updated_at']);
        });

        Schema::table('chat_messages', function (Blueprint $table) {
            $table->foreignId('thread_id')->nullable()->after('user_id')
                ->constrained('chat_threads')->cascadeOnDelete();
        });

        // Backfill: move any existing messages into one thread per user.
        foreach (DB::table('chat_messages')->distinct()->pluck('user_id') as $userId) {
            $threadId = DB::table('chat_threads')->insertGetId([
                'user_id' => $userId,
                'title' => 'Conversation',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
            DB::table('chat_messages')->where('user_id', $userId)
                ->whereNull('thread_id')->update(['thread_id' => $threadId]);
        }
    }

    public function down(): void
    {
        Schema::table('chat_messages', function (Blueprint $table) {
            $table->dropConstrainedForeignId('thread_id');
        });
        Schema::dropIfExists('chat_threads');
    }
};
