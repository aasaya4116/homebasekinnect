import { Ionicons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { ActivityIndicator, StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { colors, radius, spacing } from '@/constants/theme';

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <View style={styles.brandRow}>
      <View style={styles.brandIcon}><Ionicons name="home" size={compact ? 16 : 20} color={colors.background} /></View>
      <Text style={[styles.brand, compact && { fontSize: 17 }]}>Homebase <Text style={styles.brandAccent}>Kinnect</Text></Text>
    </View>
  );
}

export function SectionHeading({ eyebrow, title, action }: { eyebrow?: string; title: string; action?: ReactNode }) {
  return (
    <View style={styles.sectionHeading}>
      <View style={{ flex: 1 }}>
        {eyebrow ? <Text style={styles.eyebrow}>{eyebrow}</Text> : null}
        <Text style={styles.sectionTitle}>{title}</Text>
      </View>
      {action}
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Pill({ label, tone = 'emerald' }: { label: string; tone?: 'emerald' | 'gold' | 'blue' | 'purple' }) {
  const palette = {
    emerald: [colors.emeraldSoft, colors.emerald],
    gold: [colors.goldSoft, colors.gold],
    blue: ['#152C4B', colors.blue],
    purple: ['#2D2247', colors.purple],
  }[tone];
  return <View style={[styles.pill, { backgroundColor: palette[0] }]}><Text style={[styles.pillText, { color: palette[1] }]}>{label}</Text></View>;
}

export function CheckButton({ checked, disabled }: { checked: boolean; disabled?: boolean }) {
  return (
    <View
      style={[styles.check, checked && styles.checkDone, disabled && { opacity: 0.5 }]}
    >
      {checked ? <Ionicons name="checkmark" size={18} color={colors.background} /> : null}
    </View>
  );
}

export function LoadingView({ label = 'Loading Homebase…' }: { label?: string }) {
  return <View style={styles.loading}><ActivityIndicator color={colors.emerald} /><Text style={styles.loadingText}>{label}</Text></View>;
}

export function ErrorBanner({ message }: { message?: string | null }) {
  if (!message) return null;
  return <View style={styles.error}><Ionicons name="alert-circle-outline" size={18} color={colors.danger} /><Text style={styles.errorText}>{message}</Text></View>;
}

export const uiStyles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingHorizontal: spacing.lg, paddingBottom: 120, gap: spacing.md },
  pageHeader: { paddingTop: 10, paddingBottom: 8, gap: 10 },
  pageTitle: { color: colors.text, fontSize: 32, lineHeight: 38, fontWeight: '800', letterSpacing: -1 },
  pageSubtitle: { color: colors.muted, fontSize: 15, lineHeight: 22 },
  body: { color: colors.text, fontSize: 15, lineHeight: 21 },
  muted: { color: colors.muted, fontSize: 13, lineHeight: 18 },
});

const styles = StyleSheet.create({
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 9 },
  brandIcon: { width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.emerald },
  brand: { color: colors.text, fontSize: 21, fontWeight: '800', letterSpacing: -0.6 },
  brandAccent: { color: colors.emerald },
  sectionHeading: { flexDirection: 'row', alignItems: 'flex-end', gap: 12, marginTop: 8 },
  eyebrow: { color: colors.emerald, textTransform: 'uppercase', letterSpacing: 1.4, fontSize: 11, fontWeight: '800', marginBottom: 4 },
  sectionTitle: { color: colors.text, fontSize: 21, fontWeight: '700', letterSpacing: -0.4 },
  card: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.large, padding: spacing.md },
  pill: { borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 6, alignSelf: 'flex-start' },
  pillText: { fontSize: 11, textTransform: 'uppercase', letterSpacing: 0.7, fontWeight: '800' },
  check: { width: 30, height: 30, borderRadius: 10, borderWidth: 1.5, borderColor: '#50665E', alignItems: 'center', justifyContent: 'center' },
  checkDone: { backgroundColor: colors.emerald, borderColor: colors.emerald },
  loading: { flex: 1, minHeight: 260, alignItems: 'center', justifyContent: 'center', gap: 12 },
  loadingText: { color: colors.muted, fontSize: 14 },
  error: { flexDirection: 'row', gap: 9, backgroundColor: '#311D1B', borderColor: '#683830', borderWidth: 1, padding: 12, borderRadius: radius.medium },
  errorText: { color: '#FFC1B7', fontSize: 13, lineHeight: 18, flex: 1 },
});
