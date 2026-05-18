<?php

namespace App\Http\Controllers;

use App\Models\Obat;
use Illuminate\Http\Request;

class ObatController extends Controller
{
    public function index(Request $request)
    {
        $query = Obat::query();

        if ($request->nama) {
            $query->where('nama_obat', 'like', '%' . $request->nama . '%');
        }
        if ($request->kategori) {
            $query->where('kategori', $request->kategori);
        }

        return response()->json($query->get());
    }

    public function store(Request $request)
    {
        $request->validate([
            'nama_obat' => 'required|string',
            'harga'     => 'required|numeric',
            'kategori'  => 'nullable|string',
            'satuan'    => 'nullable|string',
            'stok'      => 'nullable|integer',
            'min_stok'  => 'nullable|integer',
            'deskripsi' => 'nullable|string',
        ]);

        $obat = Obat::create($request->all());

        return response()->json(['message' => 'Obat berhasil ditambahkan', 'data' => $obat], 201);
    }

    public function update(Request $request, $id)
    {
        $obat = Obat::find($id);

        if (!$obat) {
            return response()->json(['message' => 'Obat tidak ditemukan'], 404);
        }

        $request->validate([
            'nama_obat' => 'required|string',
            'harga'     => 'required|numeric',
            'kategori'  => 'nullable|string',
            'satuan'    => 'nullable|string',
            'stok'      => 'nullable|integer',
            'min_stok'  => 'nullable|integer',
            'deskripsi' => 'nullable|string',
        ]);

        $obat->update($request->all());

        return response()->json(['message' => 'Obat berhasil diperbarui', 'data' => $obat]);
    }

    public function destroy($id)
    {
        $obat = Obat::find($id);

        if (!$obat) {
            return response()->json(['message' => 'Obat tidak ditemukan'], 404);
        }

        $obat->delete();

        return response()->json(['message' => 'Obat berhasil dihapus']);
    }
}