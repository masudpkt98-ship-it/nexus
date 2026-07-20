<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Employee Directory (PII). The full Employee object is kept in `payload`;
        // dedicated columns (unit_name = unit kerja, directorate) drive row-level
        // scoping so a user only ever receives employees within their scope. The
        // raw xlsx is imported ONCE to the server (admin), never into every browser.
        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->string('npk')->unique();
            $table->string('name')->nullable();
            $table->string('unit_name')->nullable();      // Unit Kerja (scoping)
            $table->string('directorate')->nullable();    // scoping
            $table->json('payload');                      // full Employee record
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('unit_name');
            $table->index('directorate');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
};
