<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Resep extends Model
{
    protected $table      = 'resep';
    protected $primaryKey = 'id_resep';

    protected $fillable = [
        'id_booking',
        'id_dokter',
        'id_hewan',
        'id_user',
        'catatan',
        'grand_total',
    ];

    // ── Relasi ───────────────────────────────────────────────────────────

    public function booking(): BelongsTo
    {
        return $this->belongsTo(Booking::class, 'id_booking', 'id_booking');
    }

    public function hewan(): BelongsTo
    {
        return $this->belongsTo(Hewan::class, 'id_hewan', 'id_hewan');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_user', 'id_user');
    }

    public function details(): HasMany
    {
        return $this->hasMany(DetailResep::class, 'id_resep', 'id_resep');
    }

    /** Satu resep punya satu record pembayaran */
    public function pembayaran(): HasOne
    {
        return $this->hasOne(Pembayaran::class, 'id_resep', 'id_resep');
    }
}