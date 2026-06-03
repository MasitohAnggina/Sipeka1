<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Layanan extends Model
{
    protected $table      = 'layanan';
    protected $primaryKey = 'id_layanan';

    protected $fillable = [
    'nama_layanan', 'kategori', 'sub_kategori',
    'durasi', 'harga', 'kapasitas', 'deskripsi', 'tersedia',
];

protected $casts = [
    'tersedia' => 'boolean',
    'harga'    => 'decimal:2',
];
// Tambah di Model Layanan
public function getSatuanDurasiAttribute(): string
{
    $kategoriBerbasisHari = ['Hotel Hewan', 'Rawat Inap'];
    return in_array($this->kategori, $kategoriBerbasisHari) ? 'hari' : 'menit';
}
}