import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import AppLayout from './components/layout/AppLayout.jsx';
import ProtectedRoute from './components/layout/ProtectedRoute.jsx';

const Analytics = lazy(() => import('./pages/Analytics.jsx'));
const Dashboard = lazy(() => import('./pages/Dashboard.jsx'));
const History = lazy(() => import('./pages/History.jsx'));
const LoanDetails = lazy(() => import('./pages/LoanDetails.jsx'));
const Loans = lazy(() => import('./pages/Loans.jsx'));
const Payments = lazy(() => import('./pages/Payments.jsx'));
const PinGate = lazy(() => import('./pages/PinGate.jsx'));
const Settings = lazy(() => import('./pages/Settings.jsx'));

const RouteLoader = () => (
  <div className="grid min-h-[60vh] place-items-center">
    <div className="h-10 w-10 animate-spin rounded-full border-4 border-blue-100 border-t-brand-600" />
  </div>
);

export default function App() {
  return (
    <Suspense fallback={<RouteLoader />}>
      <Routes>
        <Route path="/pin" element={<PinGate />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="loans" element={<Loans />} />
          <Route path="loans/:id" element={<LoanDetails />} />
          <Route path="payments" element={<Payments />} />
          <Route path="history" element={<History />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="settings" element={<Settings />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
