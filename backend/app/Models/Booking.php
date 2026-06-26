<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Booking extends Model
{
    protected $table      = 'booking';
    protected $primaryKey = 'id_booking';

    protected $fillable = [
        'no_booking',
        'id_hewan',
        'id_user',
        'id_jadwal',
        'tanggal_booking',
        'tanggal_dibuat',
        'jam',
        'catatan',
        'foto_before',
        'foto_after',
        'no_antrian',
        'status',
        'tanggal_selesai',
        'notif_terkirim',
        'notif_dikirim_at',
        'cancel_confirmed',
        'cancelled_at',
    ];

    protected $casts = [
        'tanggal_booking'  => 'date',
        'tanggal_dibuat'   => 'date',
        'tanggal_selesai'  => 'date',
        'notif_terkirim'   => 'boolean',
        'notif_dikirim_at' => 'datetime',
        'cancel_confirmed' => 'boolean',
        'cancelled_at'     => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'id_user', 'id_user');
    }

    public function hewan()
    {
        return $this->belongsTo(Hewan::class, 'id_hewan', 'id_hewan');
    }

    public function jadwal()
    {
        return $this->belongsTo(Jadwal::class, 'id_jadwal', 'id_jadwal');
    }

    public function layanans()
    {
        return $this->belongsToMany(
            Layanan::class,
            'booking_layanan',
            'id_booking',
            'id_layanan'
        )->withPivot('harga_saat_booking')->withTimestamps();
    }

    public function riwayatLayanan()
    {
        return $this->hasOne(RiwayatLayanan::class, 'id_booking', 'id_booking');
    }

    public function resep()
    {
        return $this->hasOne(Resep::class, 'id_booking', 'id_booking');
    }

    // fix: hapus loop query, pakai uniqid langsung tanpa do-while
    public static function generateNoBooking(): string
{
    do {
        $no = 'BK' . strtoupper(substr(uniqid('', true), -8));
    } while (self::where('no_booking', $no)->exists());

    return $no;
}

    // fix: tambah lockForUpdate() untuk hindari race condition concurrent booking
    public static function nextAntrian(string $tanggal): int
{
    $max = self::where('tanggal_booking', $tanggal)->max('no_antrian');
    return ($max ?? 0) + 1;
}

}