<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RekamMedis extends Model
{
    protected $table      = 'rekam_medis';
    protected $primaryKey = 'id_rekam_medis';

    protected $fillable = [
        'id_riwayat',
        'id_dokter',
        'diagnosa',
        'diagnosa_lengkap',
        'catatan_dokter',
        'tindakan',
    ];

    protected $casts = [
        'tindakan' => 'array',
    ];

    public function riwayatLayanan()
    {
        return $this->belongsTo(RiwayatLayanan::class, 'id_riwayat', 'id_riwayat');
    }

    public function dokter()
    {
        return $this->belongsTo(Dokter::class, 'id_dokter', 'id_dokter');
    }
}