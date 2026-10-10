import * as LocalAuthentication from 'expo-local-authentication';
import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { Platform } from 'react-native';

import { isSupabaseConfigured, supabase } from '@/lib/supabase';

type AuthContextValue = {
  session: Session | null;
  loading: boolean;
  unlocked: boolean;
  signIn(email: string, password: string): Promise<void>;
  signOut(): Promise<void>;
  unlock(): Promise<boolean>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [unlocked, setUnlocked] = useState(Platform.OS === 'web');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      if (!nextSession) setUnlocked(Platform.OS === 'web');
      setLoading(false);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    if (!isSupabaseConfigured) throw new Error('This build is missing its Supabase configuration.');
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    if (error) throw error;
    setUnlocked(true);
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUnlocked(Platform.OS === 'web');
  }, []);

  const unlock = useCallback(async () => {
    if (Platform.OS === 'web') {
      setUnlocked(true);
      return true;
    }
    const [hardware, enrolled] = await Promise.all([
      LocalAuthentication.hasHardwareAsync(),
      LocalAuthentication.isEnrolledAsync(),
    ]);
    if (!hardware || !enrolled) {
      setUnlocked(true);
      return true;
    }
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage: 'Unlock Homebase Kinnect',
      fallbackLabel: 'Use device passcode',
      disableDeviceFallback: false,
    });
    setUnlocked(result.success);
    return result.success;
  }, []);

  const value = useMemo(
    () => ({ session, loading, unlocked, signIn, signOut, unlock }),
    [session, loading, unlocked, signIn, signOut, unlock]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error('useAuth must be used inside AuthProvider');
  return value;
}
