<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rekam_medis', function (Blueprint $table) {
            $table->id('id_rekam_medis');
            $table->foreignId('id_riwayat')->constrained('riwayat_layanan', 'id_riwayat')->onDelete('cascade');
            $table->foreignId('id_dokter')->constrained('dokter', 'id_dokter')->onDelete('cascade');
            $table->text('diagnosa')->nullable();
            $table->text('diagnosa_lengkap')->nullable();
            $table->text('catatan_dokter')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rekam_medis');
    }
};