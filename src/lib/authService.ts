import type {
  AuthChangeEvent,
  AuthError,
  Session,
  SignInWithPasswordCredentials,
  User,
} from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

type AuthStateListener = (
  event: AuthChangeEvent,
  session: Session | null
) => void;

export const authService = {
  async getSession() {
    return supabase.auth.getSession();
  },

  async getUser(): Promise<{ data: { user: User | null }; error: AuthError | null }> {
    return supabase.auth.getUser();
  },

  async refreshSession() {
    return supabase.auth.getSession();
  },

  async signInWithPassword(credentials: SignInWithPasswordCredentials) {
    return supabase.auth.signInWithPassword(credentials);
  },

  async signOut() {
    return supabase.auth.signOut();
  },

  onAuthStateChange(callback: AuthStateListener) {
    return supabase.auth.onAuthStateChange(callback);
  },
};

