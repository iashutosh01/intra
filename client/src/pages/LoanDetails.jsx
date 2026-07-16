import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useFinance } from '../context/FinanceContext.jsx';

// Compatibility route: every detail entry point opens the one global modal.
export default function LoanDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { openPerson } = useFinance();
  useEffect(() => {
    openPerson(id);
    navigate('/loans', { replace: true });
  }, [id, navigate, openPerson]);
  return null;
}
