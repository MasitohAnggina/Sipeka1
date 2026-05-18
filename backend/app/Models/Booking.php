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
    ];

    protected $casts = [
        'tanggal_booking' => 'date',
        'tanggal_dibuat'  => 'date',
    ];

    // ── Relasi ────────────────────────────────────────────────────────────────

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

    /**
     * Many-to-many: satu booking bisa punya BANYAK layanan.
     * Pivot: booking_layanan (id_booking, id_layanan, harga_saat_booking)
     */
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

    // ── Helper: generate no_booking unik ─────────────────────────────────────

    public static function generateNoBooking(): string
    {
        do {
            $no = 'BK' . strtoupper(substr(uniqid(), -6));
        } while (self::where('no_booking', $no)->exists());

        return $no;
    }

    // ── Helper: nomor antrian berikutnya untuk tanggal tertentu ──────────────

    public static function nextAntrian(string $tanggal): int
    {
        $max = self::where('tanggal_booking', $tanggal)->max('no_antrian');
        return ($max ?? 0) + 1;
    }
}