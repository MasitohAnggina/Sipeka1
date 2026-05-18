"use client";

import { useState, useMemo, useRef } from "react";
import Sidebar from "@/components/Sidebar_dokter";
import Header from "@/components/Header";
import {
  User, Stethoscope, Pill, Receipt, FileText, Printer,
  Plus, Trash2, Search, PawPrint, ChevronRight,
  ArrowLeft, CheckCircle2, Clock, Calendar, ChevronDown,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────
interface Obat {
  id: number; nama: string; kategori: string; satuan: string;
  harga: number; stok: number; minStok: number; deskripsi: string;
}
interface Layanan {
  id: number; nama: string; kategori: string; subKategori?: string;
  durasi?: string; harga: number; deskripsi: string; emoji: string;
  tersedia: boolean; catatan?: string;
}
interface CartItem    { obat: Obat; qty: number; }
interface CartLayanan { layanan: Layanan; qty: number; }

interface HewanData   { nama: string; jenis: string; ras: string; berat: string; usia: string; kelamin: string; warna: string; }
interface PemilikData { id: number; nama: string; noHP: string; email: string; alamat: string; kota: string; hewan: HewanData[]; }

interface ResepTersimpan {
  id: number;
  tanggal: string;
  waktu: string;
  pemilik: PemilikData;
  hewan: HewanData;
  keluhan: string;
  cartLayanan: CartLayanan[];
  cart: CartItem[];
  catatan: string;
  grandTotal: number;
}

// ── Data ───────────────────────────────────────────────────────────────────
const PEMILIK_DATA: PemilikData[] = [
  { id:1,  nama:"Anggina Syafitri",      noHP:"0812-3456-7890", email:"anggina@gmail.com",         alamat:"Jl. Merpati No.12, Batu Ampar",          kota:"Batam", hewan:[{ nama:"Mochi",    jenis:"Kucing",   ras:"Persian",          berat:"3.5 kg", usia:"2 thn", kelamin:"Betina", warna:"Putih" },{ nama:"Shadow",   jenis:"Kucing",   ras:"DSH",              berat:"4.2 kg", usia:"4 thn", kelamin:"Jantan", warna:"Hitam" }]},
  { id:2,  nama:"Budi Santoso",          noHP:"0813-9876-5432", email:"budi.santoso@yahoo.com",    alamat:"Jl. Sudirman No.5, Lubuk Baja",          kota:"Batam", hewan:[{ nama:"Rocky",    jenis:"Anjing",   ras:"Golden Retriever",  berat:"28 kg",  usia:"3 thn", kelamin:"Jantan", warna:"Emas" },{ nama:"Bella",    jenis:"Anjing",   ras:"Beagle",           berat:"11 kg",  usia:"1 thn", kelamin:"Betina", warna:"Tri-color" }]},
  { id:3,  nama:"Reza Fadhilah",         noHP:"0821-1111-2222", email:"reza.fad@gmail.com",        alamat:"Komp. Batu Aji Blok C3 No.7",           kota:"Batam", hewan:[{ nama:"Coco",     jenis:"Anjing",   ras:"Shih Tzu",         berat:"5.2 kg", usia:"1 thn", kelamin:"Jantan", warna:"Coklat-Putih" }]},
  { id:4,  nama:"Diana Putri Handayani", noHP:"0878-3333-4444", email:"diana.putri@gmail.com",     alamat:"Jl. Hang Tuah No.7, Nagoya",            kota:"Batam", hewan:[{ nama:"Luna",     jenis:"Kucing",   ras:"Anggora",          berat:"2.8 kg", usia:"5 thn", kelamin:"Betina", warna:"Abu-abu" },{ nama:"Oreo",     jenis:"Kucing",   ras:"Scottish Fold",    berat:"3.9 kg", usia:"2 thn", kelamin:"Jantan", warna:"Hitam-Putih" }]},
  { id:5,  nama:"Citra Lestari",         noHP:"0856-5555-6666", email:"citra.lestari@hotmail.com", alamat:"Ruko Nagoya Hill B2-15",                 kota:"Batam", hewan:[{ nama:"Snowball", jenis:"Kelinci",  ras:"Holland Lop",      berat:"1.8 kg", usia:"8 bln", kelamin:"Betina", warna:"Putih" },{ nama:"Caramel",  jenis:"Kelinci",  ras:"Rex",              berat:"2.1 kg", usia:"1 thn", kelamin:"Jantan", warna:"Coklat" }]},
  { id:6,  nama:"Deni Wahyudi",          noHP:"0819-7777-8888", email:"deni.w@gmail.com",          alamat:"Jl. Raja Isa Blok F No.3, Sagulung",    kota:"Batam", hewan:[{ nama:"Bunga",    jenis:"Anjing",   ras:"Poodle",           berat:"4.1 kg", usia:"2 thn", kelamin:"Betina", warna:"Krem" }]},
  { id:7,  nama:"Fitria Rahayu",         noHP:"0851-2222-3333", email:"fitria.rh@gmail.com",       alamat:"Perum Taman Raya Blok H5, Batam Center", kota:"Batam", hewan:[{ nama:"Koko",     jenis:"Burung",   ras:"Lovebird",         berat:"0.06 kg",usia:"1 thn", kelamin:"Jantan", warna:"Hijau-Biru" },{ nama:"Pipi",     jenis:"Burung",   ras:"Cockatiel",        berat:"0.09 kg",usia:"6 bln", kelamin:"Betina", warna:"Abu-kuning" }]},
  { id:8,  nama:"Hendra Gunawan",        noHP:"0822-4444-5555", email:"hendra.g@gmail.com",        alamat:"Jl. Brigjen Katamso No.22, Tanjung Uncang",kota:"Batam",hewan:[{ nama:"Max",      jenis:"Anjing",   ras:"German Shepherd",  berat:"32 kg",  usia:"4 thn", kelamin:"Jantan", warna:"Hitam-Coklat" },{ nama:"Lily",     jenis:"Anjing",   ras:"Maltese",          berat:"3.5 kg", usia:"2 thn", kelamin:"Betina", warna:"Putih" }]},
  { id:9,  nama:"Indah Permata Sari",    noHP:"0877-6666-7777", email:"indah.ps@gmail.com",        alamat:"Komp. Griya Batam Permai C12, Sekupang", kota:"Batam", hewan:[{ nama:"Pudding",  jenis:"Kucing",   ras:"British Shorthair",berat:"5.1 kg", usia:"3 thn", kelamin:"Jantan", warna:"Abu-biru" }]},
  { id:10, nama:"Joko Prasetyo",         noHP:"0814-8888-9999", email:"joko.pras@gmail.com",       alamat:"Jl. Diponegoro No.11, Tanjung Pinggir",  kota:"Batam", hewan:[{ nama:"Milo",     jenis:"Anjing",   ras:"Labrador",         berat:"25 kg",  usia:"2 thn", kelamin:"Jantan", warna:"Coklat" },{ nama:"Titi",     jenis:"Kucing",   ras:"Siam",             berat:"3.2 kg", usia:"1 thn", kelamin:"Betina", warna:"Krem-Coklat" }]},
  { id:11, nama:"Kartini Dewi",          noHP:"0853-1010-2020", email:"kartini.dw@gmail.com",      alamat:"Jl. Imam Bonjol No.8, Batam Kota",       kota:"Batam", hewan:[{ nama:"Hampi",    jenis:"Hamster",  ras:"Syrian",           berat:"0.12 kg",usia:"5 bln", kelamin:"Jantan", warna:"Oranye-Putih" },{ nama:"Hambi",    jenis:"Hamster",  ras:"Roborovski",       berat:"0.03 kg",usia:"4 bln", kelamin:"Betina", warna:"Putih-Abu" }]},
  { id:12, nama:"Lukman Hakim",          noHP:"0811-3030-4040", email:"lukman.hk@gmail.com",       alamat:"Ruko Sunrise Garden No.5, Batam Center", kota:"Batam", hewan:[{ nama:"Sultan",   jenis:"Anjing",   ras:"Rottweiler",       berat:"45 kg",  usia:"5 thn", kelamin:"Jantan", warna:"Hitam-Coklat" }]},
];

const seedObat: Obat[] = [
  { id:1,  nama:"Metronidazole 500mg",        kategori:"Antibiotik",      satuan:"tablet",      harga:5000,   stok:85,  minStok:20, deskripsi:"Antibiotik untuk gastroenteritis & infeksi bakteri anaerob" },
  { id:9,  nama:"Doxycycline 25mg",           kategori:"Antibiotik",      satuan:"tablet",      harga:55000,  stok:30,  minStok:10, deskripsi:"Antibiotik untuk infeksi saluran pernapasan dan urinary" },
  { id:2,  nama:"Probiotik FortiFlora",       kategori:"Suplemen",        satuan:"sachet",      harga:35000,  stok:40,  minStok:10, deskripsi:"Suplemen probiotik untuk kesehatan pencernaan hewan" },
  { id:5,  nama:"Ori-Vit A+D+D3+C",          kategori:"Vitamin",         satuan:"botol 30ml",  harga:75000,  stok:4,   minStok:10, deskripsi:"Multivitamin lengkap untuk daya tahan dan pertumbuhan" },
  { id:3,  nama:"Cairan Infus RL",            kategori:"Infus",           satuan:"botol 500ml", harga:45000,  stok:100, minStok:10, deskripsi:"Ringer Laktat untuk rehidrasi dan keseimbangan elektrolit" },
  { id:10, nama:"Omeprazole 20mg",            kategori:"Gastrointestinal",satuan:"kapsul",      harga:40000,  stok:60,  minStok:15, deskripsi:"Mengurangi produksi asam lambung pada hewan" },
  { id:4,  nama:"Drontal Tablet",             kategori:"Antiparasit",     satuan:"tablet",      harga:35000,  stok:50,  minStok:20, deskripsi:"Obat cacing broad-spectrum untuk kucing dan anjing" },
  { id:7,  nama:"Albendazole",                kategori:"Antiparasit",     satuan:"tablet",      harga:8000,   stok:3,   minStok:10, deskripsi:"Antiparasit spektrum luas untuk cacing pita dan nematoda" },
  { id:8,  nama:"Simparica Tablet",           kategori:"Antiparasit",     satuan:"tablet",      harga:125000, stok:0,   minStok:5,  deskripsi:"Perlindungan kutu & tungau bulanan untuk anjing dewasa" },
  { id:6,  nama:"Antihistamin (Cetirizine)",  kategori:"Antihistamin",    satuan:"tablet",      harga:8000,   stok:12,  minStok:15, deskripsi:"Meredakan reaksi alergi dan gatal-gatal pada hewan" },
  { id:11, nama:"Tobramycin Tetes Mata 0.3%", kategori:"Oftalmologi",     satuan:"botol 5ml",   harga:65000,  stok:15,  minStok:5,  deskripsi:"Tetes mata antibiotik untuk infeksi mata bakteri" },
];

const seedLayanan: Layanan[] = [
  { id:201, nama:"Konsultasi & Pemeriksaan",  kategori:"Medis",     subKategori:"Pemeriksaan", durasi:"30–45 mnt", harga:50000,  emoji:"🩺", tersedia:true,  deskripsi:"Pemeriksaan fisik menyeluruh dan konsultasi dokter hewan." },
  { id:202, nama:"Konsultasi Emergency",      kategori:"Medis",     subKategori:"Pemeriksaan", durasi:"Segera",    harga:100000, emoji:"🚨", tersedia:true,  deskripsi:"Penanganan darurat di luar jam operasional.",                catatan:"Di luar jam operasional" },
  { id:203, nama:"Bedah Mayor",               kategori:"Medis",     subKategori:"Bedah",       durasi:"Kasus",     harga:0,      emoji:"⚕️", tersedia:true,  deskripsi:"Prosedur operasi besar seperti splenektomi atau laparotomi.", catatan:"Biaya dikonfirmasi" },
  { id:204, nama:"Bedah Minor",               kategori:"Medis",     subKategori:"Bedah",       durasi:"Kasus",     harga:0,      emoji:"🔪", tersedia:true,  deskripsi:"Tindakan operasi kecil seperti eksisi tumor superfisial.",    catatan:"Biaya dikonfirmasi" },
  { id:205, nama:"Laboratorium",              kategori:"Medis",     subKategori:"Diagnostik",  durasi:"1–2 jam",   harga:0,      emoji:"🔬", tersedia:true,  deskripsi:"Pemeriksaan darah, urine, feses, atau kultur.",              catatan:"Biaya sesuai jenis" },
  { id:206, nama:"Rawat Inap – Non-Infeksius",kategori:"Medis",     subKategori:"Rawat Inap",  durasi:"Per hari",  harga:50000,  emoji:"🏥", tersedia:true,  deskripsi:"Perawatan hewan non-infeksius per hari." },
  { id:207, nama:"Rawat Inap – Infeksius",    kategori:"Medis",     subKategori:"Rawat Inap",  durasi:"Per hari",  harga:50000,  emoji:"🦠", tersedia:true,  deskripsi:"Perawatan isolasi untuk hewan dengan penyakit menular." },
  { id:208, nama:"Perawatan Luka",            kategori:"Medis",     subKategori:"Perawatan",   durasi:"Kasus",     harga:0,      emoji:"🩹", tersedia:true,  deskripsi:"Pembersihan luka, flushing, penjahitan, dan perban.",        catatan:"Biaya sesuai kondisi" },
  { id:301, nama:"Vaksin Kucing 3 Penyakit",  kategori:"Vaksinasi", subKategori:"Kucing",      durasi:"20–30 mnt", harga:160000, emoji:"🐱", tersedia:true,  deskripsi:"Vaksin kombinasi panleukopenia, calicivirus, rhinotracheitis." },
  { id:302, nama:"Vaksin Kucing 5 Penyakit",  kategori:"Vaksinasi", subKategori:"Kucing",      durasi:"20–30 mnt", harga:250000, emoji:"🐱", tersedia:true,  deskripsi:"Perlindungan 5 penyakit kucing termasuk FeLV." },
  { id:303, nama:"Vaksin Anjing 2 Penyakit",  kategori:"Vaksinasi", subKategori:"Anjing",      durasi:"20–30 mnt", harga:160000, emoji:"🐶", tersedia:true,  deskripsi:"Vaksin awal untuk anak anjing usia 6–8 minggu." },
  { id:304, nama:"Vaksin Anjing 5 Penyakit",  kategori:"Vaksinasi", subKategori:"Anjing",      durasi:"20–30 mnt", harga:210000, emoji:"🐶", tersedia:true,  deskripsi:"Vaksin DHPPiL komprehensif untuk anjing dewasa." },
  { id:305, nama:"Vaksin Bordetella",         kategori:"Vaksinasi", subKategori:"Anjing",      durasi:"20 mnt",    harga:120000, emoji:"🫁", tersedia:false, deskripsi:"Perlindungan terhadap batuk kennel pada anjing.",            catatan:"Stok tidak selalu tersedia" },
  { id:401, nama:"Grooming Kucing – Basic",   kategori:"Grooming",  subKategori:"Kucing",      durasi:"60 mnt",    harga:55000,  emoji:"🐱", tersedia:true,  deskripsi:"Mandi standar: shampo, bilas, pengeringan, penyisiran." },
  { id:402, nama:"Grooming Kucing – Treatment",kategori:"Grooming", subKategori:"Kucing",      durasi:"75 mnt",    harga:70000,  emoji:"🐱", tersedia:true,  deskripsi:"Perawatan khusus kucing dengan masalah kutu atau jamur." },
  { id:403, nama:"Grooming Kucing – Special", kategori:"Grooming",  subKategori:"Kucing",      durasi:"90 mnt",    harga:100000, emoji:"✨", tersedia:true,  deskripsi:"Mandi + kondisioner + potong kuku + telinga + cologne." },
  { id:404, nama:"Grooming Anjing Basic",     kategori:"Grooming",  subKategori:"Anjing",      durasi:"60 mnt",    harga:70000,  emoji:"🐶", tersedia:true,  deskripsi:"Mandi dasar untuk anjing kecil di bawah 5 kg.",              catatan:"<5 kg" },
  { id:405, nama:"Grooming Anjing Treatment", kategori:"Grooming",  subKategori:"Anjing",      durasi:"75 mnt",    harga:95000,  emoji:"🐶", tersedia:true,  deskripsi:"Perawatan anjing kecil dengan kutu atau jamur.",             catatan:"<5 kg" },
  { id:406, nama:"Grooming Anjing Special",   kategori:"Grooming",  subKategori:"Anjing",      durasi:"90 mnt",    harga:120000, emoji:"✨", tersedia:true,  deskripsi:"Grooming lengkap: mandi + potong bulu + kuku + parfum.",     catatan:"<5 kg" },
  { id:501, nama:"Pet Hotel – Harian",        kategori:"Pet Hotel", subKategori:"Penitipan",   durasi:"Per hari",  harga:50000,  emoji:"🏡", tersedia:true,  deskripsi:"Penitipan hewan per hari termasuk monitoring dan makan." },
];

// ── Constants ──────────────────────────────────────────────────────────────
const G = "#2e7d32";
const fmt = (n: number) => "Rp " + n.toLocaleString("id-ID");

const JENIS_EMOJI: Record<string, string> = {
  Kucing:"🐱", Anjing:"🐶", Kelinci:"🐰", Burung:"🦜", Hamster:"🐹",
};
const KAT_LAYANAN: Record<string, { color: string; bg: string }> = {
  "Medis":     { color:"#1565c0", bg:"#e3f2fd" },
  "Vaksinasi": { color:"#00695c", bg:"#e0f2f1" },
  "Grooming":  { color:"#6a1b9a", bg:"#f3e5f5" },
  "Pet Hotel": { color:"#e65100", bg:"#fff3e0" },
};
const KAT_OBAT: Record<string, { color: string; bg: string }> = {
  "Antibiotik":       { color:"#c62828", bg:"#ffebee" },
  "Suplemen":         { color:G,         bg:"#e8f5e9" },
  "Vitamin":          { color:"#e65100", bg:"#fff3e0" },
  "Infus":            { color:"#1565c0", bg:"#e3f2fd" },
  "Gastrointestinal": { color:"#d97706", bg:"#fef3c7" },
  "Antiparasit":      { color:"#6a1b9a", bg:"#f3e5f5" },
  "Antihistamin":     { color:"#00695c", bg:"#e0f2f1" },
  "Oftalmologi":      { color:"#0369a1", bg:"#e0f2fe" },
};
const STOK_STYLE: Record<string, { bg: string; color: string }> = {
  Aman:   { bg:"#e8f5e9", color:G },
  Kritis: { bg:"#fff3e0", color:"#e65100" },
  Habis:  { bg:"#ffebee", color:"#c62828" },
};

function stokStatus(o: Obat) {
  if (o.stok === 0)        return "Habis";
  if (o.stok < o.minStok) return "Kritis";
  return "Aman";
}

// ── Shared styles ──────────────────────────────────────────────────────────
// PERBAIKAN: Hapus overflow:"hidden" dari cardBase agar dropdown tidak terpotong
const cardBase: React.CSSProperties = {
  background:"#fff", borderRadius:12, border:"1px solid #f0f0f0",
  marginBottom:16,
};
const thS: React.CSSProperties = {
  padding:"10px 14px", fontSize:11, fontWeight:700, color:"#fff",
  textAlign:"left", background:G, whiteSpace:"nowrap",
  textTransform:"uppercase", letterSpacing:".04em",
};
const tdS: React.CSSProperties = {
  padding:"10px 14px", fontSize:13, color:"#1a1a1a",
  borderBottom:"1px solid #f0f0f0", verticalAlign:"middle",
};
const labelStyle: React.CSSProperties = {
  fontSize:12, fontWeight:600, color:"#666", display:"block", marginBottom:5,
};
const inputStyle: React.CSSProperties = {
  width:"100%", padding:"9px 12px", border:"1.5px solid #e0e0e0",
  borderRadius:8, fontSize:13, fontFamily:"inherit", outline:"none",
  background:"#fafafa", color:"#1a1a1a", transition:"border-color .15s",
};

// ── Small components ───────────────────────────────────────────────────────
function QtyControl({ qty, onInc, onDec }: { qty: number; onInc(): void; onDec(): void }) {
  return (
    <div style={{ display:"flex", alignItems:"center", gap:6 }}>
      <button onClick={onDec} style={{ width:28, height:28, borderRadius:7, border:`1.5px solid ${G}`, background:"#fff", color:G, fontSize:16, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>−</button>
      <span style={{ fontWeight:700, fontSize:14, minWidth:22, textAlign:"center" }}>{qty}</span>
      <button onClick={onInc} style={{ width:28, height:28, borderRadius:7, border:"none", background:G, color:"#fff", fontSize:16, fontWeight:700, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>+</button>
    </div>
  );
}

function AddBtn({ onClick, disabled }: { onClick(): void; disabled?: boolean }) {
  return (
    <button onClick={onClick} disabled={disabled}
      style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"6px 14px", borderRadius:8, border:"none", background:disabled?"#e0e0e0":G, color:disabled?"#aaa":"#fff", fontSize:12, fontWeight:700, cursor:disabled?"not-allowed":"pointer", fontFamily:"inherit" }}
      onMouseEnter={e => { if(!disabled) e.currentTarget.style.background="#1b5e20"; }}
      onMouseLeave={e => { if(!disabled) e.currentTarget.style.background=disabled?"#e0e0e0":G; }}
    >
      <Plus style={{ width:13, height:13 }} /> Tambah
    </button>
  );
}

function SectionHeader({ icon, title, badge, right }: { icon: React.ReactNode; title: string; badge?: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div style={{ padding:"12px 18px", borderBottom:"1px solid #f0f0f0", display:"flex", alignItems:"center", gap:8, borderRadius:"12px 12px 0 0" }}>
      {icon}
      <span style={{ fontWeight:700, fontSize:14 }}>{title}</span>
      {badge}
      {right && <div style={{ marginLeft:"auto" }}>{right}</div>}
    </div>
  );
}

function SearchInput({ value, onChange, placeholder }: { value: string; onChange(v: string): void; placeholder: string }) {
  return (
    <div style={{ position:"relative", width:240 }}>
      <Search style={{ position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", width:13, height:13, color:"#aaa" }} />
      <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        style={{ ...inputStyle, padding:"7px 10px 7px 30px", fontSize:12 }}
        onFocus={e => e.currentTarget.style.borderColor=G}
        onBlur={e  => e.currentTarget.style.borderColor="#e0e0e0"}
      />
    </div>
  );
}

// ── Step 1: Pilih Pemilik & Hewan ──────────────────────────────────────────
function StepPasien({ onNext }: { onNext(d: { pemilik: PemilikData; hewan: HewanData; keluhan: string }): void }) {
  const [query,       setQuery]       = useState("");
  const [focused,     setFocused]     = useState(false);
  const [pemilik,     setPemilik]     = useState<PemilikData | null>(null);
  const [hewanIdx,    setHewanIdx]    = useState(0);
  const [keluhan,     setKeluhan]     = useState("");
  const picking = useRef(false);

  const suggestions = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return PEMILIK_DATA.filter(p =>
      p.nama.toLowerCase().includes(q) ||
      p.noHP.replace(/-/g,"").includes(q.replace(/-/g,"")) ||
      p.hewan.some(h => h.nama.toLowerCase().includes(q) || h.ras.toLowerCase().includes(q))
    );
  }, [query]);

  const hewanList  = pemilik?.hewan ?? [];
  const hewan      = hewanList[hewanIdx] ?? null;
  const canNext    = !!pemilik && !!hewan;
  const showDrop   = focused && !!query.trim() && !pemilik;

  function pick(p: PemilikData) {
    picking.current = false;
    setPemilik(p); setQuery(p.nama); setFocused(false); setHewanIdx(0); setKeluhan("");
  }
  function reset() { setPemilik(null); setQuery(""); setHewanIdx(0); setKeluhan(""); }

  return (
    <div style={{ maxWidth:800, margin:"0 auto" }}>

      {/* ── Cari Pemilik ── */}
      {/* PERBAIKAN UTAMA: overflow:"visible" agar dropdown tidak terpotong oleh card */}
      <div style={{ ...cardBase, overflow:"visible" }}>
        <SectionHeader
          icon={<User style={{ width:15, height:15, color:G }} />}
          title="Cari Pemilik Hewan"
          badge={<span style={{ fontSize:11, color:"#aaa", background:"#f4f4f4", borderRadius:20, padding:"2px 9px" }}>{PEMILIK_DATA.length} terdaftar</span>}
        />
        <div style={{ padding:"14px 18px", position:"relative" }}>
          {/* Input */}
          <div style={{ position:"relative" }}>
            <Search style={{ position:"absolute", left:12, top:"50%", transform:"translateY(-50%)", width:14, height:14, color:"#aaa" }} />
            <input
              value={query}
              onChange={e => { setQuery(e.target.value); if (pemilik && e.target.value !== pemilik.nama) { setPemilik(null); setHewanIdx(0); } }}
              placeholder="Cari nama pemilik, no HP, atau nama hewan..."
              style={{ ...inputStyle, padding:"10px 36px 10px 38px", borderColor: focused ? G : "#e0e0e0" }}
              onFocus={() => setFocused(true)}
              onBlur={() => { if (!picking.current) setFocused(false); }}
            />
            {query && (
              <button onMouseDown={e => { e.preventDefault(); reset(); }}
                style={{ position:"absolute", right:12, top:"50%", transform:"translateY(-50%)", border:"none", background:"none", cursor:"pointer", color:"#aaa", fontSize:20, lineHeight:1 }}>×</button>
            )}
          </div>

          {/* PERBAIKAN: z-index ditingkatkan menjadi 9999 agar dropdown muncul di atas semua elemen */}
          {showDrop && (
            <div
              onMouseDown={() => { picking.current = true; }}
              onMouseUp={()   => { picking.current = false; }}
              style={{
                position: "absolute",
                left: 18,
                right: 18,
                top: "calc(100% - 4px)",
                background: "#fff",
                border: "1.5px solid #e0e0e0",
                borderRadius: 12,
                boxShadow: "0 8px 28px rgba(0,0,0,.15)",
                zIndex: 9999,
                maxHeight: 340,
                overflowY: "auto",
              }}
            >
              {suggestions.length === 0 ? (
                <div style={{ padding:"20px 16px", textAlign:"center", color:"#aaa", fontSize:13 }}>😕 Pemilik tidak ditemukan</div>
              ) : suggestions.map((p, i) => (
                <div key={p.id} onMouseDown={e => { e.preventDefault(); pick(p); }}
                  style={{ padding:"12px 16px", cursor:"pointer", borderBottom: i < suggestions.length-1 ? "1px solid #f0f0f0" : "none", display:"flex", alignItems:"flex-start", gap:12 }}
                  onMouseEnter={e => e.currentTarget.style.background="#f0faf0"}
                  onMouseLeave={e => e.currentTarget.style.background="#fff"}
                >
                  <div style={{ width:38, height:38, borderRadius:"50%", background:"#e8f5e9", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                    <User style={{ width:16, height:16, color:G }} />
                  </div>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontWeight:700, fontSize:13 }}>{p.nama}</div>
                    <div style={{ fontSize:11, color:"#888", marginTop:2 }}>📞 {p.noHP} · 📍 {p.kota}</div>
                    <div style={{ marginTop:5, display:"flex", gap:5, flexWrap:"wrap" }}>
                      {p.hewan.map((h, j) => (
                        <span key={j} style={{ fontSize:10, fontWeight:600, background:"#f4f4f4", color:"#555", borderRadius:20, padding:"2px 8px" }}>
                          {JENIS_EMOJI[h.jenis]??"🐾"} {h.nama} · {h.ras}
                        </span>
                      ))}
                    </div>
                  </div>
                  <span style={{ fontSize:11, color:"#bbb", flexShrink:0 }}>{p.hewan.length} hewan</span>
                </div>
              ))}
            </div>
          )}

          {/* Detail pemilik terpilih */}
          {pemilik && (
            <div style={{ marginTop:12, background:"#f0faf0", border:"1.5px solid #a5d6a7", borderRadius:10, padding:"12px 16px", display:"flex", alignItems:"flex-start", gap:12 }}>
              <div style={{ width:40, height:40, borderRadius:"50%", background:G, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                <User style={{ width:18, height:18, color:"#fff" }} />
              </div>
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:800, fontSize:14 }}>{pemilik.nama}</div>
                <div style={{ fontSize:12, color:"#555", marginTop:3, display:"flex", gap:14, flexWrap:"wrap" }}>
                  <span>📞 {pemilik.noHP}</span><span>✉️ {pemilik.email}</span>
                </div>
                <div style={{ fontSize:12, color:"#555", marginTop:2 }}>📍 {pemilik.alamat}, {pemilik.kota}</div>
              </div>
              <button onClick={reset} style={{ border:"none", background:"none", cursor:"pointer", color:"#aaa", fontSize:20 }}>×</button>
            </div>
          )}
        </div>
      </div>

      {/* ── Pilih Hewan ── */}
      {pemilik && (
        <div style={cardBase}>
          <SectionHeader
            icon={<PawPrint style={{ width:15, height:15, color:G }} />}
            title="Pilih Hewan Peliharaan"
            badge={<span style={{ fontSize:11, color:"#aaa", background:"#f4f4f4", borderRadius:20, padding:"2px 9px" }}>{hewanList.length} hewan</span>}
          />
          <div style={{ padding:"14px 18px" }}>
            <div style={{ display:"flex", gap:10, flexWrap:"wrap", marginBottom: hewan ? 14 : 0 }}>
              {hewanList.map((h, i) => {
                const sel = i === hewanIdx;
                return (
                  <div key={i} onClick={() => setHewanIdx(i)}
                    style={{ padding:"10px 14px", borderRadius:10, border:`2px solid ${sel?G:"#e0e0e0"}`, background:sel?"#f0faf0":"#fafafa", cursor:"pointer", display:"flex", alignItems:"center", gap:10, minWidth:155, transition:"all .15s" }}
                    onMouseEnter={e => { if(!sel) e.currentTarget.style.borderColor="#b2dfdb"; }}
                    onMouseLeave={e => { if(!sel) e.currentTarget.style.borderColor="#e0e0e0"; }}
                  >
                    <span style={{ fontSize:24 }}>{JENIS_EMOJI[h.jenis]??"🐾"}</span>
                    <div>
                      <div style={{ fontWeight:800, fontSize:13, color:sel?G:"#333" }}>{h.nama}</div>
                      <div style={{ fontSize:11, color:"#888" }}>{h.ras} · {h.kelamin}</div>
                    </div>
                    {sel && <CheckCircle2 style={{ width:14, height:14, color:G, marginLeft:"auto" }} />}
                  </div>
                );
              })}
            </div>

            {hewan && (
              <div style={{ overflowX:"auto", borderRadius:10, border:"1.5px solid #e0e0e0" }}>
                <table style={{ width:"100%", borderCollapse:"collapse" }}>
                  <thead><tr>
                    {["Nama","Jenis","Ras","Berat","Usia","Kelamin","Warna"].map(h => (
                      <th key={h} style={{ ...thS, fontSize:11 }}>{h}</th>
                    ))}
                  </tr></thead>
                  <tbody>
                    <tr>
                      <td style={{ ...tdS, fontWeight:700 }}>{hewan.nama}</td>
                      <td style={tdS}><span style={{ marginRight:4 }}>{JENIS_EMOJI[hewan.jenis]??"🐾"}</span>{hewan.jenis}</td>
                      <td style={tdS}>{hewan.ras}</td>
                      <td style={tdS}>{hewan.berat}</td>
                      <td style={tdS}>{hewan.usia}</td>
                      <td style={tdS}>{hewan.kelamin}</td>
                      <td style={tdS}>{hewan.warna}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Keluhan ── */}
      {pemilik && hewan && (
        <div style={cardBase}>
          <SectionHeader
            icon={<FileText style={{ width:15, height:15, color:G }} />}
            title="Keluhan Utama"
            badge={<span style={{ fontSize:12, color:"#aaa" }}>(opsional)</span>}
          />
          <div style={{ padding:"14px 18px" }}>
            <textarea value={keluhan} onChange={e => setKeluhan(e.target.value)} rows={3}
              placeholder="Contoh: Nafsu makan menurun, diare 2 hari, muntah-muntah..."
              style={{ ...inputStyle, resize:"vertical", lineHeight:1.6 }}
              onFocus={e => e.currentTarget.style.borderColor=G}
              onBlur={e  => e.currentTarget.style.borderColor="#e0e0e0"}
            />
          </div>
        </div>
      )}

      <div style={{ display:"flex", justifyContent:"flex-end", paddingBottom:8 }}>
        <button disabled={!canNext} onClick={() => canNext && onNext({ pemilik: pemilik!, hewan: hewan!, keluhan })}
          style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"10px 26px", borderRadius:10, border:"none", background:canNext?G:"#e0e0e0", color:canNext?"#fff":"#aaa", fontSize:14, fontWeight:700, cursor:canNext?"pointer":"not-allowed", fontFamily:"inherit" }}
          onMouseEnter={e => { if(canNext) e.currentTarget.style.background="#1b5e20"; }}
          onMouseLeave={e => { if(canNext) e.currentTarget.style.background=canNext?G:"#e0e0e0"; }}
        >
          Pilih Layanan & Obat <ChevronRight style={{ width:16, height:16 }} />
        </button>
      </div>
    </div>
  );
}

// ── Step 2: Pilih Layanan & Obat ───────────────────────────────────────────
function StepTindakan({
  pemilik, hewan, keluhan, onBack, onKonfirmasi,
}: {
  pemilik: PemilikData; hewan: HewanData; keluhan: string;
  onBack(): void;
  onKonfirmasi(r: Omit<ResepTersimpan, "id">): void;
}) {
  const [cartLayanan,    setCartLayanan]    = useState<CartLayanan[]>([]);
  const [cart,           setCart]           = useState<CartItem[]>([]);
  const [catatan,        setCatatan]        = useState("• Kontrol ulang jika tidak ada perbaikan dalam 3 hari");
  const [searchLayanan,  setSearchLayanan]  = useState("");
  const [searchObat,     setSearchObat]     = useState("");
  const [tab,            setTab]            = useState<"layanan"|"obat">("layanan");
  const [showConfirm,    setShowConfirm]    = useState(false);

  const fLayanan = useMemo(() => seedLayanan.filter(l =>
    l.nama.toLowerCase().includes(searchLayanan.toLowerCase()) ||
    l.kategori.toLowerCase().includes(searchLayanan.toLowerCase()) ||
    (l.subKategori??"").toLowerCase().includes(searchLayanan.toLowerCase())
  ), [searchLayanan]);

  const fObat = useMemo(() => seedObat.filter(o =>
    o.nama.toLowerCase().includes(searchObat.toLowerCase()) ||
    o.kategori.toLowerCase().includes(searchObat.toLowerCase())
  ), [searchObat]);

  const addL = (l: Layanan) => setCartLayanan(p => { const e = p.find(c => c.layanan.id===l.id); return e ? p.map(c => c.layanan.id===l.id?{...c,qty:c.qty+1}:c) : [...p,{layanan:l,qty:1}]; });
  const decL = (id: number) => setCartLayanan(p => p.map(c => c.layanan.id===id?{...c,qty:c.qty-1}:c).filter(c => c.qty>0));
  const delL = (id: number) => setCartLayanan(p => p.filter(c => c.layanan.id!==id));
  const addO = (o: Obat)    => setCart(p => { const e = p.find(c => c.obat.id===o.id); return e ? p.map(c => c.obat.id===o.id?{...c,qty:c.qty+1}:c) : [...p,{obat:o,qty:1}]; });
  const decO = (id: number) => setCart(p => p.map(c => c.obat.id===id?{...c,qty:c.qty-1}:c).filter(c => c.qty>0));
  const delO = (id: number) => setCart(p => p.filter(c => c.obat.id!==id));

  const totalL   = cartLayanan.reduce((s,c) => s + c.layanan.harga*c.qty, 0);
  const totalO   = cart.reduce((s,c) => s + c.obat.harga*c.qty, 0);
  const grand    = totalL + totalO;
  const hasItems = cartLayanan.length > 0 || cart.length > 0;

  const layByKat = useMemo(() => {
    const m: Record<string, Layanan[]> = {};
    fLayanan.forEach(l => { if(!m[l.kategori]) m[l.kategori]=[]; m[l.kategori].push(l); });
    return m;
  }, [fLayanan]);

  const obatByKat = useMemo(() => {
    const m: Record<string, Obat[]> = {};
    fObat.forEach(o => { if(!m[o.kategori]) m[o.kategori]=[]; m[o.kategori].push(o); });
    return m;
  }, [fObat]);

  function doKonfirmasi() {
    const now = new Date();
    onKonfirmasi({
      tanggal: now.toLocaleDateString("id-ID",{day:"2-digit",month:"short",year:"numeric"}),
      waktu:   now.toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"})+" WIB",
      pemilik, hewan, keluhan, cartLayanan, cart, catatan, grandTotal: grand,
    });
    setShowConfirm(false);
  }

  return (
    <div style={{ maxWidth:1060, margin:"0 auto" }}>
      <button onClick={onBack} style={{ display:"inline-flex", alignItems:"center", gap:6, border:"none", background:"none", cursor:"pointer", color:"#888", fontSize:13, fontWeight:600, marginBottom:14, padding:0 }}>
        <ArrowLeft style={{ width:14, height:14 }} /> Kembali
      </button>

      {/* Info pasien */}
      <div style={{ ...cardBase, marginBottom:16 }}>
        <div style={{ padding:"12px 18px", display:"flex", alignItems:"center", gap:12, flexWrap:"wrap", borderRadius:12 }}>
          <span style={{ fontSize:26 }}>{JENIS_EMOJI[hewan.jenis]??"🐾"}</span>
          <div style={{ flex:1 }}>
            <span style={{ fontWeight:800, fontSize:14 }}>{hewan.nama}</span>
            <span style={{ color:"#888", fontSize:12, marginLeft:8 }}>{hewan.ras} · {hewan.berat} · {hewan.usia}</span>
          </div>
          <span style={{ fontSize:12, color:"#555" }}>👤 {pemilik.nama} · 📞 {pemilik.noHP}</span>
          {keluhan && <span style={{ fontSize:12, color:"#e65100", background:"#fff3e0", borderRadius:20, padding:"2px 10px" }}>⚠️ {keluhan}</span>}
        </div>
      </div>

      {/* Tab switch */}
      <div style={{ display:"flex", gap:0, background:"#fff", borderRadius:10, padding:4, border:"1px solid #f0f0f0", marginBottom:16, width:"fit-content" }}>
        {([
          { key:"layanan" as const, label:"🩺 Layanan Klinik", count:cartLayanan.length },
          { key:"obat"    as const, label:"💊 Obat & Vitamin",  count:cart.length },
        ]).map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{ padding:"8px 22px", borderRadius:8, border:"none", cursor:"pointer", fontWeight:700, fontSize:13, fontFamily:"inherit", background:tab===t.key?G:"transparent", color:tab===t.key?"#fff":"#888", transition:"all .15s", display:"flex", alignItems:"center", gap:6 }}>
            {t.label}
            {t.count>0 && <span style={{ background:tab===t.key?"rgba(255,255,255,.3)":G, color:"#fff", borderRadius:20, padding:"1px 7px", fontSize:11 }}>{t.count}</span>}
          </button>
        ))}
      </div>

      {/* ── Tabel Layanan ── */}
      {tab==="layanan" && (
        <div style={cardBase}>
          <SectionHeader
            icon={<Stethoscope style={{ width:15, height:15, color:G }} />}
            title="Layanan Klinik"
            badge={<span style={{ fontSize:11, color:"#aaa", background:"#f4f4f4", borderRadius:20, padding:"2px 9px" }}>{seedLayanan.length} item</span>}
            right={<SearchInput value={searchLayanan} onChange={setSearchLayanan} placeholder="Cari layanan..." />}
          />
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead><tr>
                <th style={thS}>Layanan</th>
                <th style={thS}>Kategori</th>
                <th style={thS}>Durasi</th>
                <th style={{ ...thS, textAlign:"right" }}>Harga</th>
                <th style={{ ...thS, textAlign:"center", width:130 }}>Aksi</th>
              </tr></thead>
              <tbody>
                {fLayanan.length===0
                  ? <tr><td colSpan={5} style={{ textAlign:"center", padding:"2rem", color:"#aaa", fontSize:13 }}>Layanan tidak ditemukan</td></tr>
                  : Object.entries(layByKat).map(([kat, items]) => {
                    const cfg = KAT_LAYANAN[kat]??{color:G,bg:"#e8f5e9"};
                    return items.map((l, i) => {
                      const ci = cartLayanan.find(c => c.layanan.id===l.id);
                      return (
                        <>
                          {i===0 && <tr key={`h-${kat}`}><td colSpan={5} style={{ padding:"7px 14px 4px", background:cfg.bg }}>
                            <span style={{ fontSize:11, fontWeight:700, color:cfg.color, textTransform:"uppercase", letterSpacing:".06em" }}>{kat}</span>
                          </td></tr>}
                          <tr key={l.id} style={{ background:i%2===0?"#fff":"#fafafa", opacity:l.tersedia?1:0.5 }}>
                            <td style={tdS}>
                              <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                                <span style={{ fontSize:18 }}>{l.emoji}</span>
                                <div>
                                  <div style={{ fontWeight:700, fontSize:13 }}>{l.nama}</div>
                                  <div style={{ fontSize:11, color:"#888", marginTop:2 }}>{l.deskripsi}</div>
                                  {l.catatan && <span style={{ fontSize:11, fontWeight:600, color:cfg.color, background:cfg.bg, borderRadius:4, padding:"1px 7px", display:"inline-block", marginTop:3 }}>ℹ️ {l.catatan}</span>}
                                </div>
                              </div>
                            </td>
                            <td style={tdS}><span style={{ fontSize:11, fontWeight:700, color:cfg.color, background:cfg.bg, borderRadius:20, padding:"3px 10px" }}>{l.subKategori??kat}</span></td>
                            <td style={{ ...tdS, fontSize:12, color:"#888", whiteSpace:"nowrap" }}>{l.durasi??"–"}</td>
                            <td style={{ ...tdS, textAlign:"right", fontWeight:700, color:l.harga===0?"#aaa":G, whiteSpace:"nowrap" }}>{l.harga===0?"Dikonfirmasi":fmt(l.harga)}</td>
                            <td style={{ ...tdS, textAlign:"center" }}>
                              {!l.tersedia
                                ? <span style={{ fontSize:11, color:"#bbb", fontWeight:600 }}>Tidak Tersedia</span>
                                : ci
                                  ? <QtyControl qty={ci.qty} onInc={() => addL(l)} onDec={() => decL(l.id)} />
                                  : <AddBtn onClick={() => addL(l)} />}
                            </td>
                          </tr>
                        </>
                      );
                    });
                  })
                }
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tabel Obat ── */}
      {tab==="obat" && (
        <div style={cardBase}>
          <SectionHeader
            icon={<Pill style={{ width:15, height:15, color:G }} />}
            title="Obat & Vitamin"
            badge={<span style={{ fontSize:11, color:"#aaa", background:"#f4f4f4", borderRadius:20, padding:"2px 9px" }}>{seedObat.length} item</span>}
            right={<SearchInput value={searchObat} onChange={setSearchObat} placeholder="Cari obat atau vitamin..." />}
          />
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead><tr>
                <th style={thS}>Nama Obat</th>
                <th style={thS}>Satuan</th>
                <th style={{ ...thS, textAlign:"center" }}>Stok</th>
                <th style={{ ...thS, textAlign:"right" }}>Harga</th>
                <th style={{ ...thS, textAlign:"center", width:130 }}>Aksi</th>
              </tr></thead>
              <tbody>
                {fObat.length===0
                  ? <tr><td colSpan={5} style={{ textAlign:"center", padding:"2rem", color:"#aaa", fontSize:13 }}>Obat tidak ditemukan</td></tr>
                  : Object.entries(obatByKat).map(([kat, items]) => {
                    const cfg = KAT_OBAT[kat]??{color:"#37474f",bg:"#eceff1"};
                    return items.map((o, i) => {
                      const ci = cart.find(c => c.obat.id===o.id);
                      const st = stokStatus(o);
                      const ss = STOK_STYLE[st];
                      return (
                        <>
                          {i===0 && <tr key={`h-${kat}`}><td colSpan={5} style={{ padding:"7px 14px 4px", background:cfg.bg }}>
                            <span style={{ fontSize:11, fontWeight:700, color:cfg.color, textTransform:"uppercase", letterSpacing:".06em" }}>{kat}</span>
                          </td></tr>}
                          <tr key={o.id} style={{ background:i%2===0?"#fff":"#fafafa", opacity:st==="Habis"?0.55:1 }}>
                            <td style={tdS}>
                              <div style={{ fontWeight:700, fontSize:13 }}>💊 {o.nama}</div>
                              <div style={{ fontSize:11, color:"#888", marginTop:2 }}>{o.deskripsi}</div>
                            </td>
                            <td style={{ ...tdS, fontSize:12, color:"#888" }}>{o.satuan}</td>
                            <td style={{ ...tdS, textAlign:"center" }}>
                              <span style={{ fontSize:11, fontWeight:700, background:ss.bg, color:ss.color, borderRadius:20, padding:"3px 10px" }}>{st} ({o.stok})</span>
                            </td>
                            <td style={{ ...tdS, textAlign:"right", fontWeight:700, color:G, whiteSpace:"nowrap" }}>{fmt(o.harga)}</td>
                            <td style={{ ...tdS, textAlign:"center" }}>
                              {st==="Habis"
                                ? <span style={{ fontSize:11, color:"#bbb", fontWeight:600 }}>Stok Habis</span>
                                : ci
                                  ? <QtyControl qty={ci.qty} onInc={() => addO(o)} onDec={() => decO(o.id)} />
                                  : <AddBtn onClick={() => addO(o)} />}
                            </td>
                          </tr>
                        </>
                      );
                    });
                  })
                }
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Ringkasan Cart ── */}
      {hasItems && (
        <div style={cardBase}>
          <SectionHeader
            icon={<Receipt style={{ width:15, height:15, color:G }} />}
            title="Ringkasan Pesanan"
            badge={<span style={{ fontSize:11, color:G, background:"#e8f5e9", borderRadius:20, padding:"2px 9px", fontWeight:700 }}>{cartLayanan.length+cart.length} item</span>}
          />
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead><tr>
                <th style={thS}>Item</th>
                <th style={{ ...thS, textAlign:"center" }}>Qty</th>
                <th style={thS}>Harga Satuan</th>
                <th style={{ ...thS, textAlign:"right" }}>Subtotal</th>
                <th style={{ ...thS, width:48 }}></th>
              </tr></thead>
              <tbody>
                {cartLayanan.length>0 && (
                  <tr><td colSpan={5} style={{ padding:"7px 14px 4px", background:"#e3f2fd" }}>
                    <span style={{ fontSize:11, fontWeight:700, color:"#1565c0", textTransform:"uppercase", letterSpacing:".06em" }}>Layanan Klinik</span>
                  </td></tr>
                )}
                {cartLayanan.map((c,i) => {
                  const cfg = KAT_LAYANAN[c.layanan.kategori]??{color:G,bg:"#e8f5e9"};
                  return (
                    <tr key={c.layanan.id} style={{ background:i%2===0?"#fff":"#fafafa" }}>
                      <td style={tdS}>
                        <span style={{ marginRight:6 }}>{c.layanan.emoji}</span>
                        <span style={{ fontWeight:600 }}>{c.layanan.nama}</span>
                        <span style={{ marginLeft:7, fontSize:11, color:cfg.color, background:cfg.bg, borderRadius:20, padding:"2px 8px", fontWeight:700 }}>{c.layanan.kategori}</span>
                      </td>
                      <td style={{ ...tdS, textAlign:"center" }}>×{c.qty}</td>
                      <td style={{ ...tdS, color:"#888" }}>{c.layanan.harga===0?"Dikonfirmasi":fmt(c.layanan.harga)}</td>
                      <td style={{ ...tdS, textAlign:"right", fontWeight:700, color:G }}>{c.layanan.harga===0?"–":fmt(c.layanan.harga*c.qty)}</td>
                      <td style={{ ...tdS, textAlign:"center" }}>
                        <button onClick={() => delL(c.layanan.id)} style={{ border:"none", background:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                          <Trash2 style={{ width:14, height:14, color:"#e53935" }} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {cart.length>0 && (
                  <tr><td colSpan={5} style={{ padding:"7px 14px 4px", background:"#fce4ec" }}>
                    <span style={{ fontSize:11, fontWeight:700, color:"#c62828", textTransform:"uppercase", letterSpacing:".06em" }}>Obat & Vitamin</span>
                  </td></tr>
                )}
                {cart.map((c,i) => (
                  <tr key={c.obat.id} style={{ background:i%2===0?"#fff":"#fafafa" }}>
                    <td style={tdS}><span style={{ marginRight:6 }}>💊</span><span style={{ fontWeight:600 }}>{c.obat.nama}</span></td>
                    <td style={{ ...tdS, textAlign:"center" }}>×{c.qty}</td>
                    <td style={{ ...tdS, color:"#888" }}>{fmt(c.obat.harga)}</td>
                    <td style={{ ...tdS, textAlign:"right", fontWeight:700, color:G }}>{fmt(c.obat.harga*c.qty)}</td>
                    <td style={{ ...tdS, textAlign:"center" }}>
                      <button onClick={() => delO(c.obat.id)} style={{ border:"none", background:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
                        <Trash2 style={{ width:14, height:14, color:"#e53935" }} />
                      </button>
                    </td>
                  </tr>
                ))}
                <tr style={{ borderTop:`2px solid ${G}` }}>
                  <td colSpan={3} style={{ padding:"12px 14px", fontWeight:700, fontSize:14, textAlign:"right" }}>Grand Total</td>
                  <td style={{ padding:"12px 14px", fontWeight:800, color:G, textAlign:"right", fontSize:16 }}>{fmt(grand)}</td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Catatan ── */}
      <div style={cardBase}>
        <SectionHeader icon={<FileText style={{ width:15, height:15, color:G }} />} title="Catatan & Aturan Pakai" />
        <div style={{ padding:"14px 18px" }}>
          <textarea value={catatan} onChange={e => setCatatan(e.target.value)} rows={4}
            style={{ ...inputStyle, resize:"vertical", lineHeight:1.6 }}
            onFocus={e => e.currentTarget.style.borderColor=G}
            onBlur={e  => e.currentTarget.style.borderColor="#e0e0e0"}
          />
        </div>
      </div>

      {/* Tombol */}
      <div style={{ display:"flex", justifyContent:"space-between", paddingBottom:32 }}>
        <button onClick={onBack}
          style={{ display:"inline-flex", alignItems:"center", gap:6, padding:"10px 22px", borderRadius:9, border:`1.5px solid ${G}`, background:"#fff", color:G, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}>
          <ArrowLeft style={{ width:14, height:14 }} /> Kembali
        </button>
        <button onClick={() => setShowConfirm(true)}
          style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"10px 26px", borderRadius:9, border:"none", background:G, color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}
          onMouseEnter={e => e.currentTarget.style.background="#1b5e20"}
          onMouseLeave={e => e.currentTarget.style.background=G}
        >
          <Printer style={{ width:15, height:15 }} /> Konfirmasi Resep
        </button>
      </div>

      {/* Modal konfirmasi */}
      {showConfirm && (
        <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.45)", zIndex:500, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <div style={{ background:"#fff", borderRadius:14, padding:"28px 30px", maxWidth:420, width:"90%", boxShadow:"0 20px 60px rgba(0,0,0,.2)" }}>
            <div style={{ fontSize:34, marginBottom:10 }}>📋</div>
            <div style={{ fontWeight:800, fontSize:17, marginBottom:8 }}>Konfirmasi Resep</div>
            <div style={{ fontSize:13, color:"#555", marginBottom:20, lineHeight:1.7 }}>
              Resep untuk <strong>{hewan.nama}</strong> milik <strong>{pemilik.nama}</strong> akan disimpan.
              {hasItems && <> Total: <strong style={{ color:G }}>{fmt(grand)}</strong>.</>}
            </div>
            <div style={{ display:"flex", gap:10, justifyContent:"flex-end" }}>
              <button onClick={() => setShowConfirm(false)}
                style={{ padding:"9px 20px", borderRadius:8, border:"1.5px solid #e0e0e0", background:"#fff", color:"#555", fontSize:13, fontWeight:600, cursor:"pointer", fontFamily:"inherit" }}>
                Batal
              </button>
              <button onClick={doKonfirmasi}
                style={{ padding:"9px 20px", borderRadius:8, border:"none", background:G, color:"#fff", fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}
                onMouseEnter={e => e.currentTarget.style.background="#1b5e20"}
                onMouseLeave={e => e.currentTarget.style.background=G}
              >
                Ya, Simpan Resep
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Detail Tersimpan ───────────────────────────────────────────────────────
function DetailTersimpan({ resep, onBaru }: { resep: ResepTersimpan; onBaru(): void }) {
  const totalL = resep.cartLayanan.reduce((s,c) => s + c.layanan.harga*c.qty, 0);
  const totalO = resep.cart.reduce((s,c) => s + c.obat.harga*c.qty, 0);

  const badgeCfg: Record<string,{bg:string;color:string}> = {
    "Medis":     {bg:"#e3f2fd",color:"#1565c0"},
    "Vaksinasi": {bg:"#e0f2f1",color:"#00695c"},
    "Grooming":  {bg:"#f3e5f5",color:"#6a1b9a"},
    "Pet Hotel": {bg:"#fff3e0",color:"#e65100"},
  };

  return (
    <div style={{ maxWidth:960, margin:"0 auto" }}>
      {/* Header sukses */}
      <div style={{ background:"#fff", borderRadius:12, border:"1px solid #f0f0f0", padding:"22px 24px", marginBottom:18, display:"flex", alignItems:"center", gap:16 }}>
        <div style={{ width:52, height:52, background:G, borderRadius:14, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
          <CheckCircle2 style={{ width:28, height:28, color:"#fff" }} />
        </div>
        <div style={{ flex:1 }}>
          <div style={{ fontWeight:800, fontSize:17, color:G }}>Resep Berhasil Disimpan!</div>
          <div style={{ fontSize:13, color:"#888", marginTop:3 }}>
            <Calendar style={{ width:13, height:13, display:"inline", marginRight:4 }} />{resep.tanggal}
            <Clock style={{ width:13, height:13, display:"inline", marginLeft:12, marginRight:4 }} />{resep.waktu}
          </div>
        </div>
        <button onClick={onBaru}
          style={{ display:"inline-flex", alignItems:"center", gap:8, padding:"10px 22px", borderRadius:9, border:`1.5px solid ${G}`, background:"#fff", color:G, fontSize:13, fontWeight:700, cursor:"pointer", fontFamily:"inherit" }}
          onMouseEnter={e => { e.currentTarget.style.background=G; e.currentTarget.style.color="#fff"; }}
          onMouseLeave={e => { e.currentTarget.style.background="#fff"; e.currentTarget.style.color=G; }}
        >
          <Plus style={{ width:15, height:15 }} /> Resep Baru
        </button>
      </div>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16, marginBottom:16 }}>
        {/* Info Pemilik */}
        <div style={{ ...cardBase, marginBottom:0 }}>
          <SectionHeader icon={<User style={{ width:15, height:15, color:G }} />} title="Info Pemilik" />
          <div style={{ padding:"14px 18px", display:"flex", flexDirection:"column", gap:6 }}>
            {[
              ["Nama",    resep.pemilik.nama],
              ["No. HP",  resep.pemilik.noHP],
              ["Email",   resep.pemilik.email],
              ["Alamat",  `${resep.pemilik.alamat}, ${resep.pemilik.kota}`],
            ].map(([l,v]) => (
              <div key={l} style={{ display:"flex", gap:8, fontSize:13 }}>
                <span style={{ color:"#888", minWidth:60 }}>{l}</span>
                <span style={{ fontWeight:600 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Info Hewan */}
        <div style={{ ...cardBase, marginBottom:0 }}>
          <SectionHeader icon={<PawPrint style={{ width:15, height:15, color:G }} />} title="Info Hewan" />
          <div style={{ padding:"14px 18px" }}>
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:12 }}>
              <span style={{ fontSize:32 }}>{JENIS_EMOJI[resep.hewan.jenis]??"🐾"}</span>
              <div>
                <div style={{ fontWeight:800, fontSize:15 }}>{resep.hewan.nama}</div>
                <div style={{ fontSize:12, color:"#888" }}>{resep.hewan.ras} · {resep.hewan.jenis}</div>
              </div>
            </div>
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:6, fontSize:13 }}>
              {[["Berat",resep.hewan.berat],["Usia",resep.hewan.usia],["Kelamin",resep.hewan.kelamin],["Warna",resep.hewan.warna]].map(([l,v]) => (
                <div key={l} style={{ display:"flex", gap:6 }}>
                  <span style={{ color:"#888", minWidth:55 }}>{l}</span>
                  <span style={{ fontWeight:600 }}>{v}</span>
                </div>
              ))}
            </div>
            {resep.keluhan && (
              <div style={{ marginTop:10, padding:"8px 12px", background:"#fff3e0", borderRadius:8, fontSize:12, color:"#e65100", fontWeight:600 }}>
                ⚠️ Keluhan: {resep.keluhan}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Layanan */}
      {resep.cartLayanan.length>0 && (
        <div style={cardBase}>
          <SectionHeader icon={<Stethoscope style={{ width:15, height:15, color:G }} />} title="Layanan Klinik" />
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead><tr>
                <th style={thS}>Layanan</th>
                <th style={thS}>Kategori</th>
                <th style={{ ...thS, textAlign:"center" }}>Qty</th>
                <th style={{ ...thS, textAlign:"right" }}>Harga Satuan</th>
                <th style={{ ...thS, textAlign:"right" }}>Subtotal</th>
              </tr></thead>
              <tbody>
                {resep.cartLayanan.map((c,i) => {
                  const bc = badgeCfg[c.layanan.kategori]??{bg:"#f4f4f4",color:"#555"};
                  return (
                    <tr key={c.layanan.id} style={{ background:i%2===0?"#fff":"#fafafa" }}>
                      <td style={tdS}><span style={{ marginRight:6 }}>{c.layanan.emoji}</span><span style={{ fontWeight:600 }}>{c.layanan.nama}</span></td>
                      <td style={tdS}><span style={{ fontSize:11, fontWeight:700, color:bc.color, background:bc.bg, borderRadius:20, padding:"3px 10px" }}>{c.layanan.kategori}</span></td>
                      <td style={{ ...tdS, textAlign:"center" }}>×{c.qty}</td>
                      <td style={{ ...tdS, textAlign:"right", color:"#888" }}>{c.layanan.harga===0?"Dikonfirmasi":fmt(c.layanan.harga)}</td>
                      <td style={{ ...tdS, textAlign:"right", fontWeight:700, color:G }}>{c.layanan.harga===0?"–":fmt(c.layanan.harga*c.qty)}</td>
                    </tr>
                  );
                })}
                <tr style={{ borderTop:`2px solid ${G}` }}>
                  <td colSpan={4} style={{ ...tdS, textAlign:"right", fontWeight:700 }}>Subtotal Layanan</td>
                  <td style={{ ...tdS, textAlign:"right", fontWeight:800, color:G }}>{fmt(totalL)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Obat */}
      {resep.cart.length>0 && (
        <div style={cardBase}>
          <SectionHeader icon={<Pill style={{ width:15, height:15, color:G }} />} title="Obat & Vitamin" />
          <div style={{ overflowX:"auto" }}>
            <table style={{ width:"100%", borderCollapse:"collapse" }}>
              <thead><tr>
                <th style={thS}>Nama Obat</th>
                <th style={thS}>Satuan</th>
                <th style={{ ...thS, textAlign:"center" }}>Qty</th>
                <th style={{ ...thS, textAlign:"right" }}>Harga Satuan</th>
                <th style={{ ...thS, textAlign:"right" }}>Subtotal</th>
              </tr></thead>
              <tbody>
                {resep.cart.map((c,i) => (
                  <tr key={c.obat.id} style={{ background:i%2===0?"#fff":"#fafafa" }}>
                    <td style={tdS}><span style={{ marginRight:6 }}>💊</span><span style={{ fontWeight:600 }}>{c.obat.nama}</span></td>
                    <td style={{ ...tdS, fontSize:12, color:"#888" }}>{c.obat.satuan}</td>
                    <td style={{ ...tdS, textAlign:"center" }}>×{c.qty}</td>
                    <td style={{ ...tdS, textAlign:"right", color:"#888" }}>{fmt(c.obat.harga)}</td>
                    <td style={{ ...tdS, textAlign:"right", fontWeight:700, color:G }}>{fmt(c.obat.harga*c.qty)}</td>
                  </tr>
                ))}
                <tr style={{ borderTop:`2px solid ${G}` }}>
                  <td colSpan={4} style={{ ...tdS, textAlign:"right", fontWeight:700 }}>Subtotal Obat</td>
                  <td style={{ ...tdS, textAlign:"right", fontWeight:800, color:G }}>{fmt(totalO)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Catatan & Total */}
      <div style={{ display:"grid", gridTemplateColumns: resep.catatan ? "1fr 1fr" : "1fr", gap:16, marginBottom:32 }}>
        {resep.catatan && (
          <div style={{ ...cardBase, marginBottom:0 }}>
            <SectionHeader icon={<FileText style={{ width:15, height:15, color:G }} />} title="Catatan Dokter" />
            <div style={{ padding:"14px 18px", fontSize:13, color:"#333", lineHeight:1.7, whiteSpace:"pre-line" }}>{resep.catatan}</div>
          </div>
        )}
        <div style={{ ...cardBase, marginBottom:0 }}>
          <SectionHeader icon={<Receipt style={{ width:15, height:15, color:G }} />} title="Rincian Total Biaya" />
          <div style={{ padding:"14px 18px", display:"flex", flexDirection:"column", gap:8 }}>
            {resep.cartLayanan.length>0 && (
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:13 }}>
                <span style={{ color:"#555" }}>🩺 Biaya Layanan ({resep.cartLayanan.length} item)</span>
                <span style={{ fontWeight:600 }}>{fmt(totalL)}</span>
              </div>
            )}
            {resep.cart.length>0 && (
              <div style={{ display:"flex", justifyContent:"space-between", fontSize:13 }}>
                <span style={{ color:"#555" }}>💊 Biaya Obat ({resep.cart.length} item)</span>
                <span style={{ fontWeight:600 }}>{fmt(totalO)}</span>
              </div>
            )}
            <div style={{ borderTop:"1.5px dashed #e0e0e0", marginTop:4, paddingTop:10, display:"flex", justifyContent:"space-between" }}>
              <span style={{ fontWeight:700, fontSize:14, color:G }}>💰 Grand Total</span>
              <span style={{ fontWeight:800, fontSize:17, color:G }}>{fmt(resep.grandTotal)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Step Bar ───────────────────────────────────────────────────────────────
function StepBar({ step }: { step: 1 | 2 }) {
  return (
    <div style={{ display:"flex", alignItems:"center", marginBottom:20 }}>
      {[{ n:1, label:"Data Pasien" },{ n:2, label:"Layanan & Resep" }].map((s,i) => {
        const done = s.n < step, active = s.n === step;
        return (
          <div key={s.n} style={{ display:"flex", alignItems:"center", flex:i<1?1:"none" }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              <div style={{ width:28, height:28, borderRadius:"50%", background:done||active?G:"#e0e0e0", color:"#fff", display:"flex", alignItems:"center", justifyContent:"center", fontSize:13, fontWeight:800, flexShrink:0 }}>
                {done?<CheckCircle2 style={{ width:15, height:15 }} />:s.n}
              </div>
              <span style={{ fontSize:12, fontWeight:active?700:500, color:active?G:done?"#555":"#bbb", whiteSpace:"nowrap" }}>{s.label}</span>
            </div>
            {i<1 && <div style={{ flex:1, height:2, background:done?G:"#e0e0e0", margin:"0 10px", minWidth:40 }} />}
          </div>
        );
      })}
    </div>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function PemeriksaanPage() {
  type PatientData = { pemilik: PemilikData; hewan: HewanData; keluhan: string };
  const [step,    setStep]    = useState<1|2>(1);
  const [patient, setPatient] = useState<PatientData|null>(null);
  const [resep,   setResep]   = useState<ResepTersimpan|null>(null);

  function handleKonfirmasi(entry: Omit<ResepTersimpan,"id">) {
    setResep({ ...entry, id: Date.now() });
    setStep(1);
    setPatient(null);
  }

  function handleBaru() {
    setResep(null);
  }

  return (
    <div style={{ display:"flex", height:"100vh", overflow:"hidden", fontFamily:"'Poppins', sans-serif" }}>
      <Sidebar activePage="pemeriksaan" />
      <div style={{ flex:1, display:"flex", flexDirection:"column", overflow:"auto", background:"#f9f9f9" }}>
        <Header title="Pemeriksaan" subtitle="Input data pasien, pilih tindakan, dan buat resep" />
        <div style={{ padding:"22px 28px" }}>

          {resep ? (
            <DetailTersimpan resep={resep} onBaru={handleBaru} />
          ) : (
            <>
              <StepBar step={step} />
              {step===1 && (
                <StepPasien onNext={d => { setPatient(d); setStep(2); }} />
              )}
              {step===2 && patient && (
                <StepTindakan
                  {...patient}
                  onBack={() => setStep(1)}
                  onKonfirmasi={handleKonfirmasi}
                />
              )}
            </>
          )}

        </div>
      </div>
    </div>
  );
}