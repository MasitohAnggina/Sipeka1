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

        // Auto-create alamat kalau belum ada (sama seperti dokter auto-create)
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
            'email'          => 'required|email|unique:users,email,' . $user->id_user . ',id_user',
            'no_hp'          => 'nullable|string',
            'kata_sandi'     => 'nullable|string|min:6',
            'provinsi'       => 'nullable|string',
            'kota'           => 'nullable|string',
            'kecamatan'      => 'nullable|string',
            'kode_pos'       => 'nullable|string',
            'alamat_lengkap' => 'nullable|string',
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