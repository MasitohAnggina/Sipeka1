<?php

namespace App\Http\Controllers;

use App\Models\Dokter;
use App\Models\Alamat;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;

class DokterController extends Controller
{
    public function getProfile(Request $request)
    {
        $user = $request->user();

        $dokter = Dokter::with('alamat')->where('id_user', $user->id_user)->first();
        if (!$dokter) {
            $dokter = Dokter::create([
                'id_user'     => $user->id_user,
                'nama_dokter' => $user->nama,
            ]);
            $dokter->load('alamat');
        }

        return response()->json([
            'nama'                => $user->nama,
            'email'               => $user->email,
            'no_hp'               => $user->no_hp,
            'spesialisasi'        => $dokter->spesialisasi,
            'pendidikan_terakhir' => $dokter->pendidikan_terakhir,
            'foto'                => $user->foto_profile
                                        ? asset('storage/' . $user->foto_profile)
                                        : null,
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
            'kata_sandi'          => 'nullable|string|min:8',  // ← tambahan
            'spesialisasi'        => 'nullable|string',
            'pendidikan_terakhir' => 'nullable|string',
            'provinsi'            => 'nullable|string',
            'kota'                => 'nullable|string',
            'kecamatan'           => 'nullable|string',
            'kode_pos'            => 'nullable|string',
            'alamat_lengkap'      => 'nullable|string',
        ], [
            'kata_sandi.min' => 'Kata sandi minimal 8 karakter.',
        ]);

        $updateUser = [
            'nama'  => $request->nama,
            'email' => $request->email,
            'no_hp' => $request->no_hp,
        ];

        // Hanya update password kalau kata_sandi diisi
        if ($request->filled('kata_sandi')) {
            $updateUser['password'] = Hash::make($request->kata_sandi);
        }

        $user->update($updateUser);

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

                $dokter->update(['id_alamat' => $alamat->id_alamat]);
            }
        }

        return response()->json(['success' => true, 'message' => 'Profil berhasil diperbarui']);
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

        if ($user->foto_profile) {
            Storage::disk('public')->delete($user->foto_profile);
        }

        $path = $request->file('foto')->store('foto_dokter', 'public');

        $user->update(['foto_profile' => $path]);

        return response()->json([
            'message' => 'Foto berhasil diupload',
            'foto'    => asset('storage/' . $path),
        ]);
    }
}