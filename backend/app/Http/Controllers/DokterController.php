<?php

namespace App\Http\Controllers;

use App\Models\Dokter;
use App\Models\Alamat;
use Illuminate\Http\Request;

class DokterController extends Controller
{
    public function getProfile(Request $request)
    {
        $user   = $request->user();
        $dokter = Dokter::with('alamat')->where('id_user', $user->id_user)->first();

        if (!$dokter) {
            return response()->json(['message' => 'Profil dokter tidak ditemukan'], 404);
        }

        return response()->json([
            'nama'                => $user->nama,
            'email'               => $user->email,
            'no_hp'               => $user->no_hp,
            'spesialisasi'        => $dokter->spesialisasi,
            'pendidikan_terakhir' => $dokter->pendidikan_terakhir,
            'foto'                => $dokter->foto ? asset('storage/' . $dokter->foto) : null,
            'provinsi'            => $dokter->alamat->provinsi       ?? '',
            'kota'                => $dokter->alamat->kota           ?? '',
            'kecamatan'           => $dokter->alamat->kecamatan      ?? '',
            'kode_pos'            => $dokter->alamat->kode_pos       ?? '',
            'alamat_lengkap'      => $dokter->alamat->alamat_lengkap ?? '',
        ]);
    }

    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'nama'                => 'required|string',
            'email'               => 'required|email|unique:users,email,' . $user->id_user . ',id_user',
            'no_hp'               => 'nullable|string',
            'spesialisasi'        => 'nullable|string',
            'pendidikan_terakhir' => 'nullable|string',
            'provinsi'            => 'nullable|string',
            'kota'                => 'nullable|string',
            'kecamatan'           => 'nullable|string',
            'kode_pos'            => 'nullable|string',
            'alamat_lengkap'      => 'nullable|string',
        ]);

        $user->update([
            'nama'  => $request->nama,
            'email' => $request->email,
            'no_hp' => $request->no_hp,
        ]);

        $dokter = Dokter::where('id_user', $user->id_user)->first();
        if ($dokter) {
            $dokter->update([
                'spesialisasi'        => $request->spesialisasi,
                'pendidikan_terakhir' => $request->pendidikan_terakhir,
            ]);

            if ($dokter->alamat) {
                $dokter->alamat->update([
                    'provinsi'       => $request->provinsi,
                    'kota'           => $request->kota,
                    'kecamatan'      => $request->kecamatan,
                    'kode_pos'       => $request->kode_pos,
                    'alamat_lengkap' => $request->alamat_lengkap,
                ]);
            } else {
                $alamat = Alamat::create([
                    'id_user'        => $user->id_user,
                    'provinsi'       => $request->provinsi,
                    'kota'           => $request->kota,
                    'kecamatan'      => $request->kecamatan,
                    'kode_pos'       => $request->kode_pos,
                    'alamat_lengkap' => $request->alamat_lengkap,
                ]);

                // Update id_alamat di tabel dokter
                $dokter->update(['id_alamat' => $alamat->id_alamat]);
            }
        }

        return response()->json(['message' => 'Profil berhasil diperbarui']);
    }

    public function uploadFoto(Request $request)
    {
        $request->validate([
            'foto' => 'required|image|mimes:jpeg,png,jpg|max:2048',
        ]);

        $user   = $request->user();
        $dokter = Dokter::where('id_user', $user->id_user)->first();

        if (!$dokter) {
            return response()->json(['message' => 'Profil dokter tidak ditemukan'], 404);
        }

        if ($dokter->foto && file_exists(storage_path('app/public/' . $dokter->foto))) {
            unlink(storage_path('app/public/' . $dokter->foto));
        }

        $path = $request->file('foto')->store('foto_dokter', 'public');

        $dokter->update(['foto' => $path]);

        return response()->json([
            'message' => 'Foto berhasil diupload',
            'foto'    => asset('storage/' . $path),
        ]);
    }
}