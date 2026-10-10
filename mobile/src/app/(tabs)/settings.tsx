import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { Linking, Pressable, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BrandMark, Card, Pill, SectionHeading, uiStyles } from '@/components/homebase-ui';
import { colors, radius } from '@/constants/theme';
import { useAuth } from '@/providers/auth-provider';

const WEB_URL = process.env.EXPO_PUBLIC_HOMEBASE_API_URL || 'https://homebasekinnect.vercel.app';

export default function SettingsScreen() {
  const { session, signOut } = useAuth();

  return (
    <SafeAreaView style={uiStyles.screen}>
      <ScrollView contentContainerStyle={uiStyles.scrollContent}>
        <View style={styles.top}><BrandMark compact /><Pill label="Private" /></View>
        <View style={uiStyles.pageHeader}>
          <Text style={styles.eyebrow}>Account & access</Text>
          <Text style={uiStyles.pageTitle}>Your Homebase.</Text>
          <Text style={uiStyles.pageSubtitle}>Native convenience with the same private family data behind the kitchen dashboard.</Text>
        </View>

        <SectionHeading title="Signed in" />
        <Card style={styles.profile}>
          <View style={styles.profileIcon}><Ionicons name="person" size={22} color={colors.emerald} /></View>
          <View style={{ flex: 1 }}><Text style={styles.primary}>{session?.user.email}</Text><Text style={uiStyles.muted}>Approved family account</Text></View>
          <Ionicons name="checkmark-circle" size={23} color={colors.emerald} />
        </Card>

        <SectionHeading title="Security" />
        <Card style={styles.listCard}>
          <View style={styles.row}><Ionicons name="scan-outline" size={23} color={colors.emerald} /><View style={{ flex: 1 }}><Text style={styles.primary}>Face ID unlock</Text><Text style={uiStyles.muted}>Protects the app after your first sign-in</Text></View><Pill label="On" /></View>
          <View style={[styles.row, styles.divider]}><Ionicons name="shield-checkmark-outline" size={23} color={colors.emerald} /><View style={{ flex: 1 }}><Text style={styles.primary}>Private API</Text><Text style={uiStyles.muted}>Every request requires your signed session</Text></View></View>
          <View style={[styles.row, styles.divider]}><Ionicons name="eye-off-outline" size={23} color={colors.emerald} /><View style={{ flex: 1 }}><Text style={styles.primary}>Search protected</Text><Text style={uiStyles.muted}>Dashboard pages remain noindex and password protected</Text></View></View>
        </Card>

        <SectionHeading title="Dashboard" />
        <Pressable onPress={() => Linking.openURL(WEB_URL)}>
          <Card style={styles.row}><Ionicons name="open-outline" size={23} color={colors.gold} /><View style={{ flex: 1 }}><Text style={styles.primary}>Open full web dashboard</Text><Text style={uiStyles.muted}>Meals, history, goals, chess, and administration</Text></View><Ionicons name="chevron-forward" size={20} color={colors.muted} /></Card>
        </Pressable>

        <Pressable onPress={signOut} style={styles.signOut}><Ionicons name="log-out-outline" size={20} color={colors.danger} /><Text style={styles.signOutText}>Sign out</Text></Pressable>
        <Text style={styles.version}>Homebase Kinnect {Constants.expoConfig?.version || '1.0.0'}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  top: { paddingTop: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: { color: colors.emerald, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.3 },
  profile: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  profileIcon: { width: 44, height: 44, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.emeraldSoft },
  primary: { color: colors.text, fontSize: 15, fontWeight: '700', marginBottom: 3 },
  listCard: { paddingVertical: 4 },
  row: { minHeight: 72, flexDirection: 'row', alignItems: 'center', gap: 13, paddingVertical: 12 },
  divider: { borderTopWidth: 1, borderTopColor: colors.border },
  signOut: { height: 52, borderRadius: radius.medium, borderWidth: 1, borderColor: '#57322D', backgroundColor: '#251817', alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 9, marginTop: 12 },
  signOutText: { color: colors.danger, fontSize: 15, fontWeight: '800' },
  version: { textAlign: 'center', color: colors.muted, fontSize: 11, marginTop: 2 },
});
