import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { ImageBackground, Pressable, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BrandMark, Card, CheckButton, ErrorBanner, LoadingView, Pill, SectionHeading, uiStyles } from '@/components/homebase-ui';
import { MealEditor, type MealEditorTarget } from '@/components/meal-editor';
import { colors, radius, spacing } from '@/constants/theme';
import type { MealChangeRequest } from '@/lib/types';
import { useHomebase } from '@/providers/homebase-provider';

function money(value: number) {
  return value < 1 && value > 0 ? `${Math.round(value * 100)}¢` : `$${value.toFixed(2).replace('.00', '')}`;
}

export default function TodayScreen() {
  const { overview, loadingOverview, error, refreshOverview, toggleChore, changeMeal } = useHomebase();
  const [saving, setSaving] = useState<string | null>(null);
  const [editingMeal, setEditingMeal] = useState<MealEditorTarget | null>(null);
  const [savingMeal, setSavingMeal] = useState(false);

  useEffect(() => { if (!overview) refreshOverview(); }, [overview, refreshOverview]);

  async function updateChore(choreId: string, kid: string, done: boolean) {
    setSaving(choreId);
    try { await toggleChore(choreId, kid, done); } finally { setSaving(null); }
  }

  async function saveMeal(meal: MealChangeRequest) {
    setSavingMeal(true);
    try { await changeMeal(meal); } finally { setSavingMeal(false); }
  }

  if (!overview && loadingOverview) return <LoadingView />;

  const today = overview?.days[0];
  const dateLabel = today
    ? new Intl.DateTimeFormat('en-US', { weekday: 'long', month: 'long', day: 'numeric' }).format(new Date(`${today.date}T12:00:00`))
    : 'Today';
  const totalDone = overview?.chores.reduce((sum, board) => sum + board.doneCount, 0) || 0;
  const totalChores = overview?.chores.reduce((sum, board) => sum + board.totalScheduled, 0) || 0;

  return (
    <SafeAreaView style={uiStyles.screen}>
      <ScrollView
        contentContainerStyle={uiStyles.scrollContent}
        refreshControl={<RefreshControl refreshing={loadingOverview} onRefresh={refreshOverview} tintColor={colors.emerald} />}
      >
        <View style={styles.top}><BrandMark compact /><Ionicons name="notifications-outline" size={22} color={colors.muted} /></View>
        <View style={uiStyles.pageHeader}>
          <Text style={styles.date}>{dateLabel}</Text>
          <Text style={uiStyles.pageTitle}>Here&apos;s the family pulse.</Text>
        </View>
        <ErrorBanner message={error} />

        {today?.dinner ? (
          <ImageBackground source={{ uri: today.dinner.image }} style={styles.hero} imageStyle={styles.heroImage}>
            <View style={styles.heroOverlay}>
              <View style={styles.heroTop}>
                <Pill label="Tonight's dinner" tone="gold" />
                <View style={styles.heroActions}>
                  <Pill label={`${today.cook} cooks`} />
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`Change dinner from ${today.dinner.name}`}
                    onPress={() => setEditingMeal({ date: today.date, mealType: 'Dinner', currentMeal: today.dinner?.name || '' })}
                    style={styles.changeButton}
                  >
                    <Ionicons name="pencil" size={14} color={colors.background} />
                    <Text style={styles.changeButtonText}>Change</Text>
                  </Pressable>
                </View>
              </View>
              <View>
                <Text style={styles.heroTitle}>{today.dinner.name}</Text>
                {today.dinner.prepTime ? <Text style={styles.heroMeta}>{today.dinner.prepTime}</Text> : null}
              </View>
            </View>
          </ImageBackground>
        ) : (
          <Card style={styles.emptyHero}>
            <Ionicons name="restaurant-outline" size={30} color={colors.gold} />
            <Text style={styles.emptyTitle}>No dinner planned</Text>
            {today ? (
              <Pressable onPress={() => setEditingMeal({ date: today.date, mealType: 'Dinner', currentMeal: '' })} style={styles.addMealButton}>
                <Ionicons name="add" size={17} color={colors.background} /><Text style={styles.changeButtonText}>Add dinner</Text>
              </Pressable>
            ) : null}
          </Card>
        )}

        <View style={styles.grid}>
          <Card style={styles.halfCard}>
            <View style={styles.cardHeader}>
              <Ionicons name="fast-food-outline" size={22} color={colors.emerald} />
              {today ? (
                <Pressable accessibilityRole="button" accessibilityLabel="Change lunch" hitSlop={8} onPress={() => setEditingMeal({ date: today.date, mealType: 'Lunch', currentMeal: today.lunch?.name || '' })}>
                  <Ionicons name="pencil-outline" size={18} color={colors.emerald} />
                </Pressable>
              ) : null}
            </View>
            <Text style={styles.cardLabel}>Lunch</Text>
            <Text style={styles.cardValue}>{today?.lunch?.name || 'Not scheduled'}</Text>
          </Card>
          <Card style={styles.halfCard}>
            <Ionicons name="checkmark-done-outline" size={22} color={colors.gold} />
            <Text style={styles.cardLabel}>Chores</Text>
            <Text style={styles.cardValue}>{totalChores ? `${totalDone} of ${totalChores} done` : 'Nothing due'}</Text>
          </Card>
        </View>

        <SectionHeading eyebrow="On the calendar" title={today?.events.length ? `${today.events.length} things today` : 'A quiet day'} />
        <Card style={styles.listCard}>
          {today?.events.length ? today.events.map((event, index) => (
            <View key={event.id} style={[styles.eventRow, index > 0 && styles.divider]}>
              <View style={[styles.personDot, { backgroundColor: event.person.toLowerCase() === 'mekhi' ? colors.blue : event.person.toLowerCase() === 'khalil' ? colors.purple : colors.emerald }]} />
              <View style={{ flex: 1 }}><Text style={styles.rowTitle}>{event.title}</Text><Text style={uiStyles.muted}>{event.person}{event.location ? ` · ${event.location}` : ''}</Text></View>
              <Text style={styles.eventTime}>{event.time}</Text>
            </View>
          )) : <View style={styles.emptyRow}><Ionicons name="sparkles-outline" size={20} color={colors.emerald} /><Text style={uiStyles.body}>Nothing scheduled today.</Text></View>}
        </Card>

        <SectionHeading eyebrow="Allowance" title="Today’s chores" action={totalChores ? <Pill label={`${totalDone}/${totalChores}`} tone="gold" /> : undefined} />
        {overview?.chores.map((board) => (
          <Card key={board.kid} style={styles.listCard}>
            <View style={styles.boardHeader}>
              <View><Text style={styles.boardKid}>{board.kid}</Text><Text style={uiStyles.muted}>{money(board.earnedWeek)} earned this week</Text></View>
              <Pill label={`${money(board.balance)} banked`} tone={board.kid.toLowerCase() === 'mekhi' ? 'blue' : 'purple'} />
            </View>
            {board.scheduled.map((chore, index) => (
              <Pressable key={chore.id} accessibilityRole="checkbox" accessibilityState={{ checked: chore.done, disabled: saving === chore.id }} disabled={saving === chore.id} onPress={() => updateChore(chore.id, board.kid, !chore.done)} style={[styles.choreRow, index > 0 && styles.divider]}>
                <Text style={styles.emoji}>{chore.emoji || '✓'}</Text>
                <View style={{ flex: 1 }}><Text style={[styles.rowTitle, chore.done && styles.done]}>{chore.name}</Text><Text style={uiStyles.muted}>{chore.slot} · {money(chore.allowance)}</Text></View>
                <CheckButton checked={chore.done} disabled={saving === chore.id} />
              </Pressable>
            ))}
            {!board.scheduled.length ? <Text style={uiStyles.muted}>No scheduled chores today.</Text> : null}
          </Card>
        ))}
      </ScrollView>
      <MealEditor
        target={editingMeal}
        options={overview?.mealOptions || []}
        saving={savingMeal}
        onClose={() => !savingMeal && setEditingMeal(null)}
        onSave={saveMeal}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 6 },
  date: { color: colors.emerald, textTransform: 'uppercase', letterSpacing: 1.3, fontSize: 12, fontWeight: '800' },
  hero: { height: 270, borderRadius: radius.large, overflow: 'hidden', backgroundColor: colors.surface },
  heroImage: { borderRadius: radius.large },
  heroOverlay: { flex: 1, justifyContent: 'space-between', padding: spacing.md, backgroundColor: 'rgba(0,0,0,0.46)' },
  heroTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heroActions: { alignItems: 'flex-end', gap: 8 },
  changeButton: { minHeight: 36, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, borderRadius: radius.pill, backgroundColor: colors.emerald },
  changeButtonText: { color: colors.background, fontSize: 12, fontWeight: '900' },
  heroTitle: { color: colors.white, fontSize: 31, lineHeight: 35, fontWeight: '800', letterSpacing: -1, textShadowColor: 'rgba(0,0,0,0.6)', textShadowRadius: 10 },
  heroMeta: { color: '#DCE8E2', fontSize: 14, marginTop: 6 },
  emptyHero: { minHeight: 150, justifyContent: 'center', alignItems: 'center', gap: 10 },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  addMealButton: { minHeight: 42, flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 16, borderRadius: radius.pill, backgroundColor: colors.emerald },
  grid: { flexDirection: 'row', gap: 12 },
  halfCard: { flex: 1, minHeight: 128, gap: 8 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardLabel: { color: colors.muted, fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.7 },
  cardValue: { color: colors.text, fontSize: 16, lineHeight: 21, fontWeight: '700' },
  listCard: { paddingVertical: 6 },
  eventRow: { minHeight: 67, flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 12 },
  divider: { borderTopWidth: 1, borderTopColor: colors.border },
  personDot: { width: 9, height: 35, borderRadius: 5 },
  rowTitle: { color: colors.text, fontSize: 15, lineHeight: 20, fontWeight: '700' },
  eventTime: { color: colors.gold, fontSize: 12, fontWeight: '700', maxWidth: 72, textAlign: 'right' },
  emptyRow: { minHeight: 72, flexDirection: 'row', gap: 10, alignItems: 'center' },
  boardHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  boardKid: { color: colors.text, fontSize: 19, fontWeight: '800' },
  choreRow: { minHeight: 68, flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 10 },
  emoji: { fontSize: 23, width: 30, textAlign: 'center' },
  done: { textDecorationLine: 'line-through', color: colors.muted },
});
