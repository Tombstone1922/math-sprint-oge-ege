import React from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Disclosure } from '../components';
import { useProgress } from '../progress';
import { colors } from '../theme';
import { examResults, type ExamSession } from './exam';
import { weeklyDates, type WeeklyVariant } from './weekly';
import { studyStyles as s } from './ui';

export function WeeklyVariants({ variants, timed }: { variants: WeeklyVariant[]; timed: boolean }) {
  const { progress, study } = useProgress(), exam = progress.study.exam, active = exam.current && !exam.current.finishedAt;
  const sessions = [exam.current, ...exam.history].filter((v): v is ExamSession => Boolean(v));
  return <>
    <View style={{ marginTop: 24, marginBottom: 14 }}><Text style={s.title}>Варианты этой недели</Text><Text style={s.small}>{weeklyDates(variants[0].label.week)}</Text><Text style={s.small}>10 работ · обновление по понедельникам, 00:00 Саратов</Text></View>
    {variants.map(variant => {
      const session = sessions.find(e => e.weekly?.week === variant.label.week && e.weekly.number === variant.label.number && e.weekly.version === variant.label.version);
      const unfinished = session && !session.finishedAt, result = session?.finishedAt ? examResults(session) : null, disabled = Boolean(active) && !unfinished && !result;
      const start = () => { study({ area: 'exam', action: { type: 'start', timed, weekly: variant.label } }); router.push('/exam'); };
      const open = result ? () => router.push({ pathname: '/exam', params: { id: session!.id } }) : unfinished ? () => router.push('/exam') : start;
      return <View key={variant.id} style={[styles.card, unfinished && { borderColor: colors.blue, backgroundColor: colors.bluePale }]}>
        <Pressable accessibilityRole="button" accessibilityLabel={result ? `Разбор варианта ${variant.label.number}` : unfinished ? `Продолжить вариант ${variant.label.number}` : `Начать вариант ${variant.label.number}`} disabled={disabled} accessibilityState={{ disabled }} onPress={open} style={[styles.row, disabled && { opacity: .5 }]}>
          <View style={styles.badge}><Text style={styles.number}>{String(variant.label.number).padStart(2, '0')}</Text></View>
          <View style={{ flex: 1 }}><Text style={styles.name}>Вариант {variant.label.number}</Text><Text style={styles.caption}>№1–5: {variant.theme}</Text><Text style={[styles.status, { color: result ? colors.green : unfinished ? colors.blue : colors.muted }]}>{unfinished ? '◷ В процессе · продолжить' : result ? `✓ Решён · ${result.automatic}/19${result.total !== null ? ` · итог ${result.total}/31` : ''}` : '25 заданий · готов к решению'}</Text></View><Text style={styles.arrow}>›</Text>
        </Pressable>
        {result && <Pressable disabled={Boolean(active)} accessibilityRole="button" accessibilityLabel={`Решить вариант ${variant.label.number} ещё раз`} onPress={start} style={[styles.again, Boolean(active) && { opacity: .4 }]}><Text style={styles.againText}>Решить ещё раз →</Text></Pressable>}
      </View>;
    })}
    {active && <Text style={s.small}>Новая работа откроется после завершения сохранённой. При смене недели её задания и ответы сохранятся.</Text>}
    <Disclosure title="Как меняется недельная подборка"><Text style={s.body}>Варианты одинаковы для всех учеников всю неделю. Новая десятка появляется по понедельникам в 00:00 по Саратову (UTC+4). Начатые работы сохраняют свой состав.</Text></Disclosure>
    <Pressable disabled={Boolean(active)} accessibilityRole="button" accessibilityLabel="Начать новый случайный вариант" onPress={() => { study({ area: 'exam', action: { type: 'start', timed } }); router.push('/exam'); }} style={[styles.random, Boolean(active) && { opacity: .45 }]}><Text style={styles.name}>Дополнительный случайный вариант</Text><Text style={styles.caption}>Собрать ещё одну работу из базы  ↗</Text></Pressable>
  </>;
}
const styles = StyleSheet.create({ card: { borderWidth: 1, borderColor: colors.border, borderRadius: 18, backgroundColor: colors.white, marginBottom: 10 }, row: { padding: 15, flexDirection: 'row', alignItems: 'center', gap: 13, minHeight: 104 }, badge: { width: 42, height: 45, borderRadius: 13, backgroundColor: colors.bluePale, alignItems: 'center', justifyContent: 'center' }, number: { color: colors.blue, fontSize: 20, fontWeight: '800' }, name: { color: colors.ink, fontSize: 16, lineHeight: 23, fontWeight: '800' }, caption: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 3 }, status: { fontSize: 12, lineHeight: 19, marginTop: 5, fontWeight: '600' }, arrow: { color: colors.blue, fontSize: 23 }, again: { minHeight: 44, justifyContent: 'center', borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: 16, paddingVertical: 10 }, againText: { color: colors.blue, fontSize: 13, fontWeight: '700' }, random: { padding: 17, marginTop: 16, borderRadius: 18, backgroundColor: colors.bluePale } });
