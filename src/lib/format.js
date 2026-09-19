export function formatRupiah(n) {
  const v = Number(n) || 0;
  return 'Rp' + v.toLocaleString('id-ID');
}

export function formatToken(n) {
  const v = Number(n) || 0;
  return (v > 0 ? '+' : '') + v.toLocaleString('id-ID');
}

// createdAt disimpan sebagai epoch ms (server-safe, stabil terhadap timezone).
// Ditampilkan memakai timezone Asia/Jakarta agar konsisten di semua device.
export function formatDateTime(epochMs) {
  return new Date(epochMs).toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: '2-digit', month: '2-digit', year: '2-digit',
    hour: '2-digit', minute: '2-digit'
  });
}

export function formatDateOnly(epochMs) {
  return new Date(epochMs).toLocaleDateString('id-ID', {
    timeZone: 'Asia/Jakarta', day: '2-digit', month: '2-digit', year: '2-digit'
  });
}

// Kunci tanggal "YYYY-MM-DD" di zona Asia/Jakarta, dipakai untuk grouping
// laporan dan untuk reset urutan nomor transaksi per hari.
export function jakartaDateKey(epochMs = Date.now()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Jakarta', year: 'numeric', month: '2-digit', day: '2-digit'
  }).formatToParts(epochMs);
  const get = (t) => parts.find((p) => p.type === t).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function jakartaDateShort(epochMs = Date.now()) {
  // dd/MM/yy dipakai di nomor transaksi, mis. 17/09/26
  const [y, m, d] = jakartaDateKey(epochMs).split('-');
  return `${d}/${m}/${y.slice(2)}`;
}
