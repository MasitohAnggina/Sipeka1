<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('booking', function (Blueprint $table) {
            // Apakah pembatalan oleh owner sudah dikonfirmasi admin
            $table->boolean('cancel_confirmed')->default(false)->after('status');
            // Waktu owner membatalkan (agar admin tahu kapan request masuk)
            $table->timestamp('cancelled_at')->nullable()->after('cancel_confirmed');
        });
    }

    public function down(): void
    {
        Schema::table('booking', function (Blueprint $table) {
            $table->dropColumn(['cancel_confirmed', 'cancelled_at']);
        });
    }
};