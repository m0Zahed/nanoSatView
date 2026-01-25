import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { getJson, postJson, type User } from '@/app/auth/api';

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  refreshUser: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    const { status, data } = await getJson('/auth/me');
    if (status === 200 && data && typeof data === 'object' && 'user' in data) {
      setUser((data as { user: User }).user);
    } else if (status === 401) {
      setUser(null);
    } else {
      setUser(null);
    }
  };

  const signOut = async () => {
    await postJson('/auth/logout');
    setUser(null);
  };

  useEffect(() => {
    let isActive = true;
    const run = async () => {
      try {
        await refreshUser();
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };
    run();
    return () => {
      isActive = false;
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      setUser,
      refreshUser,
      signOut,
    }),
    [user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export type { User };
