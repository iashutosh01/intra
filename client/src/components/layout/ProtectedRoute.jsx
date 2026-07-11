import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';

export default function ProtectedRoute({ children }) {
  const { verified } = useAuth();
  return verified ? children : <Navigate to="/pin" replace />;
}
