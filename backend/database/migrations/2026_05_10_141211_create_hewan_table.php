<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hewan', function (Blueprint $table) {
            $table->id('id_hewan');
            $table->foreignId('id_user')->constrained('users', 'id_user')->onDelete('cascade');
            $table->string('nama_hewan');
            $table->string('jenis');
            $table->string('foto')->nullable();
            $table->integer('umur')->nullable();
            $table->string('ras')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hewan');
    }
};