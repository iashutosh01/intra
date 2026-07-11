import { createContext, useContext, useMemo, useState } from 'react';
import { endpoints } from '../services/api.js';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [verified, setVerified] = useState(() => sessionStorage.getItem('pinVerified') === 'true');

  const value = useMemo(
    () => ({
      verified,
      verify: async (pin) => {
        await endpoints.verifyPin(pin);
        sessionStorage.setItem('pinVerified', 'true');
        setVerified(true);
      },
      lock: () => {
        sessionStorage.removeItem('pinVerified');
        setVerified(false);
      },
      logout: () => {
        sessionStorage.removeItem('pinVerified');
        setVerified(false);
      }
    }),
    [verified]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
