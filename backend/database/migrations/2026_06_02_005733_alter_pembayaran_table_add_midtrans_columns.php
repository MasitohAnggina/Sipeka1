<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Step 1: tambah kolom id_resep dan id_user
        Schema::table('pembayaran', function (Blueprint $table) {
            if (!Schema::hasColumn('pembayaran', 'id_resep')) {
                $table->unsignedBigInteger('id_resep')->nullable()->after('id_pembayaran');
                $table->foreign('id_resep')
                      ->references('id_resep')->on('resep')
                      ->onDelete('cascade');
            }

            if (!Schema::hasColumn('pembayaran', 'id_user')) {
                $table->unsignedBigInteger('id_user')->nullable()->after('id_resep');
                $table->foreign('id_user')
                      ->references('id_user')->on('users');
            }

            // Drop kolom status lama
            if (Schema::hasColumn('pembayaran', 'status')) {
                $table->dropColumn('status');
            }
        });

        // Step 2: buat ulang kolom status dengan enum baru
        Schema::table('pembayaran', function (Blueprint $table) {
            if (!Schema::hasColumn('pembayaran', 'status')) {
                $table->enum('status', [
                    'menunggu_pembayaran',
                    'pending_cash',
                    'pending_midtrans',
                    'lunas',
                    'gagal',
                ])->default('menunggu_pembayaran')->after('id_user');
            }
        });

        // Step 3: tambah kolom Midtrans dan admin
        Schema::table('pembayaran', function (Blueprint $table) {
            if (!Schema::hasColumn('pembayaran', 'snap_token')) {
                $table->string('snap_token')->nullable();
            }
            if (!Schema::hasColumn('pembayaran', 'midtrans_order_id')) {
                $table->string('midtrans_order_id')->nullable();
            }
            if (!Schema::hasColumn('pembayaran', 'midtrans_transaction_id')) {
                $table->string('midtrans_transaction_id')->nullable();
            }
            if (!Schema::hasColumn('pembayaran', 'midtrans_payment_type')) {
                $table->string('midtrans_payment_type')->nullable();
            }
            if (!Schema::hasColumn('pembayaran', 'midtrans_raw')) {
                $table->json('midtrans_raw')->nullable();
            }
            if (!Schema::hasColumn('pembayaran', 'dikonfirmasi_oleh')) {
                $table->unsignedBigInteger('dikonfirmasi_oleh')->nullable();
                $table->foreign('dikonfirmasi_oleh')
                      ->references('id_user')->on('users')->nullOnDelete();
            }
            if (!Schema::hasColumn('pembayaran', 'dikonfirmasi_at')) {
                $table->timestamp('dikonfirmasi_at')->nullable();
            }
            if (!Schema::hasColumn('pembayaran', 'catatan_admin')) {
                $table->text('catatan_admin')->nullable();
            }
            if (!Schema::hasColumn('pembayaran', 'no_referensi')) {
                $table->string('no_referensi')->nullable();
            }
        });
    }

    public function down(): void
    {
        Schema::table('pembayaran', function (Blueprint $table) {
            // Drop foreign keys jika ada
            $fks = ['id_resep', 'id_user', 'dikonfirmasi_oleh'];
            foreach ($fks as $fk) {
                if (Schema::hasColumn('pembayaran', $fk)) {
                    $table->dropForeign(['pembayaran_' . $fk . '_foreign']);
                }
            }

            // Drop kolom jika ada
            $cols = [
                'id_resep', 'id_user', 'status',
                'snap_token', 'midtrans_order_id',
                'midtrans_transaction_id', 'midtrans_payment_type',
                'midtrans_raw', 'dikonfirmasi_oleh',
                'dikonfirmasi_at', 'catatan_admin', 'no_referensi',
            ];
            $existing = array_filter($cols, fn($c) => Schema::hasColumn('pembayaran', $c));
            if (!empty($existing)) {
                $table->dropColumn(array_values($existing));
            }

            // Kembalikan kolom status lama
            if (!Schema::hasColumn('pembayaran', 'status')) {
                $table->enum('status', ['menunggu', 'lunas', 'gagal'])
                      ->default('menunggu');
            }
        });
    }
};