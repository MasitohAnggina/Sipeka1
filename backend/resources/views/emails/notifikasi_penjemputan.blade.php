<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
    .card { background: #fff; border-radius: 12px; padding: 32px; max-width: 520px; margin: 0 auto; box-shadow: 0 2px 8px rgba(0,0,0,0.08); }
    .header { text-align: center; margin-bottom: 24px; }
    .header h1 { color: #2e7d32; font-size: 22px; margin: 0; }
    .info-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #f0f0f0; font-size: 14px; }
    .label { color: #888; }
    .value { color: #333; font-weight: 600; }
    .highlight { background: #e8f5e9; border-radius: 8px; padding: 16px; margin: 20px 0; text-align: center; }
    .highlight .date { font-size: 20px; color: #2e7d32; font-weight: bold; }
    .footer { text-align: center; margin-top: 24px; font-size: 12px; color: #aaa; }
  </style>
</head>
<body>
  <div class="card">
    <div class="header">
      <div style="font-size:40px">🐾</div>
      <h1>Klinik Hewan</h1>
      <p style="color:#888;font-size:13px;margin:4px 0 0">Pemberitahuan Penjemputan</p>
    </div>

    <p style="font-size:14px;color:#333">Yth. <strong>{{ $booking->user?->nama ?? $booking->user?->name ?? 'Pemilik' }}</strong>,</p>
    <p style="font-size:14px;color:#555">
      Masa penitipan hewan peliharaan Anda di klinik kami telah selesai.
      Mohon segera melakukan penjemputan sesuai informasi berikut:
    </p>

    <div class="info-row">
      <span class="label">Nama Hewan</span>
      <span class="value">{{ $booking->hewan?->nama_hewan ?? '-' }}</span>
    </div>
    <div class="info-row">
      <span class="label">Jenis / Ras</span>
      <span class="value">{{ $booking->hewan?->jenis ?? '-' }} · {{ $booking->hewan?->ras ?? '-' }}</span>
    </div>
    <div class="info-row">
      <span class="label">No. Booking</span>
      <span class="value">{{ $booking->no_booking }}</span>
    </div>
    <div class="info-row">
      <span class="label">Tanggal Masuk</span>
      <span class="value">{{ $booking->tanggal_booking?->format('d M Y') ?? '-' }}</span>
    </div>

    <div class="highlight">
      <div style="font-size:13px;color:#555;margin-bottom:4px">Batas Penjemputan</div>
      <div class="date">{{ $booking->tanggal_selesai?->format('d M Y') ?? 'Hari ini' }}</div>
    </div>

    <p style="font-size:13px;color:#888;text-align:center">
      Jika ada pertanyaan, hubungi kami langsung di klinik.<br>
      Terima kasih telah mempercayakan perawatan hewan Anda kepada kami. 🐶🐱
    </p>

    <div class="footer">
      Email ini dikirim otomatis oleh sistem Klinik Hewan.<br>
      Mohon tidak membalas email ini.
    </div>
  </div>
</body>
</html>