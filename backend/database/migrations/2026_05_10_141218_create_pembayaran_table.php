<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('pembayaran', function (Blueprint $table) {
            $table->id('id_pembayaran');
            $table->foreignId('id_riwayat')->constrained('riwayat_layanan', 'id_riwayat')->onDelete('cascade');
            $table->string('metode_pembayaran');
            $table->enum('status', ['menunggu', 'lunas', 'gagal'])->default('menunggu');
            $table->decimal('jumlah_bayar', 10, 2);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('pembayaran');
    }
};