// lib/dummyRiwayat.ts
// Hapus file ini dan ganti USE_DUMMY = false saat backend sudah siap

export interface Layanan {
  id_layanan: number;
  nama_layanan: string;
  kategori: string;
  harga_saat_booking: number;
}

export interface TindakanItem {
  id: number;
  penanganan: string;
  durasi: string;
}

export interface RekamMedisData {
  tanggal: string;
  waktu: string;
  diagnosa: string;
  diagnosaLengkap: string;
  catatanDokter: string;
  simpanPenyakit: boolean;
  simpanAlergi: boolean;
  tindakanList: TindakanItem[];
}

export interface RiwayatItem {
  id_riwayat: number;
  tanggal: string;
  tanggal_dd: string;
  bulan: string;
  hari: string;
  jam: string;
  grand_total: number;
  status_bayar: string;
  catatan: string | null;
  no_booking: string;
  no_antrian: number;
  status_booking: string;
  layanan_utama: string;
  layanan_kategori: string;
  layanans: Layanan[];
  hewan: {
    id_hewan: number;
    nama: string;
    jenis: string;
    ras: string;
    umur: string;
    berat: string;
    foto: string | null;
    emoji?: string;
  } | null;
  dokter: {
    nama_dokter: string;
    spesialisasi: string;
  } | null;
  rekamMedis: RekamMedisData | null;
}

