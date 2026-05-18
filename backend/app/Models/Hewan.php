<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Hewan extends Model
{
    protected $table      = 'hewan';
    protected $primaryKey = 'id_hewan';

    protected $fillable = [
        'id_user',
        'nama_hewan',
        'jenis',
        'ras',
        'umur',
        'berat',
        'foto',
    ];

    public function user()
    {
        return $this->belongsTo(User::class, 'id_user', 'id_user');
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class, 'id_hewan', 'id_hewan');
    }
}