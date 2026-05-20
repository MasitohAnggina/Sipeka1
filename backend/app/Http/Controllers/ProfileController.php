<?php

namespace App\Http\Controllers;

use App\Models\Alamat;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class ProfileController extends Controller
{
    // ─────────────────────────────────────────────────────────────────────────
    //  GET /api/owner_pet/profile
    // ─────────────────────────────────────────────────────────────────────────
    public function getProfile(Request $request)
    {
        $user = $request->user();

        // Auto-create alamat kalau belum ada
        $alamat = Alamat::where('id_user', $user->id_user)->first();
        if (!$alamat) {
            $alamat = Alamat::create([
                'id_user'        => $user->id_user,
                'provinsi'       => '',
                'kota'           => '',
                'kecamatan'      => '',
                'kode_pos'       => '',
                'alamat_lengkap' => '',
            ]);
        }

        return response()->json([
            'success' => true,
            'data'    => [
                'id_user'      => $user->id_user,
                'nama'         => $user->nama,
                'email'        => $user->email,
                'no_hp'        => $user->no_hp,
                'role'         => $user->role,
                'foto_profile' => $user->foto_profile
                    ? asset('storage/' . $user->foto_profile)
                    : null,
                'provinsi'       => $alamat->provinsi       ?? '',
                'kota'           => $alamat->kota           ?? '',
                'kecamatan'      => $alamat->kecamatan      ?? '',
                'kode_pos'       => $alamat->kode_pos       ?? '',
                'alamat_lengkap' => $alamat->alamat_lengkap ?? '',
            ],
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  PUT /api/owner_pet/profile
    // ─────────────────────────────────────────────────────────────────────────
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'nama'           => 'required|string|max:255',
            // email:rfc  → validasi ketat sesuai standar RFC 5321/5322
            // email:dns  → domain harus punya DNS record aktif (MX/A)
            // Gabungan: zaza@gmail ditolak, zaza@gmail.com diterima
            'email'          => 'required|email:rfc,dns|unique:users,email,' . $user->id_user . ',id_user',
            'no_hp'          => 'nullable|string|max:20',
            'kata_sandi'     => 'nullable|string|min:8',
            'provinsi'       => 'nullable|string|max:100',
            'kota'           => 'nullable|string|max:100',
            'kecamatan'      => 'nullable|string|max:100',
            'kode_pos'       => 'nullable|string|max:10',
            'alamat_lengkap' => 'nullable|string|max:500',
        ], [
            // Pesan error kustom dalam Bahasa Indonesia
            'nama.required'      => 'Nama lengkap wajib diisi.',
            'nama.max'           => 'Nama maksimal 255 karakter.',
            'email.required'     => 'Email wajib diisi.',
            'email.email'        => 'Format email tidak valid. Contoh: nama@gmail.com',
            'email.unique'       => 'Email sudah digunakan oleh akun lain.',
            'kata_sandi.min'     => 'Kata sandi minimal 8 karakter.',
            'no_hp.max'          => 'Nomor telepon maksimal 20 karakter.',
            'kode_pos.max'       => 'Kode pos maksimal 10 karakter.',
            'alamat_lengkap.max' => 'Alamat lengkap maksimal 500 karakter.',
        ]);

        // Update data user
        $updateUser = [
            'nama'  => $request->nama,
            'email' => $request->email,
            'no_hp' => $request->no_hp,
        ];
        if ($request->filled('kata_sandi')) {
            $updateUser['password'] = Hash::make($request->kata_sandi);
        }
        $user->update($updateUser);

        // Update atau buat alamat
        Alamat::updateOrCreate(
            ['id_user' => $user->id_user],
            [
                'provinsi'       => $request->provinsi       ?? '',
                'kota'           => $request->kota           ?? '',
                'kecamatan'      => $request->kecamatan      ?? '',
                'kode_pos'       => $request->kode_pos       ?? '',
                'alamat_lengkap' => $request->alamat_lengkap ?? '',
            ]
        );

        return response()->json([
            'success' => true,
            'message' => 'Profil berhasil diperbarui',
        ]);
    }

    // ─────────────────────────────────────────────────────────────────────────
    //  POST /api/owner_pet/profile/foto
    // ─────────────────────────────────────────────────────────────────────────
    public function uploadFoto(Request $request)
    {
        $request->validate([
            'foto' => 'required|image|mimes:jpg,jpeg,png,webp|max:2048',
        ], [
            'foto.required' => 'File foto wajib dipilih.',
            'foto.image'    => 'File harus berupa gambar.',
            'foto.mimes'    => 'Format foto harus JPEG, PNG, atau WEBP.',
            'foto.max'      => 'Ukuran foto maksimal 2 MB.',
        ]);

        $user = $request->user();

        // Hapus foto lama kalau ada
        if ($user->foto_profile && file_exists(storage_path('app/public/' . $user->foto_profile))) {
            unlink(storage_path('app/public/' . $user->foto_profile));
        }

        $path = $request->file('foto')->store('foto_profil', 'public');
        $user->update(['foto_profile' => $path]);

        return response()->json([
            'success' => true,
            'message' => 'Foto profil berhasil diupload',
            'url'     => asset('storage/' . $path),
        ]);
    }
}