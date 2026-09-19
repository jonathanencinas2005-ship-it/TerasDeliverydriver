import { useEffect, useState } from 'react';
import { ref, onValue, query, orderByChild, equalTo } from 'firebase/database';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import StatusBadge from '../../components/ui/StatusBadge';
import { formatRupiah, formatDateTime } from '../../lib/format';
import { TOKEN_VALUE_RUPIAH } from '../../lib/regions';
import { submitTopUp } from '../../lib/tokenLedger';
import { compressImageToBase64 } from '../../lib/image';
import PageHeader from '../../components/ui/PageHeader';

export default function DriverTopUp() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [history, setHistory] = useState([]);
  const [amount, setAmount] = useState('');
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    const unsub = onValue(ref(db, `tokenBalances/${user.id}`), (snap) => setBalance(snap.val() || 0));
    const q = query(ref(db, 'topUps'), orderByChild('driverId'), equalTo(user.id));
    const unsub2 = onValue(q, (snap) => {
      const list = [];
      snap.forEach((child) => list.push({ id: child.key, ...child.val() }));
      list.sort((a, b) => b.createdAt - a.createdAt);
      setHistory(list);
    });
    return () => { unsub(); unsub2(); };
  }, [user.id]);

  const tokenAmount = Math.floor((Number(amount) || 0) / TOKEN_VALUE_RUPIAH);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!amount || Number(amount) < TOKEN_VALUE_RUPIAH) { setError('Masukkan nominal transfer minimal Rp2.000.'); return; }
    if (!file) { setError('Upload bukti transfer terlebih dahulu.'); return; }
    setBusy(true);
    try {
      const proofData = await compressImageToBase64(file);
      await submitTopUp({
        driverId: user.id, driverCode: user.driverCode, regionCode: user.regionCode,
        amount: Number(amount), tokenAmount, proofData
      });
      setDone(true);
      setAmount(''); setFile(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader title="Top Up Token" backTo="/driver" />

      <div className="card" style={{ marginBottom: 20 }}>
        <div style={{ color: 'var(--ink-soft)', fontSize: '0.85rem' }}>Saldo Sekarang</div>
        <div style={{ fontFamily: 'var(--font-display)', fontSize: '2rem', fontWeight: 800, color: balance < 0 ? 'var(--red)' : 'var(--blue-700)' }}>
          {balance} <span style={{ fontSize: '1rem', fontWeight: 600 }}>TOKEN</span>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 20, background: 'var(--blue-050)' }}>
        <div style={{ fontWeight: 700, marginBottom: 4 }}>QRIS TERAS DIGITAL UTAMA</div>
        <div style={{ color: 'var(--ink-soft)', fontSize: '0.85rem' }}>Transfer ke QRIS resmi Teras, lalu ajukan top-up di bawah dengan bukti transfer.</div>
      </div>

      {done && (
        <div className="card" style={{ marginBottom: 16, background: 'var(--green-bg)', color: 'var(--green)' }}>
          Pengajuan terkirim. Menunggu approval Korwil.
        </div>
      )}

      <form onSubmit={handleSubmit} className="card" style={{ marginBottom: 24 }}>
        <div className="field">
          <label>Nominal Transfer</label>
          <input className="input" type="number" placeholder="Contoh: 20000" value={amount} onChange={(e) => setAmount(e.target.value)} />
          {Number(amount) > 0 && (
            <div style={{ color: 'var(--blue-700)', fontWeight: 600, fontSize: '0.86rem', marginTop: 4 }}>
              Anda akan mendapatkan {tokenAmount} Token
            </div>
          )}
        </div>
        <div className="field">
          <label>Upload Bukti Transfer</label>
          <input className="input" type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} />
        </div>
        {error && <div style={{ color: 'var(--red)', marginBottom: 12 }}>{error}</div>}
        <button type="submit" className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Mengirim...' : 'Kirim Pengajuan'}</button>
      </form>

      <h3 style={{ marginBottom: 10 }}>Riwayat Pengajuan</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {history.map((t) => (
          <div key={t.id} className="card" style={{ padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600 }}>{formatRupiah(t.amount)} → +{t.tokenAmount} Token</div>
              <div style={{ color: 'var(--ink-soft)', fontSize: '0.8rem' }}>{formatDateTime(t.createdAt)}</div>
              {t.status === 'rejected' && t.rejectionReason && <div style={{ color: 'var(--red)', fontSize: '0.8rem' }}>{t.rejectionReason}</div>}
            </div>
            <StatusBadge status={t.status} />
          </div>
        ))}
        {history.length === 0 && <p style={{ color: 'var(--ink-soft)' }}>Belum ada pengajuan.</p>}
      </div>
    </div>
  );
}
