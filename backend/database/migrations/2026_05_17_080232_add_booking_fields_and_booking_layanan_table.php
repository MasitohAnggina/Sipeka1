<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Migration ini menambahkan:
 *
 * 1. hewan.berat            → berat hewan (Kg)
 * 2. booking.jam            → jam booking (string "14:00")
 * 3. booking.catatan        → catatan pemilik per hewan
 * 4. booking.foto_before    → path foto kondisi sebelum sakit
 * 5. booking.foto_after     → path foto kondisi saat sakit
 * 6. Tabel booking_layanan  → pivot many-to-many booking ↔ layanan
 *                             (satu booking bisa punya banyak layanan)
 *
 * Jalankan: php artisan migrate
 */
return new class extends Migration
{
    public function up(): void
    {
        // ── 1. Tambah berat ke tabel hewan ────────────────────────────────────
        if (!Schema::hasColumn('hewan', 'berat')) {
            Schema::table('hewan', function (Blueprint $table) {
                $table->decimal('berat', 6, 2)->nullable()->after('umur')
                      ->comment('Berat hewan dalam Kg');
            });
        }

        // ── 2. Tambah kolom ke tabel booking ──────────────────────────────────
        Schema::table('booking', function (Blueprint $table) {
            if (!Schema::hasColumn('booking', 'jam')) {
                $table->string('jam', 10)->nullable()
                      ->after('tanggal_booking')
                      ->comment('Jam booking misal 14:00');
            }
            if (!Schema::hasColumn('booking', 'catatan')) {
                $table->text('catatan')->nullable()
                      ->after('jam')
                      ->comment('Catatan pemilik untuk hewan ini');
            }
            if (!Schema::hasColumn('booking', 'foto_before')) {
                $table->string('foto_before')->nullable()
                      ->after('catatan')
                      ->comment('Path foto kondisi sehat/sebelum sakit');
            }
            if (!Schema::hasColumn('booking', 'foto_after')) {
                $table->string('foto_after')->nullable()
                      ->after('foto_before')
                      ->comment('Path foto kondisi saat sakit/terkini');
            }
        });

        // ── 3. Buat tabel pivot booking_layanan ───────────────────────────────
        if (!Schema::hasTable('booking_layanan')) {
            Schema::create('booking_layanan', function (Blueprint $table) {
                $table->id();
                $table->unsignedBigInteger('id_booking');
                $table->unsignedBigInteger('id_layanan');
                // Snapshot harga saat booking dibuat (harga bisa berubah di tabel layanan)
                $table->decimal('harga_saat_booking', 10, 2)->default(0);
                $table->timestamps();

                $table->foreign('id_booking')
                      ->references('id_booking')->on('booking')
                      ->onDelete('cascade');

                $table->foreign('id_layanan')
                      ->references('id_layanan')->on('layanan')
                      ->onDelete('cascade');

                // Satu booking tidak boleh duplikat layanan yang sama
                $table->unique(['id_booking', 'id_layanan'], 'booking_layanan_unique');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('booking_layanan');

        Schema::table('booking', function (Blueprint $table) {
            foreach (['foto_after', 'foto_before', 'catatan', 'jam'] as $col) {
                if (Schema::hasColumn('booking', $col)) {
                    $table->dropColumn($col);
                }
            }
        });

        Schema::table('hewan', function (Blueprint $table) {
            if (Schema::hasColumn('hewan', 'berat')) {
                $table->dropColumn('berat');
            }
        });
    }
};