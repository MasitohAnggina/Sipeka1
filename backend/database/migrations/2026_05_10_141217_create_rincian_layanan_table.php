<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rincian_layanan', function (Blueprint $table) {
            $table->id('id_rincian');
            $table->foreignId('id_riwayat')->constrained('riwayat_layanan', 'id_riwayat')->onDelete('cascade');
            $table->foreignId('id_layanan')->constrained('layanan', 'id_layanan')->onDelete('cascade');
            $table->foreignId('id_obat')->nullable()->constrained('obat', 'id_obat')->onDelete('set null');
            $table->string('tipe')->nullable();
            $table->integer('jumlah')->default(1);
            $table->decimal('harga_satuan', 10, 2);
            $table->decimal('subtotal', 10, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rincian_layanan');
    }
};