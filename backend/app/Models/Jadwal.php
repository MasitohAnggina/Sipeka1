<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Jadwal extends Model
{
    protected $table      = 'jadwal';
    protected $primaryKey = 'id_jadwal';

    protected $fillable = [
        'id_dokter', 'tanggal', 'hari',
        'jam_mulai', 'jam_selesai', 'durasi', 'status',
    ];

    protected $casts = ['tanggal' => 'date'];

    public function dokter()
    {
        return $this->belongsTo(Dokter::class, 'id_dokter', 'id_dokter');
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class, 'id_jadwal', 'id_jadwal');
    }

    public static function hitungDurasi(?string $mulai, ?string $selesai): ?int
    {
        if (!$mulai || !$selesai) return null;
        [$hM, $mM] = explode(':', $mulai);
        [$hS, $mS] = explode(':', $selesai);
        return ((int)$hS * 60 + (int)$mS) - ((int)$hM * 60 + (int)$mM);
    }
}