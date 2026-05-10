import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import MainLayout from './components/Layout/MainLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AWSAccounts from './pages/AWSAccounts';
import CostAnalytics from './pages/CostAnalytics';
import Kubernetes from './pages/Kubernetes';
import Recommendations from './pages/Recommendations';
import Alerts from './pages/Alerts';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth();
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <MainLayout>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/aws-accounts" element={<AWSAccounts />} />
                <Route path="/costs" element={<CostAnalytics />} />
                <Route path="/kubernetes" element={<Kubernetes />} />
                <Route path="/recommendations" element={<Recommendations />} />
                <Route path="/alerts" element={<Alerts />} />
              </Routes>
            </MainLayout>
          </ProtectedRoute>
        }
      />
    </Routes>
  );
}
