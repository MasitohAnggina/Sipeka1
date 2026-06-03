<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('pembayaran', function (Blueprint $table) {
            // Jadikan nullable semua kolom yang NOT NULL tanpa default
            $table->string('metode_pembayaran')->nullable()->change();
            $table->decimal('jumlah_bayar', 10, 2)->nullable()->change();

            // Tambah kolom 'metode' dan 'jumlah' yang dipakai controller
            if (!Schema::hasColumn('pembayaran', 'metode')) {
                $table->string('metode')->nullable()->after('status');
            }
            if (!Schema::hasColumn('pembayaran', 'jumlah')) {
                $table->integer('jumlah')->default(0)->after('metode');
            }
        });
    }

    public function down(): void
    {
        Schema::table('pembayaran', function (Blueprint $table) {
            $table->string('metode_pembayaran')->nullable(false)->change();
            $table->decimal('jumlah_bayar', 10, 2)->nullable(false)->change();
        });
    }
};