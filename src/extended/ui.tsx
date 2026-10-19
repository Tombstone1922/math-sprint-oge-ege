import React from 'react';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Pill, type } from '../components';
import { useProgress } from '../progress';
import { colors } from '../theme';
import { extendedPending } from './progress';
import { ws } from '../workbook/ui';

export function ExtendedSummary() {
  const { progress } = useProgress(), state = progress.extended, stats = Object.values(state.stats), attempts = stats.reduce((s, x) => s + x.attempts, 0), self = stats.reduce((s, x) => s + x.self, 0);
  return <View style={extendedStyles.card}>
    <Pill tone="amber">ОГЭ · ВТОРАЯ ЧАСТЬ</Pill>
    <Text style={[type.section, { marginTop: 12 }]}>От идеи до полного решения</Text>
    <Text style={extendedStyles.body}>№20–25 · 1200 заданий · рисунки и разбор по шагам. Решай на бумаге или в черновике приложения.</Text>
    {attempts > 0 && <Text style={extendedStyles.body}>По самооценке: {self} самостоятельных решений из {attempts} разборов. На закреплении: {extendedPending(state).length}.</Text>}
    <Button title={state.active ? 'Продолжить вторую часть  →' : 'Открыть вторую часть  →'} onPress={() => router.push(state.active ? '/extended-practice' : '/extended')} />
    <Text accessibilityRole="button" onPress={() => router.push('/workbook')} style={[ws.link, { paddingVertical: 12 }]}>Рабочая тетрадь · {Object.keys(progress.workbook.pages).length} работ  ↗</Text>
    <Text style={extendedStyles.small}>Самопроверка по образцу. Полноту доказательства оцениваешь ты или преподаватель.</Text>
  </View>;
}
export const extendedStyles = StyleSheet.create({
  card: { padding: 20, backgroundColor: colors.white, borderRadius: 23, borderWidth: 1, borderColor: colors.border, marginTop: 16 },
  body: { color: colors.muted, fontSize: 15, lineHeight: 23, marginTop: 10 },
  small: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 10 },
  heading: { color: colors.ink, fontSize: 19, lineHeight: 25, fontWeight: '800' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  badge: { color: colors.blue, fontSize: 26, fontWeight: '800', minWidth: 48 },
  link: { color: colors.blue, fontSize: 14, fontWeight: '700', lineHeight: 21 },
});
