import { useEffect, useState } from 'react';
import { ref, onValue, query, orderByChild, equalTo } from 'firebase/database';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import StatCard from '../../components/ui/StatCard';
import { Link } from 'react-router-dom';
import { jakartaDateKey } from '../../lib/format';
import { Coins, Truck, Package, Clock, Receipt, Settings, Plus } from 'lucide-react';

const QUICK_ACTIONS = [
  { to: '/driver/pesanan', label: 'Pesanan', icon: Package },
  { to: '/driver/riwayat', label: 'Riwayat', icon: Clock },
  { to: '/driver/struk', label: 'Struk', icon: Receipt },
  { to: '/driver/pengaturan', label: 'Pengaturan', icon: Settings }
];

export default function DriverDashboard() {
  const { user } = useAuth();
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const unsub = onValue(ref(db, `tokenBalances/${user.id}`), (snap) => setBalance(snap.val() || 0));
    const q = query(ref(db, 'transactions'), orderByChild('driverId'), equalTo(user.id));
    const unsub2 = onValue(q, (snap) => {
      const list = [];
      snap.forEach((child) => list.push({ id: child.key, ...child.val() }));
      setTransactions(list);
    });
    return () => { unsub(); unsub2(); };
  }, [user.id]);

  const todayKey = jakartaDateKey();
  const todayTx = transactions.filter((t) => jakartaDateKey(t.createdAt) === todayKey);
  const totalOngkir = todayTx.reduce((s, t) => s + t.deliveryFee, 0);

  return (
    <div>
      <h2 style={{ marginBottom: 2, fontWeight: 400, fontSize: 15, color: 'var(--text-secondary)' }}>Selamat Datang,</h2>
      <h1 style={{ marginBottom: 4, fontSize: 22 }}>{user.name}</h1>
      <p style={{ color: 'var(--text-secondary)', marginTop: 0, marginBottom: 18, fontSize: 12 }}>Semangat hari ini! Semoga banyak orderan.</p>

      <div className="stat-grid" style={{ marginBottom: 18 }}>
        <StatCard label="Token Saat Ini" value={balance} icon={Coins} tone={balance < 0 ? 'bad' : 'brand'} />
        <StatCard label="Total Ongkir Hari Ini" value={`Rp${totalOngkir.toLocaleString('id-ID')}`} icon={Truck} />
      </div>

      <Link to="/driver/pesanan" className="btn btn-primary btn-block" style={{ marginBottom: 18 }}>
        <Plus size={18} /> Pesanan Baru
      </Link>

      <div className="quick-actions">
        {QUICK_ACTIONS.map((a) => (
          <Link key={a.to} to={a.to} className="quick-action">
            <a.icon size={20} />
            {a.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
