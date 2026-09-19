import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { onValue, ref } from 'firebase/database';
import { db } from '../../firebase';
import { CheckCircle2, X } from 'lucide-react';
import RegionPicker from '../../components/ui/RegionPicker';
import { DEFAULT_DELIVERY_ZONES, MULTI_STORE_FEE } from '../../lib/regions';
import { formatRupiah } from '../../lib/format';
import { createOrder } from '../../lib/tokenLedger';
import ReceiptModal from '../../components/ui/ReceiptModal';
import PageHeader from '../../components/ui/PageHeader';

function emptyStore() {
  return { name: '', items: [{ name: '', price: '', qty: 1 }] };
}

export default function DriverNewOrder() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [customer, setCustomer] = useState({ name: '', phone: '', address: '', note: '' });
  const [stores, setStores] = useState([emptyStore()]);
  const [region, setRegion] = useState(null);
  const [parking, setParking] = useState('');
  const [extraZones, setExtraZones] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [showReceipt, setShowReceipt] = useState(false);

  useEffect(() => {
    const unsub = onValue(ref(db, `regions/${user.regionCode}/deliveryZones`), (snap) => {
      const val = snap.val() || {};
      setExtraZones(Object.values(val));
    });
    return () => unsub();
  }, [user.regionCode]);

  const allZones = [...DEFAULT_DELIVERY_ZONES, ...extraZones];

  function updateStore(i, patch) {
    setStores((s) => s.map((st, idx) => (idx === i ? { ...st, ...patch } : st)));
  }
  function updateItem(storeIdx, itemIdx, patch) {
    setStores((s) => s.map((st, idx) => {
      if (idx !== storeIdx) return st;
      return { ...st, items: st.items.map((it, j) => (j === itemIdx ? { ...it, ...patch } : it)) };
    }));
  }
  function addStore() { setStores((s) => [...s, emptyStore()]); }
  function removeStore(i) { setStores((s) => s.filter((_, idx) => idx !== i)); }
  function addItem(storeIdx) {
    setStores((s) => s.map((st, idx) => idx === storeIdx ? { ...st, items: [...st.items, { name: '', price: '', qty: 1 }] } : st));
  }
  function removeItem(storeIdx, itemIdx) {
    setStores((s) => s.map((st, idx) => idx === storeIdx ? { ...st, items: st.items.filter((_, j) => j !== itemIdx) } : st));
  }

  const goodsTotal = stores.reduce((sum, s) => sum + s.items.reduce((si, it) => si + (Number(it.price) || 0) * (Number(it.qty) || 0), 0), 0);
  const multiStoreFee = stores.length > 1 ? MULTI_STORE_FEE : 0;
  const total = goodsTotal + (region?.fee || 0) + multiStoreFee + (Number(parking) || 0);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!region) { setError('Pilih wilayah pengantaran terlebih dahulu.'); return; }
    const cleanStores = stores
      .filter((s) => s.name.trim())
      .map((s) => ({
        name: s.name.trim(),
        items: s.items.filter((it) => it.name.trim() && Number(it.price) > 0)
          .map((it) => ({ name: it.name.trim(), price: Number(it.price), qty: Number(it.qty) || 1 }))
      }))
      .filter((s) => s.items.length > 0);
    if (cleanStores.length === 0) { setError('Tambahkan minimal satu toko dan satu item.'); return; }

    setBusy(true);
    try {
      const record = await createOrder({
        regionCode: user.regionCode,
        driverId: user.id,
        driverCode: user.driverCode,
        customer,
        stores: cleanStores,
        deliveryRegion: { name: region.name, fee: region.fee },
        deliveryFee: region.fee,
        parking: Number(parking) || 0
      });
      setResult(record);
      setShowReceipt(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  if (result) {
    return (
      <div>
        <div className="card" style={{ padding: 24, textAlign: 'center', marginBottom: 16 }}>
          <CheckCircle2 size={40} color="var(--success)" />
          <h2 style={{ margin: '8px 0 4px' }}>Pesanan Tersimpan</h2>
          <p style={{ color: 'var(--ink-soft)' }}>{result.transactionNumber}</p>
          <p style={{ fontWeight: 700 }}>Saldo token sekarang: {result.balanceAfter}</p>
        </div>
        {showReceipt && <ReceiptModal transaction={result} onClose={() => setShowReceipt(false)} />}
        <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
          <button className="btn btn-secondary btn-block" onClick={() => setShowReceipt(true)}>Lihat Struk</button>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary btn-block" onClick={() => { setResult(null); setStores([emptyStore()]); setRegion(null); setParking(''); setCustomer({ name: '', phone: '', address: '', note: '' }); }}>
            Pesanan Baru Lagi
          </button>
          <button className="btn btn-secondary btn-block" onClick={() => navigate('/driver')}>Ke Dashboard</button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <PageHeader title="Pesanan Baru" backTo="/driver" />

      <h3 style={{ fontSize: '1rem', marginBottom: 10 }}>Data Pelanggan</h3>
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="field"><label>Nama</label><input className="input" value={customer.name} onChange={(e) => setCustomer({ ...customer, name: e.target.value })} /></div>
        <div className="field"><label>Nomor HP</label><input className="input" value={customer.phone} onChange={(e) => setCustomer({ ...customer, phone: e.target.value })} /></div>
        <div className="field"><label>Alamat</label><input className="input" value={customer.address} onChange={(e) => setCustomer({ ...customer, address: e.target.value })} /></div>
        <div className="field" style={{ marginBottom: 0 }}><label>Catatan</label><input className="input" value={customer.note} onChange={(e) => setCustomer({ ...customer, note: e.target.value })} /></div>
      </div>

      <h3 style={{ fontSize: '1rem', marginBottom: 10 }}>Toko & Barang</h3>
      {stores.map((store, si) => (
        <div key={si} className="card" style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <input className="input" placeholder={`Nama Toko ${si + 1}`} value={store.name} onChange={(e) => updateStore(si, { name: e.target.value })} />
            {stores.length > 1 && <button type="button" className="btn btn-danger" onClick={() => removeStore(si)}>Hapus</button>}
          </div>
          {store.items.map((it, ii) => (
            <div key={ii} style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              <input className="input" style={{ flex: 2 }} placeholder="Nama barang" value={it.name} onChange={(e) => updateItem(si, ii, { name: e.target.value })} />
              <input className="input" style={{ flex: 1 }} type="number" placeholder="Harga" value={it.price} onChange={(e) => updateItem(si, ii, { price: e.target.value })} />
              <input className="input" style={{ width: 56 }} type="number" placeholder="Qty" value={it.qty} onChange={(e) => updateItem(si, ii, { qty: e.target.value })} />
              {store.items.length > 1 && <button type="button" className="btn btn-ghost" onClick={() => removeItem(si, ii)}><X size={16} /></button>}
            </div>
          ))}
          <button type="button" className="btn btn-secondary" onClick={() => addItem(si)}>+ Tambah Item</button>
        </div>
      ))}
      <button type="button" className="btn btn-secondary btn-block" style={{ marginBottom: 20 }} onClick={addStore}>+ Tambah Toko</button>

      <RegionPicker zones={allZones} value={region} onChange={setRegion} />

      <div className="field">
        <label>Parkir (manual, opsional)</label>
        <input className="input" type="number" placeholder="0" value={parking} onChange={(e) => setParking(e.target.value)} />
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span>Total Barang</span><span>{formatRupiah(goodsTotal)}</span></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span>Ongkir</span><span>{formatRupiah(region?.fee || 0)}</span></div>
        {multiStoreFee > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span>Beda Toko</span><span>{formatRupiah(multiStoreFee)}</span></div>}
        {Number(parking) > 0 && <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}><span>Parkir</span><span>{formatRupiah(parking)}</span></div>}
        <div style={{ borderTop: '1px solid var(--line)', margin: '8px 0' }} />
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: '1.1rem' }}><span>TOTAL</span><span>{formatRupiah(total)}</span></div>
        <div style={{ color: 'var(--ink-soft)', fontSize: '0.8rem', marginTop: 6 }}>Pesanan ini akan memakai 1 token.</div>
      </div>

      {error && <div style={{ color: 'var(--red)', marginBottom: 12 }}>{error}</div>}
      <button type="submit" className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Menyimpan...' : 'Simpan Pesanan'}</button>
    </form>
  );
}
