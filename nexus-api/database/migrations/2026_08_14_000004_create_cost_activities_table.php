<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Cost Optimization — "Sistem Pengelolaan Kegiatan & Biaya Bagian".
 *
 * One activity is one proposal and one LPJ, moving Draft → Waiting Approval →
 * In Progress → LPJ Review → Closed. The header fields that the dashboard filters
 * and totals by get their own columns so status counts and budget rollups stay
 * queryable; the repeating parts (budget lines, realisasi, evidence ticks, the
 * LPJ narrative, travel detail) are JSON because their shape is a list whose
 * length follows the activity, not a fixed set of columns.
 *
 * The module never deleted an activity — the lifecycle ends at Closed — so there
 * is no destroy path, only upsert by the client id.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('cost_activities', function (Blueprint $table) {
            $table->id();
            $table->string('activity_id')->unique();   // client id, stable upsert key
            $table->string('ref_no')->nullable();      // ACT-2026-015
            $table->string('nama');
            $table->string('jenis')->nullable();       // Pelatihan | Rapat | Perjalanan Dinas | …
            $table->text('tujuan')->nullable();
            $table->text('latar_belakang')->nullable();
            $table->text('output')->nullable();
            $table->date('tanggal')->nullable();
            $table->string('lokasi')->nullable();
            $table->string('penanggung_jawab')->nullable();
            $table->text('peserta')->nullable();
            $table->json('budget')->nullable();        // [{component, qty, price}]
            $table->json('travel')->nullable();        // TravelDetail | null
            $table->json('attachments')->nullable();   // ticked proposal attachments
            $table->json('realizations')->nullable();  // [{id, tanggal, nomorBukti, vendor, …}]
            $table->json('evidence')->nullable();      // ticked "category:item" keys
            $table->json('lpj')->nullable();           // LPJ narrative fields
            $table->string('status')->default('Draft');
            $table->string('created_at_label')->nullable(); // the client's createdAt, kept verbatim
            $table->foreignId('updated_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index('status');
            $table->index('jenis');
            $table->index('tanggal');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('cost_activities');
    }
};
