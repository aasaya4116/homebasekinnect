import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, RefreshControl, SafeAreaView, ScrollView, StyleSheet, Text, View } from 'react-native';

import { BrandMark, Card, CheckButton, ErrorBanner, LoadingView, Pill, SectionHeading, uiStyles } from '@/components/homebase-ui';
import { colors, radius } from '@/constants/theme';
import type { SchoolChildKey } from '@/lib/types';
import { useHomebase } from '@/providers/homebase-provider';

export default function KidsScreen() {
  const { school, loadingSchool, error, refreshSchool, toggleSchoolTask } = useHomebase();
  const [childKey, setChildKey] = useState<SchoolChildKey>('mekhi');
  const [saving, setSaving] = useState<string | null>(null);

  useEffect(() => { if (!school) refreshSchool(); }, [school, refreshSchool]);
  if (!school && loadingSchool) return <LoadingView label="Opening school updates…" />;

  const week = school?.weeks[childKey];
  const completed = new Set(school?.completedTaskIds || []);
  const actionableDates = week?.dates.filter((date) => date.task) || [];

  async function updateTask(taskId: string, done: boolean) {
    setSaving(taskId);
    try { await toggleSchoolTask(taskId, childKey, done); } finally { setSaving(null); }
  }

  return (
    <SafeAreaView style={uiStyles.screen}>
      <ScrollView contentContainerStyle={uiStyles.scrollContent} refreshControl={<RefreshControl refreshing={loadingSchool} onRefresh={refreshSchool} tintColor={colors.emerald} />}>
        <View style={styles.top}><BrandMark compact />{school?.pendingDraftCount ? <Pill label={`${school.pendingDraftCount} update pending`} tone="gold" /> : null}</View>
        <View style={uiStyles.pageHeader}>
          <Text style={styles.eyebrow}>School hub</Text>
          <Text style={uiStyles.pageTitle}>What the kids need next.</Text>
        </View>
        <View style={styles.segment}>
          {(['mekhi', 'khalil'] as const).map((key) => (
            <Pressable key={key} onPress={() => setChildKey(key)} style={[styles.segmentButton, childKey === key && styles.segmentActive]}>
              <Text style={[styles.segmentText, childKey === key && styles.segmentTextActive]}>{key === 'mekhi' ? 'Mekhi' : 'Khalil'}</Text>
            </Pressable>
          ))}
        </View>
        <ErrorBanner message={error} />

        {week ? (
          <>
            <Card style={styles.teacherCard}>
              <View style={[styles.avatar, { backgroundColor: childKey === 'mekhi' ? '#172D4D' : '#302349' }]}><Text style={[styles.avatarText, { color: childKey === 'mekhi' ? colors.blue : colors.purple }]}>{week.teacher.initials}</Text></View>
              <View style={{ flex: 1 }}><Text style={styles.teacherName}>{week.teacher.name}</Text><Text style={uiStyles.muted}>{week.meta}</Text></View>
            </Card>

            <SectionHeading eyebrow="Due next" title={actionableDates.length ? `${actionableDates.length} things to handle` : 'Nothing waiting'} />
            {actionableDates.length ? <Card style={styles.listCard}>
              {actionableDates.map((date, index) => {
                const task = date.task!;
                const isDone = completed.has(task.id);
                return (
                  <Pressable key={task.id} accessibilityRole="checkbox" accessibilityState={{ checked: isDone, disabled: saving === task.id }} disabled={saving === task.id} onPress={() => updateTask(task.id, !isDone)} style={[styles.taskRow, index > 0 && styles.divider]}>
                    <View style={styles.dateBadge}><Text style={styles.dateMonth}>{date.month}</Text><Text style={styles.dateDay}>{date.day}</Text></View>
                    <View style={{ flex: 1 }}><Text style={[styles.taskTitle, isDone && styles.done]}>{task.actionTitle}</Text><Text style={uiStyles.muted}>{task.dueLabel} · {task.actionNote}</Text></View>
                    <CheckButton checked={isDone} disabled={saving === task.id} />
                  </Pressable>
                );
              })}
            </Card> : null}

            <SectionHeading eyebrow="This week" title="Learning overview" />
            {week.subjects.map((subject) => (
              <Card key={subject.name} style={styles.subjectCard}>
                <View style={styles.subjectIcon}><Ionicons name="book-outline" size={18} color={colors.emerald} /></View>
                <View style={{ flex: 1 }}><Text style={styles.subjectName}>{subject.name}</Text>{subject.points.map((point) => <Text key={point} style={styles.point}>•  {point}</Text>)}</View>
              </Card>
            ))}

            <SectionHeading eyebrow="Dates" title="Important dates" />
            <Card style={styles.listCard}>
              {week.dates.map((date, index) => (
                <View key={`${date.month}-${date.day}-${date.title}`} style={[styles.dateRow, index > 0 && styles.divider]}>
                  <View style={styles.dateBadge}><Text style={styles.dateMonth}>{date.month}</Text><Text style={styles.dateDay}>{date.day}</Text></View>
                  <View style={{ flex: 1 }}><Text style={styles.taskTitle}>{date.title}</Text><Text style={uiStyles.muted}>{date.detail}</Text></View>
                  {date.schoolClosed ? <Ionicons name="school-outline" size={20} color={colors.danger} /> : null}
                </View>
              ))}
            </Card>
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  top: { paddingTop: 6, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eyebrow: { color: colors.emerald, fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 1.3 },
  segment: { flexDirection: 'row', padding: 4, borderRadius: radius.medium, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  segmentButton: { flex: 1, height: 42, alignItems: 'center', justifyContent: 'center', borderRadius: 13 },
  segmentActive: { backgroundColor: colors.emerald },
  segmentText: { color: colors.muted, fontWeight: '700' },
  segmentTextActive: { color: colors.background },
  teacherCard: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  avatar: { width: 50, height: 50, borderRadius: 17, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '800' },
  teacherName: { color: colors.text, fontSize: 17, fontWeight: '800', marginBottom: 3 },
  listCard: { paddingVertical: 4 },
  taskRow: { flexDirection: 'row', gap: 12, alignItems: 'center', minHeight: 84, paddingVertical: 11 },
  divider: { borderTopWidth: 1, borderTopColor: colors.border },
  dateBadge: { width: 45, minHeight: 50, borderRadius: 13, backgroundColor: colors.surfaceRaised, alignItems: 'center', justifyContent: 'center' },
  dateMonth: { color: colors.emerald, fontSize: 10, fontWeight: '800', textTransform: 'uppercase' },
  dateDay: { color: colors.text, fontSize: 20, fontWeight: '800' },
  taskTitle: { color: colors.text, fontSize: 15, lineHeight: 20, fontWeight: '700', marginBottom: 3 },
  done: { color: colors.muted, textDecorationLine: 'line-through' },
  subjectCard: { flexDirection: 'row', gap: 12 },
  subjectIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: colors.emeraldSoft, alignItems: 'center', justifyContent: 'center' },
  subjectName: { color: colors.text, fontSize: 16, fontWeight: '800', marginBottom: 7 },
  point: { color: '#C6D2CD', fontSize: 13, lineHeight: 19, marginBottom: 3 },
  dateRow: { flexDirection: 'row', gap: 12, alignItems: 'center', minHeight: 74, paddingVertical: 10 },
});
