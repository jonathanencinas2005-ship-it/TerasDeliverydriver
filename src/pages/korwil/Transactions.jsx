import { useEffect, useState } from 'react';
import { ref, onValue, query, orderByChild, equalTo } from 'firebase/database';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { formatRupiah, formatDateTime } from '../../lib/format';
import ReceiptModal from '../../components/ui/ReceiptModal';
import PageHeader from '../../components/ui/PageHeader';

export default function KorwilTransactions() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [drivers, setDrivers] = useState({});
  const [driverFilter, setDriverFilter] = useState('all');
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const q = query(ref(db, 'transactions'), orderByChild('regionCode'), equalTo(user.regionCode));
    const unsub = onValue(q, (snap) => {
      const list = [];
      snap.forEach((child) => list.push({ id: child.key, ...child.val() }));
      list.sort((a, b) => b.createdAt - a.createdAt);
      setTransactions(list);
    });
    const unsub2 = onValue(ref(db, 'users'), (snap) => setDrivers(snap.val() || {}));
    return () => { unsub(); unsub2(); };
  }, [user.regionCode]);

  const driverList = Object.entries(drivers).filter(([, v]) => v.role === 'driver' && v.regionCode === user.regionCode);
  const filtered = driverFilter === 'all' ? transactions : transactions.filter((t) => t.driverId === driverFilter);

  return (
    <div>
      <PageHeader title="Transaksi" backTo="/korwil" />

      <select className="input" style={{ marginBottom: 16 }} value={driverFilter} onChange={(e) => setDriverFilter(e.target.value)}>
        <option value="all">Semua Driver</option>
        {driverList.map(([id, d]) => <option key={id} value={id}>{d.name}</option>)}
      </select>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {filtered.map((t) => (
          <button key={t.id} onClick={() => setSelected(t)} className="card" style={{ padding: 14, textAlign: 'left', display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 700 }}>{drivers[t.driverId]?.name || t.driverId}</div>
              <div style={{ color: 'var(--ink-soft)', fontSize: '0.82rem' }}>{t.transactionNumber}</div>
              <div style={{ color: 'var(--ink-soft)', fontSize: '0.82rem' }}>{t.deliveryRegion?.name}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 700 }}>{formatRupiah(t.total)}</div>
              <div style={{ color: 'var(--ink-soft)', fontSize: '0.78rem' }}>{formatDateTime(t.createdAt)}</div>
            </div>
          </button>
        ))}
        {filtered.length === 0 && <p style={{ color: 'var(--ink-soft)' }}>Tidak ada transaksi.</p>}
      </div>

      {selected && <ReceiptModal transaction={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
