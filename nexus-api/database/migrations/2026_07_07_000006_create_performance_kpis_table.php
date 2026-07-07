<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('performance_kpis', function (Blueprint $table) {
            $table->id();
            $table->string('code')->unique();
            $table->string('name');
            $table->string('level')->default('Department'); // Corporate | Department | Individual
            $table->unsignedTinyInteger('weight')->default(0);
            $table->decimal('target', 8, 2)->default(0);
            $table->decimal('actual', 8, 2)->default(0);
            $table->string('unit', 8)->default('%');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('performance_kpis');
    }
};
