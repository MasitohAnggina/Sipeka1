<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Pembayaran extends Model
{
    protected $table      = 'pembayaran';
    protected $primaryKey = 'id_pembayaran';

    protected $fillable = [
        'id_resep',
        'id_user',
        'jumlah',
        'metode',
        'status',
        'snap_token',
        'midtrans_order_id',
        'midtrans_transaction_id',
        'midtrans_payment_type',
        'midtrans_raw',
        'dikonfirmasi_oleh',
        'dikonfirmasi_at',
        'catatan_admin',
        'no_referensi',
    ];

    protected $casts = [
        'midtrans_raw'     => 'array',
        'dikonfirmasi_at'  => 'datetime',
        'jumlah'           => 'integer',
    ];

    // ── Relasi ───────────────────────────────────────────────────────────

    public function resep(): BelongsTo
    {
        return $this->belongsTo(Resep::class, 'id_resep', 'id_resep');
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id_user', 'id_user');
    }

    public function dikonfirmasiOleh(): BelongsTo
    {
        return $this->belongsTo(User::class, 'dikonfirmasi_oleh', 'id_user'); // ← fix: 'id' → 'id_user'
    }

    // ── Helper ───────────────────────────────────────────────────────────

    /** Apakah sudah lunas */
    public function isLunas(): bool
    {
        return $this->status === 'lunas';
    }

    /** Apakah masih bisa dibayar */
    public function isBelumBayar(): bool
    {
        return in_array($this->status, ['menunggu_pembayaran', 'gagal']);
    }
}