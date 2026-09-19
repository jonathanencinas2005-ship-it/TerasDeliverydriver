import { useEffect, useState } from 'react';
import { ref, onValue, set, query, orderByChild, equalTo, update } from 'firebase/database';
import { db } from '../../firebase';
import { useAuth } from '../../contexts/AuthContext';
import StatusBadge from '../../components/ui/StatusBadge';
import PageHeader from '../../components/ui/PageHeader';

export default function KorwilDrivers() {
  const { user } = useAuth();
  const [drivers, setDrivers] = useState([]);
  const [balances, setBalances] = useState({});
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState('');

  useEffect(() => {
    const q = query(ref(db, 'users'), orderByChild('regionCode'), equalTo(user.regionCode));
    const unsub = onValue(q, (snap) => {
      const list = [];
      snap.forEach((child) => { if (child.val().role === 'driver') list.push({ id: child.key, ...child.val() }); });
      list.sort((a, b) => a.driverCode.localeCompare(b.driverCode));
      setDrivers(list);
    });
    const unsub2 = onValue(ref(db, 'tokenBalances'), (snap) => setBalances(snap.val() || {}));
    return () => { unsub(); unsub2(); };
  }, [user.regionCode]);

  async function handleAdd(e) {
    e.preventDefault();
    setError('');
    const paddedCode = code.trim().padStart(2, '0');
    if (!name.trim() || !/^\d{1,2}$/.test(code.trim())) {
      setError('Isi nama dan kode driver (angka) dengan benar.');
      return;
    }
    const driverId = `${user.regionCode}-${paddedCode}`;
    const exists = drivers.find((d) => d.id === driverId);
    if (exists) {
      setError(`Kode ${paddedCode} sudah dipakai oleh ${exists.name}.`);
      return;
    }
    await set(ref(db, `users/${driverId}`), {
      role: 'driver',
      name: name.trim(),
      driverCode: paddedCode,
      regionCode: user.regionCode,
      active: true,
      createdAt: Date.now()
    });
    await set(ref(db, `tokenBalances/${driverId}`), 0);
    setName(''); setCode(''); setShowForm(false);
  }

  async function toggleActive(driver) {
    await update(ref(db, `users/${driver.id}`), { active: driver.active === false });
  }

  async function saveEdit(driver) {
    await update(ref(db, `users/${driver.id}`), { name: editName.trim() || driver.name });
    setEditingId(null);
  }

  return (
    <div>
      <PageHeader title="Manajemen Driver" backTo="/korwil" />
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 18 }}>
        <button className="btn btn-primary" onClick={() => setShowForm((s) => !s)}>+ Tambah Driver</button>
      </div>

      {showForm && (
        <form onSubmit={handleAdd} className="card" style={{ marginBottom: 20 }}>
          <div className="field">
            <label>Nama Driver</label>
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Jo" />
          </div>
          <div className="field">
            <label>Kode Driver</label>
            <input className="input" value={code} onChange={(e) => setCode(e.target.value)} placeholder="Contoh: 02" />
            {code && <div style={{ color: 'var(--ink-soft)', fontSize: '0.82rem', marginTop: 4 }}>
              ID yang akan dibuat: <strong>{user.regionCode}-{code.trim().padStart(2, '0')}</strong>
            </div>}
          </div>
          {error && <div style={{ color: 'var(--red)', fontSize: '0.85rem', marginBottom: 10 }}>{error}</div>}
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="submit" className="btn btn-primary">Simpan</button>
            <button type="button" className="btn btn-ghost" onClick={() => setShowForm(false)}>Batal</button>
          </div>
        </form>
      )}

      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {drivers.map((d) => (
          <div key={d.id} className="card" style={{ padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div style={{ flex: 1 }}>
                {editingId === d.id ? (
                  <input className="input" value={editName} onChange={(e) => setEditName(e.target.value)} style={{ marginBottom: 6 }} />
                ) : (
                  <div style={{ fontWeight: 700 }}>{d.name}</div>
                )}
                <div style={{ color: 'var(--ink-soft)', fontSize: '0.85rem' }}>{d.id}</div>
              </div>
              <StatusBadge status={d.active === false ? 'inactive' : 'active'} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
              <div style={{ fontWeight: 700, color: (balances[d.id] || 0) < 0 ? 'var(--red)' : 'var(--blue-700)' }}>
                {balances[d.id] || 0} TOKEN
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                {editingId === d.id ? (
                  <>
                    <button className="btn btn-secondary" onClick={() => saveEdit(d)}>Simpan</button>
                    <button className="btn btn-ghost" onClick={() => setEditingId(null)}>Batal</button>
                  </>
                ) : (
                  <>
                    <button className="btn btn-secondary" onClick={() => { setEditingId(d.id); setEditName(d.name); }}>Edit</button>
                    <button className="btn btn-danger" onClick={() => toggleActive(d)}>
                      {d.active === false ? 'Aktifkan' : 'Nonaktifkan'}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
        {drivers.length === 0 && <p style={{ color: 'var(--ink-soft)' }}>Belum ada driver di wilayah ini.</p>}
      </div>
      <p style={{ color: 'var(--ink-soft)', fontSize: '0.82rem', marginTop: 16 }}>
        Driver yang sudah punya transaksi lebih aman dinonaktifkan daripada dihapus, agar histori tetap tersimpan.
      </p>
    </div>
  );
}
