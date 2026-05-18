<?php

namespace App\Http\Controllers;

use App\Models\Alamat;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Validator;

class ProfileController extends Controller
{
    // GET /api/profile
    public function getProfile(Request $request): JsonResponse
    {
        $user   = $request->user()->load('alamat');
        $alamat = $user->alamat->sortByDesc('id_alamat')->first();

        return response()->json([
            'success' => true,
            'data'    => [
                'id_user'      => $user->id_user,
                'nama'         => $user->nama,
                'email'        => $user->email,
                'no_hp'        => $user->no_hp,
                'role'         => $user->role,
                'foto_profile' => $user->foto_profile
                    ? asset('storage/' . $user->foto_profile) : null,
                'alamat' => $alamat ? [
                    'id_alamat'      => $alamat->id_alamat,
                    'provinsi'       => $alamat->provinsi,
                    'kota'           => $alamat->kota,
                    'kecamatan'      => $alamat->kecamatan,
                    'kode_pos'       => $alamat->kode_pos,
                    'alamat_lengkap' => $alamat->alamat_lengkap,
                ] : null,
            ],
        ]);
    }

    // PUT /api/profile
    public function updateProfile(Request $request): JsonResponse
    {
        $user = $request->user();
        $v    = Validator::make($request->all(), [
            'nama'       => 'sometimes|string|max:255',
            'email'      => 'sometimes|email|unique:users,email,' . $user->id_user . ',id_user',
            'no_hp'      => 'nullable|string|max:20',
            'kata_sandi' => 'nullable|string|min:6',
        ]);
        if ($v->fails()) return response()->json(['success'=>false,'errors'=>$v->errors()], 422);

        $data = array_filter([
            'nama'  => $request->nama,
            'email' => $request->email,
            'no_hp' => $request->no_hp,
        ]);
        if ($request->filled('kata_sandi')) {
            $data['password'] = Hash::make($request->kata_sandi);
        }
        $user->update($data);

        return response()->json(['success' => true, 'message' => 'Profil berhasil diperbarui.']);
    }

    // PUT /api/profile/alamat
    public function updateAlamat(Request $request): JsonResponse
    {
        $v = Validator::make($request->all(), [
            'provinsi'       => 'required|string|max:255',
            'kota'           => 'required|string|max:255',
            'kecamatan'      => 'required|string|max:255',
            'kode_pos'       => 'required|string|max:20',
            'alamat_lengkap' => 'required|string',
        ]);
        if ($v->fails()) return response()->json(['success'=>false,'errors'=>$v->errors()], 422);

        $idUser = $request->user()->id_user;
        $alamat = Alamat::where('id_user', $idUser)->latest()->first();
        $payload = $request->only(['provinsi','kota','kecamatan','kode_pos','alamat_lengkap']);

        if ($alamat) {
            $alamat->update($payload);
        } else {
            $alamat = Alamat::create(array_merge($payload, ['id_user' => $idUser]));
        }

        return response()->json(['success' => true, 'message' => 'Alamat berhasil diperbarui.', 'data' => $alamat]);
    }

    // POST /api/profile/foto
    public function uploadFoto(Request $request): JsonResponse
    {
        $v = Validator::make($request->all(), [
            'foto' => 'required|image|mimes:jpg,jpeg,png,webp|max:3072',
        ]);
        if ($v->fails()) return response()->json(['success'=>false,'errors'=>$v->errors()], 422);

        $user = $request->user();
        if ($user->foto_profile) Storage::disk('public')->delete($user->foto_profile);

        $path = $request->file('foto')->store('foto_profile', 'public');
        $user->update(['foto_profile' => $path]);

        return response()->json([
            'success'      => true,
            'message'      => 'Foto profil berhasil diperbarui.',
            'foto_profile' => asset('storage/' . $path),
        ]);
    }
}