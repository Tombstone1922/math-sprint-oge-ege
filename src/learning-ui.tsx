import React, { useEffect, useState } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { ModuleId } from './content';
import { accuracy, pendingMistakes } from './learning-progress';
import { topicGroupNames } from './module-groups';
import { useProgress } from './progress';
import { colors } from './theme';

export const groupTitle = (moduleId: ModuleId, group: number) => topicGroupNames[moduleId]?.[group - 1] ?? `Группа ${group}`;
export const percentText = (n: number | null) => n === null ? '—' : `${n}%`;
export function useLearningClock() {
  const [now, setNow] = useState(Date.now);
  useEffect(() => { const timer = setInterval(() => setNow(Date.now()), 30000); return () => clearInterval(timer); }, []);
  return now;
}
export function reviewTime(at: number, now: number) {
  return at <= now ? 'Можно повторить сейчас' : new Date(at).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}
export function LearningBar({ percent }: { percent: number }) {
  return <View style={styles.track}><View style={[styles.fill, { width: `${Math.min(100, Math.max(0, percent))}%` }]} /></View>;
}
export function LearningSummary() {
  const { progress } = useProgress(), now = useLearningClock();
  const pending = pendingMistakes(progress), due = pending.filter(m => m.dueAt <= now);
  return <View style={styles.summary}>
    <Pressable accessibilityRole="button" accessibilityLabel="Мой прогресс" onPress={() => router.push('/progress')} style={styles.card}>
      <View style={styles.row}><Text style={styles.eyebrow}>МОЙ ПРОГРЕСС</Text><Text style={styles.arrow}>↗</Text></View>
      <Text style={styles.number}>{percentText(accuracy(progress.independent, progress.attempts))}<Text style={styles.unit}> без подсказок</Text></Text>
      <Text style={styles.caption}>{progress.attempts ? `Проверено ответов: ${progress.attempts}. Посмотри результаты по темам и группам.` : 'Решай самостоятельно — здесь появятся точность и пройденные группы.'}</Text>
    </Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel="Повторить ошибки" onPress={() => router.push('/review')} style={[styles.card, { backgroundColor: '#F1F5FC' }]}>
      <View style={styles.row}><Text style={styles.eyebrow}>ПОВТОРИТЬ ОШИБКИ</Text><Text style={styles.arrow}>↻</Text></View>
      <Text style={styles.number}>{due.length}<Text style={styles.unit}> к повторению сейчас</Text></Text>
      <Text style={styles.caption}>{pending.length ? `Всего на закреплении: ${pending.length}. ${due.length ? 'Короткая тренировка по твоим ошибкам.' : `Ближайший повтор: ${reviewTime(pending[0].dueAt, now)}.`}` : 'Ошибки и задачи с подсказками сохранятся автоматически.'}</Text>
    </Pressable>
  </View>;
}
const styles = StyleSheet.create({ summary: { gap: 10, marginTop: 18 }, card: { padding: 18, backgroundColor: colors.white, borderRadius: 20, borderWidth: 1, borderColor: colors.border }, row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }, eyebrow: { fontSize: 11, letterSpacing: 1, fontWeight: '800', color: colors.blue }, arrow: { fontSize: 23, color: colors.blue }, number: { fontSize: 29, color: colors.navy, fontWeight: '800', marginTop: 3 }, unit: { fontSize: 13, fontWeight: '600', color: colors.navy }, caption: { fontSize: 13, lineHeight: 19, color: colors.muted, marginTop: 5 }, track: { height: 6, backgroundColor: colors.border, borderRadius: 9, marginTop: 10, overflow: 'hidden' }, fill: { height: 6, backgroundColor: colors.blue, borderRadius: 9 } });