export const DUMMY_RIWAYAT: RiwayatItem[] = [
  {
    id_riwayat: 1,
    tanggal: "2025-05-12",
    tanggal_dd: "12",
    bulan: "Mei 2025",
    hari: "Senin",
    jam: "09:00",
    grand_total: 350000,
    status_bayar: "lunas",
    catatan: null,
    no_booking: "BK-2025-001",
    no_antrian: 3,
    status_booking: "selesai",
    layanan_utama: "Vaksinasi Rabies",
    layanan_kategori: "Vaksinasi",
    layanans: [
      { id_layanan: 1, nama_layanan: "Vaksinasi Rabies", kategori: "Vaksinasi", harga_saat_booking: 350000 },
    ],
    hewan: { id_hewan: 1, nama: "Buddy", jenis: "Anjing", ras: "Golden Retriever", umur: "3 tahun", berat: "28 kg", foto: null, emoji: "🐕" },
    dokter: { nama_dokter: "drh. Siti Rahayu", spesialisasi: "Dokter Hewan Umum" },
    rekamMedis: {
      tanggal: "2025-05-12",
      waktu: "09:15",
      diagnosa: "Sehat",
      diagnosaLengkap: "Hewan dalam kondisi prima. Pemberian vaksin rabies tahunan dilakukan sesuai jadwal. Tidak ditemukan keluhan klinis maupun gejala penyakit.",
      catatanDokter: "Jadwalkan vaksinasi berikutnya 12 bulan lagi. Pantau kondisi nafsu makan dan aktivitas harian.",
      simpanPenyakit: false,
      simpanAlergi: false,
      tindakanList: [
        { id: 1, penanganan: "Injeksi vaksin rabies 1 ml secara subkutan di area tengkuk", durasi: "10 menit" },
        { id: 2, penanganan: "Pemeriksaan fisik menyeluruh meliputi telinga, gigi, dan kulit", durasi: "15 menit" },
      ],
    },
  },
  {
    id_riwayat: 2,
    tanggal: "2025-04-28",
    tanggal_dd: "28",
    bulan: "Apr 2025",
    hari: "Minggu",
    jam: "13:00",
    grand_total: 280000,
    status_bayar: "lunas",
    catatan: null,
    no_booking: "BK-2025-002",
    no_antrian: 7,
    status_booking: "selesai",
    layanan_utama: "Full Grooming",
    layanan_kategori: "Grooming",
    layanans: [
      { id_layanan: 2, nama_layanan: "Full Grooming", kategori: "Grooming", harga_saat_booking: 200000 },
      { id_layanan: 3, nama_layanan: "Nail Trimming", kategori: "Grooming", harga_saat_booking: 80000 },
    ],
    hewan: { id_hewan: 2, nama: "Luna", jenis: "Kucing", ras: "Persia", umur: "2 tahun", berat: "3.5 kg", foto: null, emoji: "🐱" },
    dokter: { nama_dokter: "drh. Budi Santoso", spesialisasi: "Groomer & Dokter Hewan" },
    rekamMedis: {
      tanggal: "2025-04-28",
      waktu: "13:30",
      diagnosa: "Sehat",
      diagnosaLengkap: "Kulit dan bulu dalam keadaan sehat, tidak ada tanda-tanda infeksi jamur atau parasit. Kuku dipotong hingga panjang ideal.",
      catatanDokter: "Gunakan sampo khusus sensitif untuk perawatan rutin di rumah. Sisir bulu minimal 3x seminggu.",
      simpanPenyakit: false,
      simpanAlergi: true,
      tindakanList: [
        { id: 1, penanganan: "Mandi besar dengan sampo hypoallergenic dan kondisioner bulu panjang", durasi: "45 menit" },
        { id: 2, penanganan: "Potong dan rapikan bulu di area wajah, kaki, dan ekor", durasi: "30 menit" },
        { id: 3, penanganan: "Trimming kuku semua kaki depan dan belakang", durasi: "10 menit" },
      ],
    },
  },
  {
    id_riwayat: 3,
    tanggal: "2025-04-15",
    tanggal_dd: "15",
    bulan: "Apr 2025",
    hari: "Selasa",
    jam: "10:30",
    grand_total: 520000,
    status_bayar: "lunas",
    catatan: null,
    no_booking: "BK-2025-003",
    no_antrian: 2,
    status_booking: "selesai",
    layanan_utama: "Pemeriksaan & Pengobatan",
    layanan_kategori: "Perawatan Medis",
    layanans: [
      { id_layanan: 4, nama_layanan: "Konsultasi Dokter", kategori: "Perawatan Medis", harga_saat_booking: 150000 },
      { id_layanan: 5, nama_layanan: "Obat Antiparasit", kategori: "Perawatan Medis", harga_saat_booking: 370000 },
    ],
    hewan: { id_hewan: 1, nama: "Buddy", jenis: "Anjing", ras: "Golden Retriever", umur: "3 tahun", berat: "28 kg", foto: null, emoji: "🐕" },
    dokter: { nama_dokter: "drh. Siti Rahayu", spesialisasi: "Dokter Hewan Umum" },
    rekamMedis: {
      tanggal: "2025-04-15",
      waktu: "10:45",
      diagnosa: "Infeksi Parasit",
      diagnosaLengkap: "Ditemukan keberadaan cacing gelang (Toxocara canis) melalui pemeriksaan feses. Anjing menunjukkan gejala perut kembung dan nafsu makan menurun sejak 5 hari terakhir.",
      catatanDokter: "Berikan obat cacing sesuai dosis yang tertera. Hindari kontak dengan anjing lain selama 2 minggu. Kunjungan kontrol dijadwalkan 2 minggu kemudian.",
      simpanPenyakit: true,
      simpanAlergi: false,
      tindakanList: [
        { id: 1, penanganan: "Pemeriksaan feses di laboratorium klinik untuk identifikasi parasit", durasi: "20 menit" },
        { id: 2, penanganan: "Pemberian obat antiparasit oral (Pyrantel Pamoate) sesuai bobot badan", durasi: "5 menit" },
      ],
    },
  },
  {
    id_riwayat: 4,
    tanggal: "2025-04-01",
    tanggal_dd: "01",
    bulan: "Apr 2025",
    hari: "Selasa",
    jam: "08:00",
    grand_total: 450000,
    status_bayar: "lunas",
    catatan: null,
    no_booking: "BK-2025-004",
    no_antrian: 1,
    status_booking: "selesai",
    layanan_utama: "Hotel Hewan 3 Hari",
    layanan_kategori: "Hotel",
    layanans: [
      { id_layanan: 6, nama_layanan: "Hotel Hewan 3 Hari", kategori: "Hotel", harga_saat_booking: 450000 },
    ],
    hewan: { id_hewan: 3, nama: "Mochi", jenis: "Kelinci", ras: "Holland Lop", umur: "1 tahun", berat: "1.8 kg", foto: null, emoji: "🐰" },
    dokter: null,
    rekamMedis: {
      tanggal: "2025-04-01",
      waktu: "08:30",
      diagnosa: "Sehat",
      diagnosaLengkap: "Hewan diterima dalam kondisi baik. Selama penitipan diberikan pakan pelet, hay timothy, dan sayuran segar setiap hari.",
      catatanDokter: "Kelinci tampak aktif dan tidak stres selama penitipan. Nafsu makan baik. Tidak ada keluhan.",
      simpanPenyakit: false,
      simpanAlergi: false,
      tindakanList: [
        { id: 1, penanganan: "Monitoring kondisi hewan 2x sehari oleh petugas", durasi: "3 hari" },
        { id: 2, penanganan: "Pemberian pakan pelet, hay, dan sayuran segar sesuai jadwal", durasi: "3 hari" },
      ],
    },
  },
  {
    id_riwayat: 5,
    tanggal: "2025-03-18",
    tanggal_dd: "18",
    bulan: "Mar 2025",
    hari: "Selasa",
    jam: "14:00",
    grand_total: 175000,
    status_bayar: "lunas",
    catatan: null,
    no_booking: "BK-2025-005",
    no_antrian: 5,
    status_booking: "selesai",
    layanan_utama: "Vaksinasi Distemper",
    layanan_kategori: "Vaksinasi",
    layanans: [
      { id_layanan: 7, nama_layanan: "Vaksinasi Distemper", kategori: "Vaksinasi", harga_saat_booking: 175000 },
    ],
    hewan: { id_hewan: 2, nama: "Luna", jenis: "Kucing", ras: "Persia", umur: "2 tahun", berat: "3.5 kg", foto: null, emoji: "🐱" },
    dokter: { nama_dokter: "drh. Ani Kusuma", spesialisasi: "Spesialis Kucing" },
    rekamMedis: {
      tanggal: "2025-03-18",
      waktu: "14:20",
      diagnosa: "Sehat",
      diagnosaLengkap: "Kucing dalam kondisi sehat dan siap divaksin. Suhu tubuh normal 38.5°C. Tidak ada tanda-tanda penyakit sebelum vaksinasi dilakukan.",
      catatanDokter: "Setelah vaksinasi hindari mandi minimal 3 hari. Pantau jika ada reaksi vaksin seperti lemas atau demam ringan.",
      simpanPenyakit: false,
      simpanAlergi: false,
      tindakanList: [
        { id: 1, penanganan: "Pemeriksaan fisik pra-vaksinasi meliputi suhu, berat, dan kondisi umum", durasi: "10 menit" },
        { id: 2, penanganan: "Injeksi vaksin Distemper (FVRCP) secara subkutan", durasi: "5 menit" },
      ],
    },
  },
  {
    id_riwayat: 6,
    tanggal: "2025-03-05",
    tanggal_dd: "05",
    bulan: "Mar 2025",
    hari: "Rabu",
    jam: "11:00",
    grand_total: 195000,
    status_bayar: "menunggu_pembayaran",
    catatan: "Pemilik membatalkan karena hewan sakit",
    no_booking: "BK-2025-006",
    no_antrian: 4,
    status_booking: "dibatalkan",
    layanan_utama: "Grooming Basic",
    layanan_kategori: "Grooming",
    layanans: [
      { id_layanan: 8, nama_layanan: "Grooming Basic", kategori: "Grooming", harga_saat_booking: 195000 },
    ],
    hewan: { id_hewan: 1, nama: "Buddy", jenis: "Anjing", ras: "Golden Retriever", umur: "3 tahun", berat: "28 kg", foto: null, emoji: "🐕" },
    dokter: { nama_dokter: "drh. Budi Santoso", spesialisasi: "Groomer & Dokter Hewan" },
    rekamMedis: null,
  },
];

export const DUMMY_STATS = {
  total: DUMMY_RIWAYAT.length,
  Vaksinasi:        DUMMY_RIWAYAT.filter(r => r.layanan_kategori === "Vaksinasi").length,
  Grooming:         DUMMY_RIWAYAT.filter(r => r.layanan_kategori === "Grooming").length,
  "Perawatan Medis": DUMMY_RIWAYAT.filter(r => r.layanan_kategori === "Perawatan Medis").length,
  Hotel:            DUMMY_RIWAYAT.filter(r => r.layanan_kategori === "Hotel").length,
  Lainnya:          0,
};