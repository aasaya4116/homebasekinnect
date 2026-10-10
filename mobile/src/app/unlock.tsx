import { Ionicons } from '@expo/vector-icons';
import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, SafeAreaView, StyleSheet, Text, View } from 'react-native';

import { BrandMark } from '@/components/homebase-ui';
import { colors, radius, spacing } from '@/constants/theme';
import { useAuth } from '@/providers/auth-provider';

export default function UnlockScreen() {
  const router = useRouter();
  const { session, loading, unlocked, unlock, signOut } = useAuth();
  const [working, setWorking] = useState(false);

  async function authenticate() {
    setWorking(true);
    if (await unlock()) router.replace('/(tabs)');
    setWorking(false);
  }

  if (!loading && !session) return <Redirect href="/login" />;
  if (unlocked) return <Redirect href="/(tabs)" />;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.page}>
        <BrandMark />
        <View style={styles.center}>
          <View style={styles.face}><Ionicons name="scan-outline" size={56} color={colors.emerald} /></View>
          <Text style={styles.title}>Welcome back</Text>
          <Text style={styles.subtitle}>Unlock your private family dashboard.</Text>
          <Pressable disabled={working} onPress={authenticate} style={styles.button}>
            <Ionicons name="scan-outline" size={20} color={colors.background} />
            <Text style={styles.buttonText}>{working ? 'Checking…' : 'Unlock with Face ID'}</Text>
          </Pressable>
        </View>
        <Pressable onPress={signOut}><Text style={styles.signOut}>Use a different account</Text></Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  page: { flex: 1, alignItems: 'center', justifyContent: 'space-between', padding: spacing.xl },
  center: { width: '100%', alignItems: 'center', gap: 14 },
  face: { width: 112, height: 112, borderRadius: 36, backgroundColor: colors.emeraldSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  title: { color: colors.text, fontSize: 31, fontWeight: '800', letterSpacing: -1 },
  subtitle: { color: colors.muted, fontSize: 15, marginBottom: 18 },
  button: { width: '100%', height: 54, borderRadius: radius.medium, backgroundColor: colors.emerald, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  buttonText: { color: colors.background, fontSize: 16, fontWeight: '800' },
  signOut: { color: colors.muted, fontSize: 14, fontWeight: '600' },
});
