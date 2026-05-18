<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Layanan extends Model
{
    protected $table      = 'layanan';
    protected $primaryKey = 'id_layanan';

    protected $fillable = [
        'nama_layanan',
        'kategori',
        'sub_kategori',
        'durasi',
        'harga',
        'kapasitas',
        'deskripsi',
        'status',
    ];

    protected $casts = [
        'harga' => 'decimal:2',
    ];

    public function bookings()
    {
        return $this->belongsToMany(
            Booking::class,
            'booking_layanan',
            'id_layanan',
            'id_booking'
        )->withPivot('harga_saat_booking')->withTimestamps();
    }
}