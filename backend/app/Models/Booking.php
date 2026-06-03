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
    ];

    protected $casts = [
        'tanggal_booking' => 'date',
        'tanggal_dibuat'  => 'date',
        'tanggal_selesai'  => 'date',       // ← tambah
        'notif_terkirim'   => 'boolean',    // ← tambah
        'notif_dikirim_at' => 'datetime',
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

    public static function generateNoBooking(): string
    {
        do {
            $no = 'BK' . strtoupper(substr(uniqid(), -6));
        } while (self::where('no_booking', $no)->exists());

        return $no;
    }

    public static function nextAntrian(string $tanggal): int
    {
        $max = self::where('tanggal_booking', $tanggal)->max('no_antrian');
        return ($max ?? 0) + 1;
    }
}