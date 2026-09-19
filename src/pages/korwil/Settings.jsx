import { useEffect, useState } from 'react';
import { ref, onValue, set, get, push, remove } from 'firebase/database';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { DEFAULT_DELIVERY_ZONES } from '../../lib/regions';
import PageHeader from '../../components/ui/PageHeader';

export default function KorwilSettings() {
  const { user } = useAuth();
  const [receipt, setReceipt] = useState({ businessName: 'TERAS DELIVERY', address: '', phone: '', footer: '', paperSize: '58' });
  const [customZones, setCustomZones] = useState({});
  const [zoneName, setZoneName] = useState('');
  const [zoneFee, setZoneFee] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const unsub = onValue(ref(db, `regions/${user.regionCode}/receiptSettings`), (snap) => {
      if (snap.exists()) setReceipt((r) => ({ ...r, ...snap.val() }));
    });
    const unsub2 = onValue(ref(db, `regions/${user.regionCode}/deliveryZones`), (snap) => {
      setCustomZones(snap.val() || {});
    });
    return () => { unsub(); unsub2(); };
  }, [user.regionCode]);

  async function saveReceipt(e) {
    e.preventDefault();
    await set(ref(db, `regions/${user.regionCode}/receiptSettings`), receipt);
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  async function addZone(e) {
    e.preventDefault();
    if (!zoneName.trim() || !zoneFee) return;
    await push(ref(db, `regions/${user.regionCode}/deliveryZones`), { name: zoneName.trim(), fee: Number(zoneFee) });
    setZoneName(''); setZoneFee('');
  }

  async function removeZone(key) {
    await remove(ref(db, `regions/${user.regionCode}/deliveryZones/${key}`));
  }

  async function exportData() {
    const snap = await get(ref(db));
    const blob = new Blob([JSON.stringify(snap.val(), null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `teras-delivery-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function importData(e) {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const data = JSON.parse(reader.result);
      if (!confirm('Import akan MENIMPA seluruh data di database ini. Lanjutkan?')) return;
      await set(ref(db), data);
      alert('Import selesai.');
    };
    reader.readAsText(file);
  }

  return (
    <div>
      <PageHeader title="Pengaturan" backTo="/korwil" />

      <h3 style={{ marginBottom: 10 }}>Custom Struk</h3>
      <form onSubmit={saveReceipt} className="card" style={{ marginBottom: 24 }}>
        <div className="field"><label>Nama Bisnis</label>
          <input className="input" value={receipt.businessName} onChange={(e) => setReceipt({ ...receipt, businessName: e.target.value })} />
        </div>
        <div className="field"><label>Alamat</label>
          <input className="input" value={receipt.address} onChange={(e) => setReceipt({ ...receipt, address: e.target.value })} />
        </div>
        <div className="field"><label>Nomor Telepon</label>
          <input className="input" value={receipt.phone} onChange={(e) => setReceipt({ ...receipt, phone: e.target.value })} />
        </div>
        <div className="field"><label>Footer Struk</label>
          <input className="input" value={receipt.footer} onChange={(e) => setReceipt({ ...receipt, footer: e.target.value })} />
        </div>
        <div className="field"><label>Ukuran Kertas</label>
          <select className="input" value={receipt.paperSize} onChange={(e) => setReceipt({ ...receipt, paperSize: e.target.value })}>
            <option value="58">58mm</option>
            <option value="80">80mm</option>
          </select>
        </div>
        <button className="btn btn-primary" type="submit">{saved ? 'Tersimpan!' : 'Simpan Pengaturan Struk'}</button>
      </form>

      <h3 style={{ marginBottom: 10 }}>Wilayah Tambahan</h3>
      <form onSubmit={addZone} className="card" style={{ marginBottom: 14, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <input className="input" style={{ flex: 2 }} placeholder="Nama wilayah" value={zoneName} onChange={(e) => setZoneName(e.target.value)} />
        <input className="input" style={{ flex: 1 }} type="number" placeholder="Ongkir" value={zoneFee} onChange={(e) => setZoneFee(e.target.value)} />
        <button className="btn btn-primary" type="submit">+ Tambah</button>
      </form>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 24 }}>
        {Object.entries(customZones).map(([key, z]) => (
          <div key={key} className="card" style={{ padding: 10, display: 'flex', justifyContent: 'space-between' }}>
            <span>{z.name} — Rp{z.fee.toLocaleString('id-ID')}</span>
            <button className="btn btn-ghost" onClick={() => removeZone(key)}>Hapus</button>
          </div>
        ))}
        <p style={{ color: 'var(--ink-soft)', fontSize: '0.8rem', marginTop: 4 }}>
          {DEFAULT_DELIVERY_ZONES.length} wilayah bawaan selalu tersedia di form pesanan, tanpa perlu ditambah di sini.
        </p>
      </div>

      <h3 style={{ marginBottom: 10 }}>Backup Data</h3>
      <div className="card" style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <button className="btn btn-secondary" onClick={exportData}>Export Data (JSON)</button>
        <label className="btn btn-secondary" style={{ cursor: 'pointer' }}>
          Import Data (JSON)
          <input type="file" accept="application/json" onChange={importData} style={{ display: 'none' }} />
        </label>
      </div>
    </div>
  );
}
