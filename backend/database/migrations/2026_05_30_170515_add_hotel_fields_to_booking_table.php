<?php
// database/migrations/xxxx_add_hotel_fields_to_booking_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('booking', function (Blueprint $table) {
            // Tanggal hewan dijemput (khusus pet hotel)
            $table->date('tanggal_selesai')->nullable()->after('tanggal_booking');
            // Flag apakah notif sudah dikirim
            $table->boolean('notif_terkirim')->default(false)->after('tanggal_selesai');
            $table->timestamp('notif_dikirim_at')->nullable()->after('notif_terkirim');
        });
    }

    public function down(): void
    {
        Schema::table('booking', function (Blueprint $table) {
            $table->dropColumn(['tanggal_selesai', 'notif_terkirim', 'notif_dikirim_at']);
        });
    }
};