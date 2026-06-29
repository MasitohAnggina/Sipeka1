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
        $user   = $request->user();
        $dokter = Dokter::with('alamat')->where('id_user', $user->id_user)->first();

        if (!$dokter) {
            $dokter = Dokter::create([
                'id_user'     => $user->id_user,
                'nama_dokter' => $user->nama,
            ]);
        }

        // Fallback: kalau relasi alamat null, cari langsung via id_user
        $alamat = $dokter->alamat
            ?? Alamat::where('id_user', $user->id_user)->first();

        return response()->json([
            'nama'                => $user->nama,
            'email'               => $user->email,
            'no_hp'               => $user->no_hp,
            'spesialisasi'        => $dokter->spesialisasi        ?? '',
            'pendidikan_terakhir' => $dokter->pendidikan_terakhir ?? '',
            'foto'                => $user->foto_profile
                                        ? asset('storage/' . $user->foto_profile)
                                        : null,
            'provinsi'            => $alamat->provinsi       ?? '',
            'kota'                => $alamat->kota           ?? '',
            'kecamatan'           => $alamat->kecamatan      ?? '',
            'kode_pos'            => $alamat->kode_pos       ?? '',
            'alamat_lengkap'      => $alamat->alamat_lengkap ?? '',
        ]);
    }

    public function updateProfile(Request $request)
    {
        $user   = $request->user();
        $dokter = Dokter::where('id_user', $user->id_user)->first();

        $request->validate([
            'nama'                => 'required|string',
            'email'               => 'required|email|unique:users,email,' . $user->id_user . ',id_user',
            'no_hp'               => 'nullable|string',
            'kata_sandi'          => 'nullable|string|min:8',
            'spesialisasi'        => 'nullable|string',
            'pendidikan_terakhir' => 'nullable|string',
            'provinsi'            => 'nullable|string',
            'kota'                => 'nullable|string',
            'kecamatan'           => 'nullable|string',
            'kode_pos'            => 'nullable|string',
            'alamat_lengkap'      => 'nullable|string',
        ], [
            'nama.required'  => 'Nama lengkap wajib diisi.',
            'email.required' => 'Email wajib diisi.',
            'email.email'    => 'Format email tidak valid.',
            'email.unique'   => 'Email sudah digunakan oleh akun lain.',
            'kata_sandi.min' => 'Kata sandi minimal 8 karakter.',
        ]);

        // ── Update tabel users ────────────────────────────────────────────────
        $updateUser = [
            'nama'  => $request->nama,
            'email' => $request->email,
            'no_hp' => $request->no_hp,
        ];
        if ($request->filled('kata_sandi')) {
            $updateUser['password'] = Hash::make($request->kata_sandi);
        }
        $user->update($updateUser);

        // ── Update tabel dokter ───────────────────────────────────────────────
        if ($dokter) {
            $dokter->update([
                'nama_dokter'         => $request->nama,
                'spesialisasi'        => $request->spesialisasi        ?? $dokter->spesialisasi,
                'pendidikan_terakhir' => $request->pendidikan_terakhir ?? $dokter->pendidikan_terakhir,
            ]);
        }

        // ── Update tabel alamat & sync id_alamat ke dokter ───────────────────
        $alamat = Alamat::updateOrCreate(
            ['id_user' => $user->id_user],
            [
                'provinsi'       => $request->provinsi       ?? '',
                'kota'           => $request->kota           ?? '',
                'kecamatan'      => $request->kecamatan      ?? '',
                'kode_pos'       => $request->kode_pos       ?? '',
                'alamat_lengkap' => $request->alamat_lengkap ?? '',
            ]
        );

        // Pastikan dokter.id_alamat selalu menunjuk ke alamat yang benar
        if ($dokter && $dokter->id_alamat !== $alamat->id_alamat) {
            $dokter->update(['id_alamat' => $alamat->id_alamat]);
        }

        return response()->json([
            'success' => true,
            'message' => 'Profil berhasil diperbarui',
        ]);
    }

    public function uploadFoto(Request $request)
    {
        $request->validate([
            'foto' => 'required|image|mimes:jpeg,png,jpg|max:2048',
        ], [
            'foto.required' => 'File foto wajib dipilih.',
            'foto.image'    => 'File harus berupa gambar.',
            'foto.mimes'    => 'Format foto harus JPEG atau PNG.',
            'foto.max'      => 'Ukuran foto maksimal 2 MB.',
        ]);

        $user   = $request->user();
        $dokter = Dokter::where('id_user', $user->id_user)->first();

        if (!$dokter) {
            return response()->json(['message' => 'Profil dokter tidak ditemukan'], 404);
        }

        // Hapus foto lama kalau ada
        if ($user->foto_profile) {
            Storage::disk('public')->delete($user->foto_profile);
        }

        $path = $request->file('foto')->store('foto_dokter', 'public');
        $user->update(['foto_profile' => $path]);

        return response()->json([
            'success' => true,
            'message' => 'Foto berhasil diupload',
            'foto'    => asset('storage/' . $path),
        ]);
    }
}