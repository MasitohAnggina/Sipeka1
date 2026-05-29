<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

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
        'grand_total'
    ];

    public function details()  { return $this->hasMany(DetailResep::class, 'id_resep'); }
    public function booking()  { return $this->belongsTo(Booking::class,   'id_booking'); }
    public function dokter()   { return $this->belongsTo(Dokter::class,    'id_dokter'); }
    public function hewan()    { return $this->belongsTo(Hewan::class,     'id_hewan'); }
    public function user()     { return $this->belongsTo(User::class,      'id_user'); }
}