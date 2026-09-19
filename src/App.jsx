import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute, { FullscreenLoader } from './components/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';

import KorwilDashboard from './pages/korwil/Dashboard';
import KorwilDrivers from './pages/korwil/Drivers';
import KorwilTransactions from './pages/korwil/Transactions';
import KorwilTopUpApproval from './pages/korwil/TopUpApproval';
import KorwilReports from './pages/korwil/Reports';
import KorwilSettings from './pages/korwil/Settings';

import DriverDashboard from './pages/driver/Dashboard';
import DriverNewOrder from './pages/driver/NewOrder';
import DriverHistory from './pages/driver/History';
import DriverTopUp from './pages/driver/TopUp';
import DriverReports from './pages/driver/Reports';
import DriverSettings from './pages/driver/Settings';

function RootRedirect() {
  const { user, loading } = useAuth();
  if (loading) return <FullscreenLoader />;
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'korwil' ? '/korwil' : '/driver'} replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<RootRedirect />} />
          <Route path="/login" element={<Login />} />

          <Route path="/korwil" element={<ProtectedRoute role="korwil"><AppLayout role="korwil"><KorwilDashboard /></AppLayout></ProtectedRoute>} />
          <Route path="/korwil/driver" element={<ProtectedRoute role="korwil"><AppLayout role="korwil"><KorwilDrivers /></AppLayout></ProtectedRoute>} />
          <Route path="/korwil/transaksi" element={<ProtectedRoute role="korwil"><AppLayout role="korwil"><KorwilTransactions /></AppLayout></ProtectedRoute>} />
          <Route path="/korwil/topup" element={<ProtectedRoute role="korwil"><AppLayout role="korwil"><KorwilTopUpApproval /></AppLayout></ProtectedRoute>} />
          <Route path="/korwil/laporan" element={<ProtectedRoute role="korwil"><AppLayout role="korwil"><KorwilReports /></AppLayout></ProtectedRoute>} />
          <Route path="/korwil/pengaturan" element={<ProtectedRoute role="korwil"><AppLayout role="korwil"><KorwilSettings /></AppLayout></ProtectedRoute>} />

          <Route path="/driver" element={<ProtectedRoute role="driver"><AppLayout role="driver"><DriverDashboard /></AppLayout></ProtectedRoute>} />
          <Route path="/driver/pesanan" element={<ProtectedRoute role="driver"><AppLayout role="driver"><DriverNewOrder /></AppLayout></ProtectedRoute>} />
          <Route path="/driver/riwayat" element={<ProtectedRoute role="driver"><AppLayout role="driver"><DriverHistory /></AppLayout></ProtectedRoute>} />
          <Route path="/driver/struk" element={<ProtectedRoute role="driver"><AppLayout role="driver"><DriverHistory title="Struk" /></AppLayout></ProtectedRoute>} />
          <Route path="/driver/token" element={<ProtectedRoute role="driver"><AppLayout role="driver"><DriverTopUp /></AppLayout></ProtectedRoute>} />
          <Route path="/driver/laporan" element={<ProtectedRoute role="driver"><AppLayout role="driver"><DriverReports /></AppLayout></ProtectedRoute>} />
          <Route path="/driver/pengaturan" element={<ProtectedRoute role="driver"><AppLayout role="driver"><DriverSettings /></AppLayout></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
