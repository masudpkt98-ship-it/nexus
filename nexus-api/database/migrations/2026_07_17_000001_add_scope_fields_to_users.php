<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('npk')->nullable()->index();
            $table->string('unit')->nullable();        // Unit Kerja (data scope)
            $table->string('directorate')->nullable(); // Direktorat (scope for Manajemen)
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['npk', 'unit', 'directorate']);
        });
    }
};
