import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { clearSession, loadSession, saveSession } from './storage';
import type { SessionUser } from './types';

type SessionValue = {
  user: SessionUser | null;
  ready: boolean;
  signIn: (user: SessionUser) => Promise<void>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    loadSession()
      .then((stored) => {
        if (active) setUser(stored);
      })
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const value = useMemo<SessionValue>(
    () => ({
      user,
      ready,
      signIn: async (next) => {
        await saveSession(next);
        setUser(next);
      },
      signOut: async () => {
        await clearSession();
        setUser(null);
      },
    }),
    [ready, user],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error('Session is unavailable.');
  return value;
}
