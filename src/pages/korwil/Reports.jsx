import { useEffect, useMemo, useState } from 'react';
import { ref, onValue, query, orderByChild, equalTo } from 'firebase/database';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import { formatRupiah, jakartaDateKey } from '../../lib/format';
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

export default function KorwilReports() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [drivers, setDrivers] = useState({});
  const [filter, setFilter] = useState('today');
  const [customFrom, setCustomFrom] = useState('');
  const [customTo, setCustomTo] = useState('');

  useEffect(() => {
    const q = query(ref(db, 'transactions'), orderByChild('regionCode'), equalTo(user.regionCode));
    const unsub = onValue(q, (snap) => {
      const list = [];
      snap.forEach((child) => list.push({ id: child.key, ...child.val() }));
      setTransactions(list);
    });
    const unsub2 = onValue(ref(db, 'users'), (snap) => setDrivers(snap.val() || {}));
    return () => { unsub(); unsub2(); };
  }, [user.regionCode]);

  const [from, to] = dateRangeFor(filter, customFrom, customTo);
  const inRange = useMemo(
    () => transactions.filter((t) => {
      const k = jakartaDateKey(t.createdAt);
      return k >= from && k <= to;
    }),
    [transactions, from, to]
  );

  const perDriver = useMemo(() => {
    const map = {};
    inRange.forEach((t) => {
      if (!map[t.driverId]) map[t.driverId] = { orders: 0, tokenUsed: 0, ongkir: 0, bedaToko: 0 };
      map[t.driverId].orders += 1;
      map[t.driverId].tokenUsed += t.tokenUsed;
      map[t.driverId].ongkir += t.deliveryFee;
      map[t.driverId].bedaToko += t.multiStoreFee;
    });
    return map;
  }, [inRange]);

  async function exportPdf() {
    const { default: jsPDF } = await import('jspdf');
    await import('jspdf-autotable');
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text(`Laporan Teras Delivery — ${user.regionCode}`, 14, 16);
    doc.setFontSize(10);
    doc.text(`Periode: ${from} s/d ${to}`, 14, 23);
    const rows = Object.entries(perDriver).map(([id, v]) => [
      drivers[id]?.name || id, id, v.orders, v.tokenUsed, formatRupiah(v.ongkir), formatRupiah(v.bedaToko)
    ]);
    doc.autoTable({
      startY: 30,
      head: [['Driver', 'ID', 'Order', 'Token Terpakai', 'Total Ongkir', 'Total Beda Toko']],
      body: rows
    });
    doc.save(`Laporan_Teras_Delivery_${from}_${to}.pdf`);
  }

  return (
    <div>
      <PageHeader title="Laporan Wilayah" backTo="/korwil" />

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

      <div className="card" style={{ overflowX: 'auto', marginBottom: 16 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.88rem' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '2px solid var(--line)' }}>
              <th style={{ padding: 8 }}>Driver</th>
              <th style={{ padding: 8 }}>Order</th>
              <th style={{ padding: 8 }}>Token Terpakai</th>
              <th style={{ padding: 8 }}>Total Ongkir</th>
              <th style={{ padding: 8 }}>Total Beda Toko</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(perDriver).map(([id, v]) => (
              <tr key={id} style={{ borderBottom: '1px solid var(--line)' }}>
                <td style={{ padding: 8 }}>{drivers[id]?.name || id}</td>
                <td style={{ padding: 8 }}>{v.orders}</td>
                <td style={{ padding: 8 }}>{v.tokenUsed}</td>
                <td style={{ padding: 8 }}>{formatRupiah(v.ongkir)}</td>
                <td style={{ padding: 8 }}>{formatRupiah(v.bedaToko)}</td>
              </tr>
            ))}
            {Object.keys(perDriver).length === 0 && (
              <tr><td colSpan={5} style={{ padding: 12, color: 'var(--ink-soft)' }}>Tidak ada data pada periode ini.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <button className="btn btn-primary" onClick={exportPdf}>Unduh PDF</button>
    </div>
  );
}
