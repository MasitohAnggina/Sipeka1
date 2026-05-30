<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('resep', function (Blueprint $table) {
            $table->id('id_resep');
            $table->unsignedBigInteger('id_booking');
            $table->unsignedBigInteger('id_dokter');
            $table->unsignedBigInteger('id_hewan');
            $table->unsignedBigInteger('id_user');
            $table->text('catatan')->nullable();
            $table->integer('grand_total')->default(0);
            $table->timestamps();

            $table->foreign('id_booking')->references('id_booking')->on('booking');
            $table->foreign('id_dokter')->references('id_dokter')->on('dokter');
            $table->foreign('id_hewan')->references('id_hewan')->on('hewan');
            $table->foreign('id_user')->references('id_user')->on('users');
        });
    }

    public function down(): void { Schema::dropIfExists('resep'); }
};