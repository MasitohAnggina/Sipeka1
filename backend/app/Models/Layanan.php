<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Layanan extends Model
{
    protected $table      = 'layanan';
    protected $primaryKey = 'id_layanan';

    protected $fillable = [
        'nama_layanan', 'kategori', 'sub_kategori',
        'durasi', 'satuan_durasi', 'harga',
        'kapasitas', 'deskripsi', 'status',
    ];

    protected $casts = [
        'harga' => 'decimal:2',
    ];
}