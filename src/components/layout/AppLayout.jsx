import { NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { Menu, Home, Package, Clock, Receipt, Settings, Users, ClipboardList, BarChart3, UserCircle, LogOut, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

const KORWIL_NAV = [
  { to: '/korwil', label: 'Beranda', icon: Home, end: true },
  { to: '/korwil/driver', label: 'Driver', icon: Users },
  { to: '/korwil/transaksi', label: 'Transaksi', icon: ClipboardList },
  { to: '/korwil/laporan', label: 'Laporan', icon: BarChart3 },
  { to: '/korwil/pengaturan', label: 'Profil', icon: UserCircle }
];

const DRIVER_NAV = [
  { to: '/driver', label: 'Dashboard', icon: Home, end: true },
  { to: '/driver/pesanan', label: 'Pesanan', icon: Package },
  { to: '/driver/riwayat', label: 'Riwayat', icon: Clock },
  { to: '/driver/struk', label: 'Struk', icon: Receipt },
  { to: '/driver/pengaturan', label: 'Pengaturan', icon: Settings }
];

export default function AppLayout({ role, children }) {
  const nav = role === 'korwil' ? KORWIL_NAV : DRIVER_NAV;
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  return (
    <div>
      {!isOnline && <div className="offline-banner">Offline — data belum tentu tersinkron ke server</div>}

      <header className="app-topbar">
        <button onClick={() => setMenuOpen((m) => !m)} aria-label="Menu" style={{ background: 'transparent', color: 'var(--white)' }}>
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Logo size={28} light />
          <div>
            <div style={{ fontFamily: 'var(--font-display)', fontWeight: 800, fontSize: 13, color: 'var(--white)', letterSpacing: '0.02em' }}>TERAS</div>
            <div style={{ fontSize: 8, color: 'rgba(255,255,255,0.8)', letterSpacing: '0.06em', fontWeight: 600 }}>PESAN, PROSES, HAPPY!</div>
          </div>
        </div>
        <button onClick={() => navigate(role === 'korwil' ? '/korwil/pengaturan' : '/driver/pengaturan')} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'transparent', marginLeft: 'auto' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--white)' }}>{user?.name}</div>
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.85)' }}>{user?.id}</div>
          </div>
          <div className="avatar" style={{ width: 30, height: 30, fontSize: 13, background: 'rgba(255,255,255,0.2)', color: 'var(--white)' }}>
            {user?.name?.[0]}
          </div>
        </button>
      </header>

      {menuOpen && (
        <div className="app-drawer">
          {nav.map((item) => {
            const Icon = item.icon;
            return (
              <NavLink key={item.to} to={item.to} end={item.end} className="drawer-link" onClick={() => setMenuOpen(false)}>
                <Icon size={18} /> {item.label}
              </NavLink>
            );
          })}
          <button className="drawer-link" style={{ background: 'transparent', color: 'var(--danger)', width: '100%', textAlign: 'left' }} onClick={() => { logout(); navigate('/login'); }}>
            <LogOut size={18} /> Keluar
          </button>
        </div>
      )}

      <main className="app-main">{children}</main>

      <nav className="bottom-nav">
        {nav.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink key={item.to} to={item.to} end={item.end} className={({ isActive }) => `bottom-nav-link${isActive ? ' active' : ''}`}>
              <Icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <style>{`
        .app-topbar {
          display: flex; align-items: center; gap: 10px;
          background: var(--blue-primary); padding: 12px 16px;
          height: 60px; position: sticky; top: 0; z-index: 15;
        }
        @media (min-width: 500px) {
          .app-topbar { max-width: 480px; margin: 0 auto; }
        }
        .app-drawer {
          position: sticky; top: 60px; z-index: 14;
          background: var(--white); border-bottom: 1px solid var(--border);
          box-shadow: var(--shadow-card);
          max-width: 480px; margin: 0 auto; padding: 6px;
        }
        .drawer-link {
          display: flex; align-items: center; gap: 10px; padding: 12px 14px; border-radius: var(--radius-sm);
          color: var(--text-primary); text-decoration: none; font-weight: 600; font-size: 13px;
        }
        .drawer-link.active { background: var(--blue-light); color: var(--blue-dark); }
        .bottom-nav {
          position: fixed; bottom: 0; left: 0; right: 0;
          display: flex; background: var(--white); border-top: 1px solid var(--border);
          padding: 8px 4px calc(8px + env(safe-area-inset-bottom));
          max-width: 480px; margin: 0 auto;
          box-shadow: 0 -2px 8px rgba(20,80,120,0.05);
          z-index: 20;
        }
        .bottom-nav-link {
          flex: 1; display: flex; flex-direction: column; align-items: center; gap: 3px;
          color: var(--text-muted); text-decoration: none; font-size: 10px; font-weight: 600; padding: 4px 0;
        }
        .bottom-nav-link.active { color: var(--blue-primary); }
        @media (min-width: 500px) {
          .bottom-nav { left: 50%; transform: translateX(-50%); border-left: 1px solid var(--border); border-right: 1px solid var(--border); }
        }
      `}</style>
    </div>
  );
}

export function Logo({ size = 34, light = false }) {
  // Logo hexagon TERAS — placeholder yang meniru bentuk logo asli Anda
  // (hexagon + tanda panah ganda). Ganti dengan file logo asli sebelum
  // produksi bila tersedia; jangan ubah proporsi logo asli saat mengganti.
  const color = light ? '#FFFFFF' : 'var(--blue-primary)';
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M24 2 L44 13 V35 L24 46 L4 35 V13 Z" stroke={color} strokeWidth="3" fill="none" />
      <path d="M15 24 L24 15 L24 21 L33 21 L33 27 L24 27 L24 33 Z" fill={color} />
    </svg>
  );
}
