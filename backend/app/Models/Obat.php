<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Obat extends Model
{
    protected $table      = 'obat';
    protected $primaryKey = 'id_obat';

    protected $fillable = [
        'nama_obat',
        'kategori',
        'satuan',
        'harga',
        'stok',
        'min_stok',
        'deskripsi',
    ];
}