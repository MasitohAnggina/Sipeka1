<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Auth;
use App\Mail\ResetPasswordMail;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class AuthController extends Controller
{
    public function register(Request $request)
    {
        $request->validate([
            'nama'     => 'required|string|max:255',
            'email'    => 'required|string|email|unique:users',
            'password' => 'required|string|min:6',
            'no_hp'    => 'nullable|string',
        ]);

        $user = User::create([
            'nama'     => $request->nama,
            'email'    => $request->email,
            'password' => $request->password, // fix: hapus Hash::make, cast 'hashed' yang handle
            'no_hp'    => $request->no_hp,
            'role'     => 'user',
        ]);

        $token = $user->createToken('auth_token')->plainTextToken;

        return response()->json([
            'message' => 'Registrasi berhasil',
            'token'   => $token,
            'user'    => $user,
        ], 201);
    }

    public function login(Request $request)
{
    $request->validate([
        'email'    => 'required|email',
        'password' => 'required',
    ]);

    if (!Auth::attempt($request->only('email', 'password'))) {
        return response()->json(['message' => 'Email atau password salah'], 401);
    }

    $user  = Auth::user();
    $token = $user->createToken('auth_token')->plainTextToken;

    if ($user->role === 'dokter') {
        \App\Models\Dokter::firstOrCreate(
            ['id_user' => $user->id_user],
            [
                'nama_dokter'  => $user->nama,
                'spesialisasi' => '-',
                'no_hp'        => $user->no_hp ?? '-',
            ]
        );
    }

    return response()->json([
        'message' => 'Login berhasil',
        'token'   => $token,
        'user'    => $user,
    ]);
}

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Logout berhasil',
        ]);
    }

    public function forgotPassword(Request $request)
{
    $request->validate(['email' => 'required|email']);

    $user = User::where('email', $request->email)->first();
    if (!$user) {
        // pesan generik, jangan bocorkan email terdaftar atau tidak
        return response()->json(['message' => 'Jika email terdaftar, link reset sudah dikirim']);
    }

    $token = Str::random(60);

    DB::table('password_reset_tokens')->updateOrInsert(
        ['email' => $request->email],
        ['token' => Hash::make($token), 'created_at' => now()]
    );

    $resetUrl = config('app.frontend_url') . '/auth/reset-password?token=' . $token . '&email=' . urlencode($request->email);

    Mail::to($request->email)->send(new ResetPasswordMail($resetUrl));

    return response()->json(['message' => 'Jika email terdaftar, link reset sudah dikirim']);
}

public function resetPassword(Request $request)
{
    $request->validate([
        'email'    => 'required|email',
        'token'    => 'required',
        'password' => 'required|min:6|confirmed',
    ]);

    $record = DB::table('password_reset_tokens')->where('email', $request->email)->first();

    if (!$record || !Hash::check($request->token, $record->token)) {
        return response()->json(['message' => 'Token tidak valid atau sudah expired'], 400);
    }

    if (now()->diffInMinutes($record->created_at) > 60) {
        return response()->json(['message' => 'Token sudah expired, minta ulang'], 400);
    }

    $user = User::where('email', $request->email)->first();
    $user->password = $request->password; // otomatis di-hash karena casts 'hashed'
    $user->save();

    DB::table('password_reset_tokens')->where('email', $request->email)->delete();

    return response()->json(['message' => 'Password berhasil direset, silakan login']);
}
}