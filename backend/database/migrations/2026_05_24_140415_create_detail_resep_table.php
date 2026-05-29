<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('detail_resep', function (Blueprint $table) {
            $table->id('id_detail');
            $table->unsignedBigInteger('id_resep');
            $table->enum('tipe', ['layanan', 'obat']);
            $table->unsignedBigInteger('id_referensi');  // id_layanan atau id_obat
            $table->string('nama_item');                 // snapshot nama saat disimpan
            $table->integer('harga_satuan')->default(0);
            $table->integer('qty')->default(1);
            $table->integer('subtotal')->default(0);
            $table->timestamps();

            $table->foreign('id_resep')
                  ->references('id_resep')->on('resep')
                  ->onDelete('cascade');
        });
    }

    public function down(): void { Schema::dropIfExists('detail_resep'); }
};