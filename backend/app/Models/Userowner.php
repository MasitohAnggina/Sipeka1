<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Laravel\Sanctum\HasApiTokens;

class User extends Authenticatable
{
    use HasApiTokens;

    protected $table      = 'users';
    protected $primaryKey = 'id_user';

    protected $fillable = [
        'nama', 'email', 'password', 'no_hp', 'role', 'foto_profile',
    ];

    protected $hidden = ['password'];

    public function alamat()
    {
        return $this->hasMany(Alamat::class, 'id_user', 'id_user');
    }

    public function hewan()
    {
        return $this->hasMany(Hewan::class, 'id_user', 'id_user');
    }

    public function bookings()
    {
        return $this->hasMany(Booking::class, 'id_user', 'id_user');
    }

    public function dokter()
    {
        return $this->hasOne(Dokter::class, 'id_user', 'id_user');
    }
}