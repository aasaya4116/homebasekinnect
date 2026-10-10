import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BrandMark, Card, ErrorBanner, LoadingView, Pill, uiStyles } from '@/components/homebase-ui';
import { MealEditor, type MealEditorTarget } from '@/components/meal-editor';
import { colors, spacing } from '@/constants/theme';
import type { MealChangeRequest } from '@/lib/types';
import { useHomebase } from '@/providers/homebase-provider';

export default function WeekScreen() {
  const { overview, loadingOverview, error, refreshOverview, changeMeal } = useHomebase();
  const [editingMeal, setEditingMeal] = useState<MealEditorTarget | null>(null);
  const [savingMeal, setSavingMeal] = useState(false);
  useEffect(() => { if (!overview) refreshOverview(); }, [overview, refreshOverview]);
  if (!overview && loadingOverview) return <LoadingView label="Planning the week…" />;

  async function saveMeal(meal: MealChangeRequest) {
    setSavingMeal(true);
    try { await changeMeal(meal); } finally { setSavingMeal(false); }
  }

  return (
    <SafeAreaView style={uiStyles.screen}>
      <ScrollView contentContainerStyle={uiStyles.scrollContent} refreshControl={<RefreshControl refreshing={loadingOverview} onRefresh={refreshOverview} tintColor={colors.emerald} />}>
        <View style={styles.top}><BrandMark compact /></View>
        <View style={uiStyles.pageHeader}>
          <Text style={styles.eyebrow}>Seven-day view</Text>
          <Text style={uiStyles.pageTitle}>The week ahead.</Text>
          <Text style={uiStyles.pageSubtitle}>Dinner owners, school lunches, and the family calendar in one scroll.</Text>
        </View>
        <ErrorBanner message={error} />
        {overview?.days.map((day) => (
          <Card key={day.date} style={[styles.dayCard, day.isToday && styles.todayCard]}>
            <View style={styles.dateColumn}>
              <Text style={[styles.dayName, day.isToday && { color: colors.emerald }]}>{day.dayName}</Text>
              <Text style={styles.dayNumber}>{day.dayNumber}</Text>
              <Text style={styles.month}>{day.month}</Text>
            </View>
            <View style={styles.content}>
              <View style={styles.cardTop}>
                {day.isToday ? <Pill label="Today" /> : <View />}
                <Pill label={`${day.cook} cooks`} tone="gold" />
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Change ${day.dayName} dinner`}
                onPress={() => setEditingMeal({ date: day.date, mealType: 'Dinner', currentMeal: day.dinner?.name || '' })}
                style={({ pressed }) => [styles.mealRow, pressed && styles.mealPressed]}
              >
                <View style={styles.mealIcon}><Ionicons name="moon-outline" size={17} color={colors.gold} /></View>
                <View style={{ flex: 1 }}><Text style={styles.mealLabel}>Dinner</Text><Text style={styles.mealName}>{day.dinner?.name || 'Not scheduled'}</Text></View>
                <Ionicons name="pencil-outline" size={17} color={colors.gold} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Change ${day.dayName} lunch`}
                onPress={() => setEditingMeal({ date: day.date, mealType: 'Lunch', currentMeal: day.lunch?.name || '' })}
                style={({ pressed }) => [styles.mealRow, pressed && styles.mealPressed]}
              >
                <View style={styles.mealIcon}><Ionicons name="sunny-outline" size={17} color={colors.emerald} /></View>
                <View style={{ flex: 1 }}><Text style={styles.mealLabel}>Lunch</Text><Text style={styles.lunchName}>{day.lunch?.name || 'Not scheduled'}</Text></View>
                <Ionicons name="pencil-outline" size={17} color={colors.emerald} />
              </Pressable>
              {day.events.length ? (
                <View style={styles.events}>
                  {day.events.slice(0, 3).map((event) => <Text key={event.id} style={styles.event} numberOfLines={1}>{event.time === 'All Day' ? 'All day' : event.time} · {event.title}{event.person !== 'Family' ? ` — ${event.person}` : ''}</Text>)}
                  {day.events.length > 3 ? <Text style={styles.more}>+{day.events.length - 3} more</Text> : null}
                </View>
              ) : <Text style={styles.free}>No calendar events</Text>}
            </View>
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
  top: { paddingTop: 6 },
  eyebrow: { color: colors.emerald, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.3 },
  dayCard: { flexDirection: 'row', padding: 0, overflow: 'hidden' },
  todayCard: { borderColor: colors.emerald },
  dateColumn: { width: 74, alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.md, backgroundColor: colors.surfaceRaised },
  dayName: { color: colors.muted, textTransform: 'uppercase', fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  dayNumber: { color: colors.text, fontSize: 31, lineHeight: 36, fontWeight: '800' },
  month: { color: colors.muted, fontSize: 12 },
  content: { flex: 1, gap: 12, padding: spacing.md },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between' },
  mealRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  mealPressed: { opacity: 0.62 },
  mealIcon: { width: 30, height: 30, borderRadius: 10, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  mealLabel: { color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.8, fontSize: 10, fontWeight: '800' },
  mealName: { color: colors.text, fontSize: 16, lineHeight: 20, fontWeight: '700', marginTop: 2 },
  lunchName: { color: colors.text, fontSize: 14, lineHeight: 19, fontWeight: '600', marginTop: 2 },
  events: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, gap: 5 },
  event: { color: '#C8D6D0', fontSize: 12, lineHeight: 17 },
  more: { color: colors.emerald, fontSize: 11, fontWeight: '700' },
  free: { color: colors.muted, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 10, fontSize: 12 },
});
