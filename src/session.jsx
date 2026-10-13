import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, setSessionExpiredHandler } from './api.js';

const STORAGE_KEY = 'manager-library-session';
const SessionContext = createContext(null);

function readStored() {
  try {
    return JSON.parse(sessionStorage.getItem(STORAGE_KEY));
  } catch {
    return null;
  }
}

// Holds the token, the role and the username. Kept in sessionStorage: it ends when the tab closes.
export function SessionProvider({ children }) {
  const [session, setSession] = useState(readStored);

  const logout = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    setSession(null);
  }, []);

  const login = useCallback(async (username, password) => {
    const data = await api('/auth/login', { method: 'POST', body: { username, password } });
    const next = { token: data.access_token, role: data.role, username: username.trim().toLowerCase() };

    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setSession(next);
  }, []);

  useEffect(() => {
    setSessionExpiredHandler(logout);
  }, [logout]);

  const value = useMemo(
    () => ({
      session,
      isAdmin: session?.role === 'admin',
      login,
      logout,
      // Shorthand: an api() call that already carries the token
      call: (path, options = {}) => api(path, { ...options, token: session?.token }),
    }),
    [session, login, logout],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  return useContext(SessionContext);
}
