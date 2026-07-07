<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('service_requests', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('title');
            $table->string('requester');
            $table->string('priority')->default('Medium');
            $table->string('sla')->default('Within SLA'); // Within SLA | At Risk | Breached
            $table->string('status')->default('New'); // New | In Progress | Waiting Approval | Resolved
            $table->foreignId('pic_id')->nullable()->constrained('users')->nullOnDelete();
            $table->string('pic')->nullable();
            $table->softDeletes();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('service_requests');
    }
};
