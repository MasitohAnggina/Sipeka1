<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class RiwayatLayanan extends Model
{
    protected $table      = 'riwayat_layanan';
    protected $primaryKey = 'id_riwayat';
    protected $fillable = [
        'id_booking',
        'id_resep',
        'catatan',
        'grand_total',
        'tanggal',
    ];
    protected $casts = [
        'tanggal'     => 'date',
        'grand_total' => 'decimal:2',
    ];
    public function booking()
    {
        return $this->belongsTo(Booking::class, 'id_booking', 'id_booking');
    }
    public function rekamMedis()
    {
        return $this->hasOne(RekamMedis::class, 'id_riwayat', 'id_riwayat');
    }
    public function resep()
    {
        return $this->belongsTo(Resep::class, 'id_resep', 'id_resep');
    }
}