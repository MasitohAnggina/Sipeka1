<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
{
    Schema::table('riwayat_layanan', function (Blueprint $table) {
        $table->unsignedBigInteger('id_resep')->nullable()->after('id_booking');
        $table->foreign('id_resep')
              ->references('id_resep')
              ->on('resep')
              ->nullOnDelete();
    });
}

public function down(): void
{
    Schema::table('riwayat_layanan', function (Blueprint $table) {
        $table->dropForeign(['id_resep']);
        $table->dropColumn('id_resep');
    });

    }    
    };