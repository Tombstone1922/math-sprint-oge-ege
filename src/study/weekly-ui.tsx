import React from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Pill } from '../components';
import { useProgress } from '../progress';
import { colors } from '../theme';
import { examResults, type ExamSession } from './exam';
import { weeklyDates, type WeeklyVariant } from './weekly';
import { studyStyles as s } from './ui';

export function WeeklyVariants({ variants, timed }: { variants: WeeklyVariant[]; timed: boolean }) {
  const { progress, study } = useProgress(), exam = progress.study.exam, active = exam.current && !exam.current.finishedAt;
  const sessions = [exam.current, ...exam.history].filter((v): v is ExamSession => Boolean(v));
  return <>
    <View style={[s.card, { backgroundColor: colors.bluePale }]}><Pill>10 ГОТОВЫХ ВАРИАНТОВ</Pill><Text style={[s.title, { marginTop: 12 }]}>Варианты этой недели</Text><Text style={s.body}>{weeklyDates(variants[0].label.week)}</Text><Text style={s.small}>Во всех — задания №1–25. Подборка общая для всех учеников и остаётся одинаковой всю неделю. Новая — каждый понедельник в 00:00 по Саратову (UTC+4).</Text></View>
    <View style={styles.grid}>{variants.map(variant => {
      const session = sessions.find(e => e.weekly?.week === variant.label.week && e.weekly.number === variant.label.number && e.weekly.version === variant.label.version);
      const unfinished = session && !session.finishedAt, result = session?.finishedAt ? examResults(session) : null;
      const start = () => { study({ area: 'exam', action: { type: 'start', timed, weekly: variant.label } }); router.push('/exam'); };
      return <View key={variant.id} style={[styles.card, unfinished && { backgroundColor: colors.amber }]}>
        <Text style={styles.number}>{String(variant.label.number).padStart(2, '0')}</Text><Text style={styles.name}>Вариант {variant.label.number}</Text><Text style={[s.small, { minHeight: 37 }]}>№1–5: {variant.theme}</Text>
        <Text style={[s.small, { color: unfinished ? colors.navy : result ? colors.green : colors.muted }]}>{unfinished ? 'В процессе' : result ? `Решён · ${result.automatic}/19${result.total !== null ? ` · итог ${result.total}/31` : ''}` : 'Готов к решению · 25 заданий'}</Text>
        {result ? <><Pressable accessibilityRole="button" accessibilityLabel={`Разбор варианта ${variant.label.number}`} onPress={() => router.push({ pathname: '/exam', params: { id: session!.id } })} style={styles.primary}><Text style={styles.primaryText}>Разбор →</Text></Pressable><Pressable disabled={Boolean(active)} accessibilityRole="button" accessibilityLabel={`Решить вариант ${variant.label.number} ещё раз`} accessibilityState={{ disabled: Boolean(active) }} onPress={start} style={[styles.again, Boolean(active) && { opacity: .4 }]}><Text style={styles.againText}>Решить ещё раз</Text></Pressable></> : <Pressable accessibilityRole="button" accessibilityLabel={unfinished ? `Продолжить вариант ${variant.label.number}` : `Начать вариант ${variant.label.number}`} disabled={Boolean(active) && !unfinished} accessibilityState={{ disabled: Boolean(active) && !unfinished }} onPress={unfinished ? () => router.push('/exam') : start} style={[styles.primary, Boolean(active) && !unfinished && { opacity: .4 }]}><Text style={styles.primaryText}>{unfinished ? 'Продолжить →' : 'Решать →'}</Text></Pressable>}
      </View>;
    })}</View>
    {active && <Text style={s.small}>Сначала закончи сохранённую работу. При смене недели её задания и ответы сохранятся.</Text>}
    <View style={s.card}><Text style={s.title}>Ещё один случайный вариант</Text><Text style={s.body}>Можно собрать дополнительную работу из базы в любое время. Недельная десятка от этого не изменится.</Text><Button disabled={Boolean(active)} secondary title="Начать новый случайный вариант  →" onPress={() => { study({ area: 'exam', action: { type: 'start', timed } }); router.push('/exam'); }} /></View>
  </>;
}
const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 14 },
  card: { flexBasis: '46%', flexGrow: 1, padding: 14, borderWidth: 1, borderColor: colors.border, borderRadius: 20, backgroundColor: colors.white },
  number: { fontSize: 35, lineHeight: 42, color: colors.blue, fontWeight: '800' },
  name: { fontSize: 16, lineHeight: 23, color: colors.ink, fontWeight: '800', marginTop: 4 },
  primary: { backgroundColor: colors.blue, borderRadius: 12, minHeight: 48, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 5, marginTop: 13 },
  primaryText: { color: colors.white, fontSize: 13, lineHeight: 19, fontWeight: '800', textAlign: 'center' },
  again: { paddingVertical: 12, minHeight: 44, alignItems: 'center' },
  againText: { color: colors.blue, fontSize: 12, lineHeight: 18, fontWeight: '700', textAlign: 'center' },
});
