import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import PageHeader from '../../components/ui/PageHeader';

export default function DriverSettings() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div>
      <PageHeader title="Pengaturan" backTo="/driver" />
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="field"><label>Nama</label><div>{user.name}</div></div>
        <div className="field"><label>ID Driver</label><div>{user.id}</div></div>
        <div className="field" style={{ marginBottom: 0 }}><label>Wilayah</label><div>{user.regionCode}</div></div>
      </div>
      <button className="btn btn-danger btn-block" onClick={() => { logout(); navigate('/login'); }}>Keluar</button>
    </div>
  );
}
