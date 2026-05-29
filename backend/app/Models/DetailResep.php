<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DetailResep extends Model
{
    protected $table      = 'detail_resep';
    protected $primaryKey = 'id_detail';

    protected $fillable = [
        'id_resep',
        'tipe',
        'id_referensi',
        'nama_item',
        'harga_satuan',
        'qty',
        'subtotal',
    ];
}