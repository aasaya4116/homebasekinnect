import { Redirect } from 'expo-router';

import { LoadingView } from '@/components/homebase-ui';
import { useAuth } from '@/providers/auth-provider';

export default function IndexScreen() {
  const { session, loading, unlocked } = useAuth();
  if (loading) return <LoadingView label="Opening your Homebase…" />;
  if (!session) return <Redirect href="/login" />;
  if (!unlocked) return <Redirect href="/unlock" />;
  return <Redirect href="/(tabs)" />;
}
