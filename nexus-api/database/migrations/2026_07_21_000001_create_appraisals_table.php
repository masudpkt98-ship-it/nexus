<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Performance Appraisal record — one row per (unit_key, year). Holds the
        // governance state that MUST be server-enforced: approval status/version
        // and PBI scores. Row-level authorization scopes reads/writes by the
        // user's unit / directorate (see AppraisalController).
        Schema::create('appraisals', function (Blueprint $table) {
            $table->id();
            $table->string('unit_key');          // e.g. "korporat", "mnj:<dir>:<svp>"
            $table->string('unit_name')->nullable();
            $table->string('directorate')->nullable();
            $table->string('year');              // e.g. "2026"
            $table->string('status')->default('Drafted'); // Drafted | Approved
            $table->unsignedInteger('version')->default(1);
            $table->json('pbi')->nullable();     // { pbiId: { reward, punishment, skor } }
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['unit_key', 'year']);
            $table->index('directorate');
            $table->index('unit_name');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('appraisals');
    }
};
