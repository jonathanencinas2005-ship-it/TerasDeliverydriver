import { useEffect, useState } from 'react';
import { ref, onValue, query, orderByChild, equalTo } from 'firebase/database';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { formatRupiah, formatDateTime } from '../../lib/format';
import ReceiptModal from '../../components/ui/ReceiptModal';
import PageHeader from '../../components/ui/PageHeader';

export default function DriverHistory({ title = 'Riwayat Pesanan' }) {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const q = query(ref(db, 'transactions'), orderByChild('driverId'), equalTo(user.id));
    const unsub = onValue(q, (snap) => {
      const list = [];
      snap.forEach((child) => list.push({ id: child.key, ...child.val() }));
      list.sort((a, b) => b.createdAt - a.createdAt);
      setTransactions(list);
    });
    return () => unsub();
  }, [user.id]);

  return (
    <div>
      <PageHeader title={title} backTo="/driver" />
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {transactions.map((t) => (
          <button key={t.id} onClick={() => setSelected(t)} className="card" style={{ padding: 14, textAlign: 'left', display: 'flex', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontWeight: 700 }}>{t.transactionNumber}</div>
              <div style={{ color: 'var(--ink-soft)', fontSize: '0.82rem' }}>{t.deliveryRegion?.name}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: 700 }}>{formatRupiah(t.total)}</div>
              <div style={{ color: 'var(--ink-soft)', fontSize: '0.78rem' }}>{formatDateTime(t.createdAt)}</div>
            </div>
          </button>
        ))}
        {transactions.length === 0 && <p style={{ color: 'var(--ink-soft)' }}>Belum ada pesanan.</p>}
      </div>
      {selected && <ReceiptModal transaction={selected} onClose={() => setSelected(null)} />}
    </div>
  );
}
