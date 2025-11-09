import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import type { Session, User, AuthError, SignInWithPasswordCredentials } from '@supabase/supabase-js';
import { authService } from '@/lib/authService';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  initializing: boolean;
  loading: boolean;
  error: string | null;
  signInWithPassword: (credentials: SignInWithPasswordCredentials) => Promise<AuthError | null>;
  signOut: () => Promise<AuthError | null>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAuthStateChange = useCallback((nextSession: Session | null) => {
    setSession(nextSession);
    setUser(nextSession?.user ?? null);
  }, []);

  useEffect(() => {
    let isMounted = true;

    const bootstrap = async () => {
      setInitializing(true);
      setError(null);

      const {
        data: { session: initialSession },
        error: sessionError,
      } = await authService.getSession();

      if (!isMounted) {
        return;
      }

      if (sessionError) {
        console.error('AuthContext bootstrap error:', sessionError);
        setError(sessionError.message ?? 'Gagal mengambil sesi');
      }

      handleAuthStateChange(initialSession);
      setInitializing(false);
      setLoading(false);
    };

    bootstrap();

    const {
      data: { subscription },
    } = authService.onAuthStateChange((_event, nextSession) => {
      if (!isMounted) {
        return;
      }
      handleAuthStateChange(nextSession);
      setError(null);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [handleAuthStateChange]);

  const signInWithPassword = useCallback(
    async (credentials: SignInWithPasswordCredentials) => {
      setLoading(true);
      setError(null);
      const { data, error: authError } = await authService.signInWithPassword(credentials);

      if (authError) {
        setError(authError.message ?? 'Gagal masuk');
      }

      handleAuthStateChange(data.session);
      setLoading(false);
      return authError;
    },
    [handleAuthStateChange]
  );

  const signOut = useCallback(async () => {
    setLoading(true);
    setError(null);

    const { error: authError } = await authService.signOut();
    if (authError) {
      setError(authError.message ?? 'Gagal keluar');
    }

    if (!authError) {
      handleAuthStateChange(null);
    }

    setLoading(false);
    return authError;
  }, [handleAuthStateChange]);

  const refreshSession = useCallback(async () => {
    setLoading(true);
    const {
      data: { session: refreshedSession },
      error: refreshError,
    } = await authService.getSession();

    if (refreshError) {
      console.error('AuthContext refresh error:', refreshError);
      setError(refreshError.message ?? 'Gagal memperbarui sesi');
    } else {
      setError(null);
    }

    handleAuthStateChange(refreshedSession);
    setLoading(false);
  }, [handleAuthStateChange]);

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      user,
      initializing,
      loading,
      error,
      signInWithPassword,
      signOut,
      refreshSession,
    }),
    [session, user, initializing, loading, error, signInWithPassword, signOut, refreshSession]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth harus dipakai di dalam AuthProvider');
  }
  return context;
};

