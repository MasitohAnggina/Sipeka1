<?php
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE booking MODIFY COLUMN status ENUM(
            'menunggu',
            'dikonfirmasi',
            'diproses',
            'berlangsung',
            'selesai',
            'dibatalkan',
            'menunggu_pembatalan'
        ) NOT NULL DEFAULT 'menunggu'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE booking MODIFY COLUMN status ENUM(
            'menunggu',
            'dikonfirmasi',
            'diproses',
            'berlangsung',
            'selesai',
            'dibatalkan'
        ) NOT NULL DEFAULT 'menunggu'");
    }
};