<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('layanan', function (Blueprint $table) {
            $table->enum('satuan_durasi', ['menit', 'jam', 'hari'])
                  ->default('menit')
                  ->after('durasi');
        });
    }

    public function down(): void
    {
        Schema::table('layanan', function (Blueprint $table) {
            $table->dropColumn('satuan_durasi');
        });
    }
};