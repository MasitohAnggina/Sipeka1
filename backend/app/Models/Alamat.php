<?php
// ── File: app/Models/Alamat.php ───────────────────────────────────────────────
namespace App\Models;
use Illuminate\Database\Eloquent\Model;
class Alamat extends Model {
    protected $table = 'alamat'; protected $primaryKey = 'id_alamat';
    protected $fillable = ['id_user','provinsi','kota','kecamatan','kode_pos','alamat_lengkap'];
    public function user() { return $this->belongsTo(User::class, 'id_user', 'id_user'); }
}