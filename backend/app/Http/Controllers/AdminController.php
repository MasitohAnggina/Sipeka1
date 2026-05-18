<?php

namespace App\Http\Controllers;

use App\Models\Alamat;
use Illuminate\Http\Request;

class AdminController extends Controller
{
    public function getProfile(Request $request)
    {
        $user   = $request->user();
        $alamat = Alamat::where('id_user', $user->id_user)->first();

        return response()->json([
            'nama'           => $user->nama,
            'email'          => $user->email,
            'no_hp'          => $user->no_hp,
            'foto'           => $user->foto_profile ? asset('storage/' . $user->foto_profile) : null,
            'provinsi'       => $alamat->provinsi       ?? '',
            'kota'           => $alamat->kota           ?? '',
            'kecamatan'      => $alamat->kecamatan      ?? '',
            'kode_pos'       => $alamat->kode_pos       ?? '',
            'alamat_lengkap' => $alamat->alamat_lengkap ?? '',
        ]);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'nama'           => 'required|string',
            'email'          => 'required|email|unique:users,email,' . $user->id_user . ',id_user',
            'no_hp'          => 'nullable|string',
            'provinsi'       => 'nullable|string',
            'kota'           => 'nullable|string',
            'kecamatan'      => 'nullable|string',
            'kode_pos'       => 'nullable|string',
            'alamat_lengkap' => 'nullable|string',
        ]);

        $user->update([
            'nama'  => $request->nama,
            'email' => $request->email,
            'no_hp' => $request->no_hp,
        ]);

        $alamat = Alamat::where('id_user', $user->id_user)->first();
        if ($alamat) {
            $alamat->update([
                'provinsi'       => $request->provinsi,
                'kota'           => $request->kota,
                'kecamatan'      => $request->kecamatan,
                'kode_pos'       => $request->kode_pos,
                'alamat_lengkap' => $request->alamat_lengkap,
            ]);
        } else {
            Alamat::create([
                'id_user'        => $user->id_user,
                'provinsi'       => $request->provinsi,
                'kota'           => $request->kota,
                'kecamatan'      => $request->kecamatan,
                'kode_pos'       => $request->kode_pos,
                'alamat_lengkap' => $request->alamat_lengkap,
            ]);
        }

        return response()->json(['message' => 'Profil berhasil diperbarui']);
    }

    public function uploadFoto(Request $request)
    {
        $request->validate([
            'foto' => 'required|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        $user = $request->user();

        if ($user->foto_profile && file_exists(storage_path('app/public/' . $user->foto_profile))) {
            unlink(storage_path('app/public/' . $user->foto_profile));
        }

        $path = $request->file('foto')->store('foto_admin', 'public');

        $user->update(['foto_profile' => $path]);

        return response()->json([
            'message' => 'Foto berhasil diupload',
            'foto'    => asset('storage/' . $path),
        ]);
    }
}