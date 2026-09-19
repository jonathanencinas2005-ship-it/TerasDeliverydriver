import { useEffect, useState } from 'react';
import { ref, onValue, query, orderByChild, equalTo } from 'firebase/database';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import StatCard from '../../components/ui/StatCard';
import { formatDateTime, formatToken, jakartaDateKey } from '../../lib/format';
import { Link } from 'react-router-dom';
import { Users, Package, Coins, Calculator, CreditCard } from 'lucide-react';

export default function KorwilDashboard() {
  const { user } = useAuth();
  const [drivers, setDrivers] = useState([]);
  const [balances, setBalances] = useState({});
  const [transactions, setTransactions] = useState([]);
  const [pendingTopUps, setPendingTopUps] = useState(0);

  useEffect(() => {
    const driversQuery = query(ref(db, 'users'), orderByChild('regionCode'), equalTo(user.regionCode));
    const unsub1 = onValue(driversQuery, (snap) => {
      const list = [];
      snap.forEach((child) => {
        const v = child.val();
        if (v.role === 'driver') list.push({ id: child.key, ...v });
      });
      setDrivers(list);
    });

    const unsub2 = onValue(ref(db, 'tokenBalances'), (snap) => {
      setBalances(snap.val() || {});
    });

    const txQuery = query(ref(db, 'transactions'), orderByChild('regionCode'), equalTo(user.regionCode));
    const unsub3 = onValue(txQuery, (snap) => {
      const list = [];
      snap.forEach((child) => list.push({ id: child.key, ...child.val() }));
      list.sort((a, b) => b.createdAt - a.createdAt);
      setTransactions(list);
    });

    const topUpQuery = query(ref(db, 'topUps'), orderByChild('regionCode'), equalTo(user.regionCode));
    const unsub4 = onValue(topUpQuery, (snap) => {
      let count = 0;
      snap.forEach((child) => { if (child.val().status === 'pending') count++; });
      setPendingTopUps(count);
    });

    return () => { unsub1(); unsub2(); unsub3(); unsub4(); };
  }, [user.regionCode]);

  const todayKey = jakartaDateKey();
  const activeDrivers = drivers.filter((d) => d.active !== false);
  const ordersToday = transactions.filter((t) => jakartaDateKey(t.createdAt) === todayKey).length;

  return (
    <div>
      <h2 style={{ marginBottom: 4 }}>Dashboard Korwil</h2>
      <p style={{ color: 'var(--ink-soft)', marginTop: 0, marginBottom: 20 }}>Kelola wilayah dan pantau semua driver.</p>

      <div className="stat-grid" style={{ marginBottom: 24 }}>
        <StatCard label="Driver Aktif" value={activeDrivers.length} icon={Users} />
        <StatCard label="Order Hari Ini" value={ordersToday} tone="brand" icon={Package} />
        <StatCard label="Pengajuan Top Up" value={pendingTopUps} tone={pendingTopUps > 0 ? 'bad' : 'default'} icon={Coins} />
        <StatCard label="Total Token Driver" value={Object.values(balances).reduce((a, b) => a + (b || 0), 0)} icon={Calculator} />
      </div>

      <Link to="/korwil/topup" className="card" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24, textDecoration: 'none' }}>
        <div className="icon-circle"><CreditCard size={18} /></div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 13 }}>Pengajuan Top Up</div>
          <div style={{ color: 'var(--text-secondary)', fontSize: 11 }}>
            {pendingTopUps > 0 ? `${pendingTopUps} menunggu approval` : 'Tidak ada yang menunggu'}
          </div>
        </div>
        {pendingTopUps > 0 && <span className="badge badge-pending">{pendingTopUps}</span>}
      </Link>

      <h3 style={{ marginBottom: 12 }}>Driver Aktif</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
        {drivers.map((d) => (
          <div key={d.id} className="card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
            <div className="avatar" style={{ width: 40, height: 40 }}>{d.name?.[0]}</div>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontWeight: 700 }}>{d.name}</span>
                <span className={`badge badge-${d.active === false ? 'inactive' : 'active'}`}>{d.active === false ? 'Nonaktif' : 'Aktif'}</span>
              </div>
              <div style={{ color: 'var(--ink-soft)', fontSize: '0.85rem' }}>{d.id}</div>
            </div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 700, color: (balances[d.id] || 0) < 0 ? 'var(--red)' : 'var(--blue-700)' }}>
              Token {balances[d.id] || 0}
            </div>
          </div>
        ))}
        {drivers.length === 0 && <p style={{ color: 'var(--ink-soft)' }}>Belum ada driver.</p>}
      </div>

      <h3 style={{ marginBottom: 12 }}>Aktivitas Terbaru</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {transactions.slice(0, 8).map((t) => (
          <div key={t.id} className="card" style={{ padding: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <strong>{drivers.find((d) => d.id === t.driverId)?.name || t.driverId}</strong>
              <span style={{ color: 'var(--ink-soft)', fontSize: '0.8rem' }}>{formatDateTime(t.createdAt)}</span>
            </div>
            <div style={{ color: 'var(--ink-soft)', fontSize: '0.85rem' }}>{t.transactionNumber} · {t.deliveryRegion?.name}</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--blue-700)', fontWeight: 600 }}>{formatToken(-t.tokenUsed)} token digunakan</div>
          </div>
        ))}
        {transactions.length === 0 && <p style={{ color: 'var(--ink-soft)' }}>Belum ada transaksi.</p>}
      </div>
    </div>
  );
}
