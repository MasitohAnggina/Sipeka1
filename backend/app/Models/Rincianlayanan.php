<?php
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class RincianLayanan extends Model {
    protected $table = 'rincian_layanan'; protected $primaryKey = 'id_rincian';
    protected $fillable = ['id_riwayat','id_layanan','id_obat','tipe','jumlah','harga_satuan','subtotal'];
    protected $casts = ['harga_satuan'=>'decimal:2','subtotal'=>'decimal:2'];
    public function riwayatLayanan() { return $this->belongsTo(RiwayatLayanan::class,'id_riwayat','id_riwayat'); }
    public function layanan() { return $this->belongsTo(Layanan::class,'id_layanan','id_layanan'); }
    public function obat()    { return $this->belongsTo(Obat::class,'id_obat','id_obat'); }
}