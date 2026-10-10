import { Ionicons } from '@expo/vector-icons';
import { Redirect, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { BrandMark } from '@/components/homebase-ui';
import { colors, radius, spacing } from '@/constants/theme';
import { useAuth } from '@/providers/auth-provider';

export default function LoginScreen() {
  const router = useRouter();
  const { session, loading, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!loading && session) return <Redirect href="/(tabs)" />;

  async function submit() {
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await signIn(email, password);
      router.replace('/(tabs)');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Sign-in failed.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.page}>
          <View style={styles.hero}>
            <BrandMark />
            <View style={styles.lockBadge}><Ionicons name="lock-closed" size={16} color={colors.emerald} /><Text style={styles.lockText}>Private family access</Text></View>
            <Text style={styles.title}>Your family week, in your pocket.</Text>
            <Text style={styles.subtitle}>Meals, schedules, chores, and school updates—securely synced with the kitchen dashboard.</Text>
          </View>

          <View style={styles.form}>
            <View style={styles.field}>
              <Text style={styles.label}>Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                autoComplete="email"
                keyboardType="email-address"
                placeholder="you@example.com"
                placeholderTextColor="#61736C"
                style={styles.input}
              />
            </View>
            <View style={styles.field}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                autoCapitalize="none"
                autoComplete="current-password"
                secureTextEntry
                placeholder="••••••••••••"
                placeholderTextColor="#61736C"
                style={styles.input}
                onSubmitEditing={submit}
              />
            </View>
            {error ? <Text style={styles.error}>{error}</Text> : null}
            <Pressable disabled={submitting} onPress={submit} style={({ pressed }) => [styles.button, pressed && { opacity: 0.85 }, submitting && { opacity: 0.65 }]}>
              {submitting ? <ActivityIndicator color={colors.background} /> : <><Text style={styles.buttonText}>Sign in</Text><Ionicons name="arrow-forward" size={19} color={colors.background} /></>}
            </Pressable>
            <Text style={styles.privacy}>Invite-only access. Your family data is never public or searchable.</Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  page: { flex: 1, justifyContent: 'space-between', padding: spacing.lg, paddingTop: 32, paddingBottom: 24 },
  hero: { gap: 18 },
  lockBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, paddingVertical: 7, paddingHorizontal: 11, borderRadius: radius.pill, backgroundColor: colors.emeraldSoft },
  lockText: { color: colors.emerald, fontSize: 12, fontWeight: '700' },
  title: { color: colors.text, fontSize: 42, lineHeight: 46, fontWeight: '800', letterSpacing: -1.7, maxWidth: 350 },
  subtitle: { color: colors.muted, fontSize: 16, lineHeight: 24, maxWidth: 350 },
  form: { gap: 14, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.large, padding: 18 },
  field: { gap: 7 },
  label: { color: colors.muted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.8 },
  input: { height: 52, borderRadius: radius.medium, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background, color: colors.text, paddingHorizontal: 15, fontSize: 16 },
  error: { color: colors.danger, fontSize: 13, lineHeight: 18 },
  button: { height: 54, borderRadius: radius.medium, backgroundColor: colors.emerald, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 },
  buttonText: { color: colors.background, fontWeight: '800', fontSize: 16 },
  privacy: { color: colors.muted, textAlign: 'center', fontSize: 11, lineHeight: 16 },
});
