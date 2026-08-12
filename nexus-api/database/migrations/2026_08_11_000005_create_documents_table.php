<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Document Management — the frontend already calls GET/POST/PUT/DELETE /documents
 * (against a route that didn't exist); this gives it a durable, queryable home.
 * Global catalogue; typed columns per DocItem field. Keyed by the client doc_id
 * so the loose client sync (POST full doc, PUT partial) round-trips as-is.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('documents', function (Blueprint $table) {
            $table->id();
            $table->string('doc_id')->unique();   // client id (doc-…)
            $table->string('title');
            $table->string('type')->nullable();   // SOP | Guideline | Template | Presentation
            $table->string('folder')->nullable();
            $table->string('owner')->nullable();
            $table->string('version')->nullable();
            $table->string('approval')->default('Pending'); // Approved | Pending | Rejected
            $table->boolean('signed')->default(false);
            $table->date('updated')->nullable();  // the document's display "updated" date
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('folder');
            $table->index('type');
            $table->index('approval');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('documents');
    }
};
