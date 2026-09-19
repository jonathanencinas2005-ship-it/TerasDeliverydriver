import { useEffect, useMemo, useState } from 'react';
import { ref, onValue, query, orderByChild, equalTo } from 'firebase/database';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { formatRupiah, formatDateTime, jakartaDateKey } from '../../lib/format';
import PageHeader from '../../components/ui/PageHeader';

function dateRangeFor(filter, customFrom, customTo) {
  const today = jakartaDateKey();
  if (filter === 'today') return [today, today];
  if (filter === 'yesterday') {
    const d = new Date(); d.setDate(d.getDate() - 1);
    const k = jakartaDateKey(d.getTime());
    return [k, k];
  }
  if (filter === 'month') {
    const [y, m] = today.split('-');
    return [`${y}-${m}-01`, today];
  }
  if (filter === 'custom') return [customFrom || today, customTo || today];
  return [today, today];
}

export default function DriverReports() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [balance, setBalance] = useState(0);
  const [filter, setFilter] = useState('today');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  useEffect(() => {
    const q = query(ref(db, 'transactions'), orderByChild('driverId'), equalTo(user.id));
    const unsub = onValue(q, (snap) => {
      const list = [];
      snap.forEach((child) => list.push({ id: child.key, ...child.val() }));
      setTransactions(list);
    });
    const unsub2 = onValue(ref(db, `tokenBalances/${user.id}`), (snap) => setBalance(snap.val() || 0));
    return () => { unsub(); unsub2(); };
  }, [user.id]);

  const [from, to] = dateRangeFor(filter, customFrom, customTo);
  const inRange = useMemo(
    () => transactions.filter((t) => {
      const k = jakartaDateKey(t.createdAt);
      return k >= from && k <= to;
    }).sort((a, b) => a.createdAt - b.createdAt),
    [transactions, from, to]
  );

  const totalOngkir = inRange.reduce((s, t) => s + t.deliveryFee, 0);
  const totalBedaToko = inRange.reduce((s, t) => s + t.multiStoreFee, 0);
  const tokenUsed = inRange.reduce((s, t) => s + t.tokenUsed, 0);

  return (
    <div>
      <PageHeader title="Laporan Saya" backTo="/driver" />

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {[['today', 'Hari Ini'], ['yesterday', 'Kemarin'], ['month', 'Bulan Ini'], ['custom', 'Rentang Tanggal']].map(([v, l]) => (
          <button key={v} className={filter === v ? 'btn btn-primary' : 'btn btn-secondary'} onClick={() => setFilter(v)}>{l}</button>
        ))}
      </div>
      {filter === 'custom' && (
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input type="date" className="input" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)} />
          <input type="date" className="input" value={customTo} onChange={(e) => setCustomTo(e.target.value)} />
        </div>
      )}

      <div className="stat-grid" style={{ marginBottom: 20 }}>
        <div className="card" style={{ padding: 14 }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--ink-soft)' }}>Order</div>
          <div style={{ fontWeight: 700, fontSize: '1.4rem' }}>{inRange.length}</div>
        </div>
        <div className="card" style={{ padding: 14 }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--ink-soft)' }}>Token Terpakai</div>
          <div style={{ fontWeight: 700, fontSize: '1.4rem' }}>{tokenUsed}</div>
        </div>
        <div className="card" style={{ padding: 14 }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--ink-soft)' }}>Saldo Token</div>
          <div style={{ fontWeight: 700, fontSize: '1.4rem', color: balance < 0 ? 'var(--red)' : 'var(--blue-700)' }}>{balance}</div>
        </div>
        <div className="card" style={{ padding: 14 }}>
          <div style={{ fontSize: '0.8rem', color: 'var(--ink-soft)' }}>Total Ongkir</div>
          <div style={{ fontWeight: 700, fontSize: '1.1rem' }}>{formatRupiah(totalOngkir)}</div>
        </div>
      </div>

      <div className="card" style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.86rem' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--line)' }}>
              <th style={{ padding: 8 }}>No</th>
              <th style={{ padding: 8 }}>Wilayah</th>
              <th style={{ padding: 8 }}>Token</th>
              <th style={{ padding: 8 }}>Waktu</th>
            </tr>
          </thead>
          <tbody>
            {inRange.map((t, i) => (
              <tr key={t.id} style={{ borderBottom: '1px solid var(--line)' }}>
                <td style={{ padding: 8 }}>{String(i + 1).padStart(3, '0')}</td>
                <td style={{ padding: 8 }}>{t.deliveryRegion?.name}</td>
                <td style={{ padding: 8 }}>-{t.tokenUsed}</td>
                <td style={{ padding: 8 }}>{formatDateTime(t.createdAt)}</td>
              </tr>
            ))}
            {inRange.length === 0 && <tr><td colSpan={4} style={{ padding: 12, color: 'var(--ink-soft)' }}>Tidak ada data.</td></tr>}
          </tbody>
        </table>
      </div>
      <p style={{ marginTop: 12, fontWeight: 600 }}>Total Beda Toko: {formatRupiah(totalBedaToko)}</p>
    </div>
  );
}
