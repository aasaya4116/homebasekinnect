import { Ionicons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { colors, radius, spacing } from '@/constants/theme';
import type { MealChangeRequest, MobileMealOption } from '@/lib/types';

const REASONS = [
  { key: 'busy', label: 'Too busy' },
  { key: 'missing-ingredients', label: 'Missing ingredients' },
  { key: 'preference', label: 'Wanted something else' },
  { key: 'leftovers', label: 'Use leftovers' },
  { key: 'ate-out', label: 'Ate out' },
  { key: 'schedule-change', label: 'Schedule changed' },
  { key: 'other', label: 'Other' },
] as const;

export type MealEditorTarget = {
  date: string;
  mealType: 'Lunch' | 'Dinner';
  currentMeal: string;
};

type MealEditorProps = {
  target: MealEditorTarget | null;
  options: MobileMealOption[];
  saving: boolean;
  onClose(): void;
  onSave(meal: MealChangeRequest): Promise<void>;
};

export function MealEditor({ target, options, saving, onClose, onSave }: MealEditorProps) {
  const [name, setName] = useState('');
  const [reason, setReason] = useState('');
  const [localError, setLocalError] = useState('');

  function resetAndClose() {
    setName('');
    setReason('');
    setLocalError('');
    onClose();
  }

  const matchingOptions = useMemo(() => {
    if (!target) return [];
    const query = name.trim().toLowerCase();
    const sameType = options.filter((option) => option.type.toLowerCase() === target.mealType.toLowerCase());
    const pool = sameType.length ? sameType : options;
    return pool
      .filter((option) => !query || option.name.toLowerCase().includes(query))
      .filter((option) => option.name.toLowerCase() !== target.currentMeal.toLowerCase())
      .slice(0, 6);
  }, [name, options, target]);

  if (!target) return null;
  const currentTarget = target;

  const dateLabel = new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  }).format(new Date(`${currentTarget.date}T12:00:00`));
  const exactOption = options.find((option) => option.name.toLowerCase() === name.trim().toLowerCase());
  const canSave = Boolean(name.trim() && reason && !saving);

  function chooseQuickMeal(nextName: string, nextReason: string) {
    setName(nextName);
    setReason(nextReason);
    setLocalError('');
  }

  async function save() {
    const trimmedName = name.trim();
    if (!trimmedName || !reason) {
      setLocalError('Choose a replacement and tell us why the plan changed.');
      return;
    }
    if (trimmedName.toLowerCase() === currentTarget.currentMeal.toLowerCase()) {
      setLocalError('Choose a different meal before saving.');
      return;
    }

    setLocalError('');
    try {
      await onSave({
        date: currentTarget.date,
        mealType: currentTarget.mealType,
        name: trimmedName,
        reason,
        prepTime: exactOption?.prepTime,
        ingredients: exactOption?.ingredients,
        image: exactOption?.image,
      });
      resetAndClose();
    } catch (caught) {
      setLocalError(caught instanceof Error ? caught.message : 'Homebase could not save this change.');
    }
  }

  return (
    <Modal visible animationType="slide" presentationStyle="pageSheet" onRequestClose={() => !saving && resetAndClose()}>
      <SafeAreaView style={styles.safeArea}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.header}>
            <Pressable accessibilityRole="button" accessibilityLabel="Close meal editor" accessibilityState={{ disabled: saving }} disabled={saving} onPress={resetAndClose} hitSlop={10} style={styles.closeButton}>
              <Ionicons name="close" size={23} color={colors.text} />
            </Pressable>
            <View style={styles.headerText}>
              <Text style={styles.eyebrow}>{dateLabel}</Text>
              <Text style={styles.title}>Change {currentTarget.mealType.toLowerCase()}</Text>
            </View>
            <View style={styles.closeButton} />
          </View>

          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            <View style={styles.currentCard}>
              <Text style={styles.currentLabel}>Currently planned</Text>
              <Text style={styles.currentMeal}>{currentTarget.currentMeal || 'Nothing yet'}</Text>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Quick change</Text>
              <View style={styles.quickRow}>
                <Pressable onPress={() => chooseQuickMeal('Leftovers', 'leftovers')} style={[styles.quickButton, styles.leftoversButton]}>
                  <Text style={styles.quickEmoji}>🥡</Text>
                  <Text style={styles.quickText}>Leftovers</Text>
                </Pressable>
                <Pressable onPress={() => chooseQuickMeal('Eat Out', 'ate-out')} style={[styles.quickButton, styles.takeoutButton]}>
                  <Text style={styles.quickEmoji}>🥡</Text>
                  <Text style={styles.quickText}>Takeout</Text>
                </Pressable>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>What are we having instead?</Text>
              <View style={styles.inputWrap}>
                <Ionicons name="search" size={19} color={colors.muted} />
                <TextInput
                  accessibilityLabel="Replacement meal"
                  autoCapitalize="words"
                  autoCorrect
                  placeholder="Search recipes or type any meal"
                  placeholderTextColor={colors.muted}
                  value={name}
                  onChangeText={(value) => { setName(value); setLocalError(''); }}
                  style={styles.input}
                  returnKeyType="done"
                />
                {name ? (
                  <Pressable accessibilityRole="button" accessibilityLabel="Clear meal" onPress={() => setName('')} hitSlop={8}>
                    <Ionicons name="close-circle" size={20} color={colors.muted} />
                  </Pressable>
                ) : null}
              </View>
              <View style={styles.options}>
                {matchingOptions.map((option) => {
                  const selected = option.name.toLowerCase() === name.trim().toLowerCase();
                  return (
                    <Pressable key={`${option.type}-${option.id}-${option.name}`} onPress={() => { setName(option.name); setLocalError(''); }} style={[styles.option, selected && styles.optionSelected]}>
                      <View style={styles.optionText}>
                        <Text style={[styles.optionName, selected && styles.optionNameSelected]} numberOfLines={1}>{option.name}</Text>
                        {option.prepTime && option.prepTime !== 'N/A' ? <Text style={styles.optionMeta}>{option.prepTime}</Text> : null}
                      </View>
                      <Ionicons name={selected ? 'checkmark-circle' : 'add-circle-outline'} size={21} color={selected ? colors.emerald : colors.muted} />
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Why did the plan change?</Text>
              <Text style={styles.helper}>This helps Homebase make better recommendations next time.</Text>
              <View style={styles.reasonWrap}>
                {REASONS.map((item) => {
                  const selected = reason === item.key;
                  return (
                    <Pressable key={item.key} onPress={() => { setReason(item.key); setLocalError(''); }} style={[styles.reason, selected && styles.reasonSelected]}>
                      <Text style={[styles.reasonText, selected && styles.reasonTextSelected]}>{item.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {localError ? <Text accessibilityRole="alert" style={styles.error}>{localError}</Text> : null}
          </ScrollView>

          <View style={styles.footer}>
            <Pressable accessibilityRole="button" accessibilityState={{ disabled: !canSave }} disabled={!canSave} onPress={save} style={[styles.saveButton, !canSave && styles.saveDisabled]}>
              {saving ? <ActivityIndicator color={colors.background} /> : <Ionicons name="checkmark" size={21} color={colors.background} />}
              <Text style={styles.saveText}>{saving ? 'Updating Homebase…' : 'Save meal change'}</Text>
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  safeArea: { flex: 1, backgroundColor: colors.background },
  header: { minHeight: 70, flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.border },
  closeButton: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.surface },
  headerText: { flex: 1, alignItems: 'center' },
  eyebrow: { color: colors.emerald, fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  title: { color: colors.text, fontSize: 19, fontWeight: '800', marginTop: 2 },
  content: { padding: spacing.lg, paddingBottom: 28, gap: 24 },
  currentCard: { backgroundColor: colors.surfaceRaised, borderWidth: 1, borderColor: colors.border, borderRadius: radius.large, padding: spacing.md },
  currentLabel: { color: colors.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1, textTransform: 'uppercase' },
  currentMeal: { color: colors.text, fontSize: 21, lineHeight: 27, fontWeight: '800', marginTop: 7 },
  section: { gap: 11 },
  sectionLabel: { color: colors.text, fontSize: 16, fontWeight: '800' },
  helper: { color: colors.muted, fontSize: 13, lineHeight: 18, marginTop: -5 },
  quickRow: { flexDirection: 'row', gap: 10 },
  quickButton: { flex: 1, minHeight: 58, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: radius.medium, borderWidth: 1 },
  leftoversButton: { backgroundColor: colors.emeraldSoft, borderColor: '#286B52' },
  takeoutButton: { backgroundColor: colors.goldSoft, borderColor: '#79602A' },
  quickEmoji: { fontSize: 18 },
  quickText: { color: colors.text, fontSize: 15, fontWeight: '800' },
  inputWrap: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 15, borderRadius: radius.medium, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  input: { flex: 1, color: colors.text, fontSize: 16, paddingVertical: 12 },
  options: { gap: 7 },
  option: { minHeight: 54, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 9, borderRadius: radius.medium, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  optionSelected: { borderColor: colors.emerald, backgroundColor: colors.emeraldSoft },
  optionText: { flex: 1 },
  optionName: { color: colors.text, fontSize: 14, fontWeight: '700' },
  optionNameSelected: { color: '#E8FFF5' },
  optionMeta: { color: colors.muted, fontSize: 11, marginTop: 3 },
  reasonWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  reason: { minHeight: 42, justifyContent: 'center', paddingHorizontal: 13, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface },
  reasonSelected: { borderColor: colors.gold, backgroundColor: colors.goldSoft },
  reasonText: { color: colors.muted, fontSize: 13, fontWeight: '700' },
  reasonTextSelected: { color: colors.gold },
  error: { color: '#FFC1B7', backgroundColor: '#311D1B', borderWidth: 1, borderColor: '#683830', borderRadius: radius.medium, padding: 12, fontSize: 13, lineHeight: 18 },
  footer: { padding: spacing.md, paddingBottom: spacing.lg, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.background },
  saveButton: { minHeight: 56, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, borderRadius: radius.medium, backgroundColor: colors.emerald },
  saveDisabled: { opacity: 0.42 },
  saveText: { color: colors.background, fontSize: 16, fontWeight: '900' },
});
