import { useEffect, useState } from 'react';
import { ref, onValue, query, orderByChild, equalTo } from 'firebase/database';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import StatusBadge from '../../components/ui/StatusBadge';
import { formatRupiah, formatDateTime } from '../../lib/format';
import { approveTopUp, rejectTopUp } from '../../lib/tokenLedger';
import PageHeader from '../../components/ui/PageHeader';

export default function KorwilTopUpApproval() {
  const { user } = useAuth();
  const [topUps, setTopUps] = useState([]);
  const [drivers, setDrivers] = useState({});
  const [busyId, setBusyId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [reason, setReason] = useState('');

  useEffect(() => {
    const q = query(ref(db, 'topUps'), orderByChild('regionCode'), equalTo(user.regionCode));
    const unsub = onValue(q, (snap) => {
      const list = [];
      snap.forEach((child) => list.push({ id: child.key, ...child.val() }));
      list.sort((a, b) => b.createdAt - a.createdAt);
      setTopUps(list);
    });
    const unsub2 = onValue(ref(db, 'users'), (snap) => setDrivers(snap.val() || {}));
    return () => { unsub(); unsub2(); };
  }, [user.regionCode]);

  async function handleApprove(id) {
    setBusyId(id);
    try {
      await approveTopUp({ topUpId: id, approvedByUserId: user.id });
    } finally {
      setBusyId(null);
    }
  }

  async function handleReject(id) {
    setBusyId(id);
    try {
      await rejectTopUp({ topUpId: id, approvedByUserId: user.id, reason });
      setRejectingId(null);
      setReason('');
    } finally {
      setBusyId(null);
    }
  }

  const pending = topUps.filter((t) => t.status === 'pending');
  const history = topUps.filter((t) => t.status !== 'pending');

  return (
    <div>
      <PageHeader title="Top Up / Approval" backTo="/korwil" />

      <h3 style={{ marginBottom: 10 }}>Menunggu Approval ({pending.length})</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
        {pending.map((t) => (
          <div key={t.id} className="card" style={{ padding: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontWeight: 700 }}>{drivers[t.driverId]?.name || t.driverId}</div>
                <div style={{ color: 'var(--ink-soft)', fontSize: '0.85rem' }}>{t.driverId}</div>
              </div>
              <StatusBadge status="pending" />
            </div>
            <div style={{ marginTop: 10, display: 'flex', gap: 20 }}>
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--ink-soft)' }}>Nominal</div>
                <div style={{ fontWeight: 700 }}>{formatRupiah(t.amount)}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--ink-soft)' }}>Token</div>
                <div style={{ fontWeight: 700, color: 'var(--blue-700)' }}>+{t.tokenAmount}</div>
              </div>
              <div>
                <div style={{ fontSize: '0.78rem', color: 'var(--ink-soft)' }}>Tanggal</div>
                <div>{formatDateTime(t.createdAt)}</div>
              </div>
            </div>
            {t.proofData && (
              <div style={{ marginTop: 10 }}>
                <img src={t.proofData} alt="Bukti transfer" style={{ maxWidth: '100%', borderRadius: 'var(--radius-sm)', border: '1px solid var(--line)' }} />
              </div>
            )}

            {rejectingId === t.id ? (
              <div style={{ marginTop: 12 }}>
                <input className="input" placeholder="Alasan penolakan" value={reason} onChange={(e) => setReason(e.target.value)} />
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button className="btn btn-danger" disabled={busyId === t.id} onClick={() => handleReject(t.id)}>Kirim Penolakan</button>
                  <button className="btn btn-ghost" onClick={() => setRejectingId(null)}>Batal</button>
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                <button className="btn btn-primary" disabled={busyId === t.id} onClick={() => handleApprove(t.id)}>
                  {busyId === t.id ? 'Memproses...' : 'Approve'}
                </button>
                <button className="btn btn-danger" disabled={busyId === t.id} onClick={() => setRejectingId(t.id)}>Tolak</button>
              </div>
            )}
          </div>
        ))}
        {pending.length === 0 && <p style={{ color: 'var(--ink-soft)' }}>Tidak ada pengajuan menunggu.</p>}
      </div>

      <h3 style={{ marginBottom: 10 }}>Riwayat</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {history.map((t) => (
          <div key={t.id} className="card" style={{ padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ fontWeight: 600 }}>{drivers[t.driverId]?.name || t.driverId}</div>
              <div style={{ color: 'var(--ink-soft)', fontSize: '0.8rem' }}>{formatRupiah(t.amount)} · {formatDateTime(t.createdAt)}</div>
              {t.status === 'rejected' && t.rejectionReason && (
                <div style={{ color: 'var(--red)', fontSize: '0.8rem', marginTop: 2 }}>{t.rejectionReason}</div>
              )}
            </div>
            <StatusBadge status={t.status} />
          </div>
        ))}
        {history.length === 0 && <p style={{ color: 'var(--ink-soft)' }}>Belum ada riwayat.</p>}
      </div>
    </div>
  );
}
