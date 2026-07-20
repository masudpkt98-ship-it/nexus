<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Performance Monitoring — one Realisasi per (kpi_id, slot). Carries the
        // owning unit so reads/writes can be row-level scoped by unit/directorate
        // (see RealizationController). `slot` encodes year+granularity, e.g. 2026-B6.
        Schema::create('realizations', function (Blueprint $table) {
            $table->id();
            $table->string('kpi_id');
            $table->string('slot');              // "2026-B6" | "2026-Q2" | "2026-S1" | "2026-Y0"
            $table->string('year');
            $table->string('unit_key')->nullable();
            $table->string('unit_name')->nullable();
            $table->string('directorate')->nullable();
            $table->double('value')->nullable();
            $table->string('evidence_type')->nullable(); // upload | link
            $table->longText('evidence')->nullable();     // data URL (upload) or URL (link)
            $table->string('evidence_name')->nullable();
            $table->text('note')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->unique(['kpi_id', 'slot']);
            $table->index('year');
            $table->index('directorate');
            $table->index('unit_name');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('realizations');
    }
};
