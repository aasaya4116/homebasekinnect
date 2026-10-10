import { Ionicons } from '@expo/vector-icons';
import { Redirect, Tabs } from 'expo-router';

import { LoadingView } from '@/components/homebase-ui';
import { colors } from '@/constants/theme';
import { useAuth } from '@/providers/auth-provider';
import { HomebaseProvider } from '@/providers/homebase-provider';

export default function TabLayout() {
  const { session, loading, unlocked } = useAuth();
  if (loading) return <LoadingView />;
  if (!session) return <Redirect href="/login" />;
  if (!unlocked) return <Redirect href="/unlock" />;

  return (
    <HomebaseProvider>
      <Tabs
        screenOptions={{
          headerShown: false,
          sceneStyle: { backgroundColor: colors.background },
          tabBarActiveTintColor: colors.emerald,
          tabBarInactiveTintColor: colors.muted,
          tabBarStyle: {
            backgroundColor: '#0A1714',
            borderTopColor: colors.border,
            height: 82,
            paddingTop: 8,
          },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
        }}
      >
        <Tabs.Screen name="index" options={{ title: 'Today', tabBarIcon: ({ color, size }) => <Ionicons name="sunny-outline" color={color} size={size} /> }} />
        <Tabs.Screen name="week" options={{ title: 'Week', tabBarIcon: ({ color, size }) => <Ionicons name="calendar-outline" color={color} size={size} /> }} />
        <Tabs.Screen name="kids" options={{ title: 'Kids', tabBarIcon: ({ color, size }) => <Ionicons name="school-outline" color={color} size={size} /> }} />
        <Tabs.Screen name="settings" options={{ title: 'More', tabBarIcon: ({ color, size }) => <Ionicons name="ellipsis-horizontal-circle-outline" color={color} size={size} /> }} />
      </Tabs>
    </HomebaseProvider>
  );
}
