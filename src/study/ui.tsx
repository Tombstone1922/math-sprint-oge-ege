import React from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Pill } from '../components';
import { WrittenFraction } from '../fraction-reference';
import { useProgress } from '../progress';
import { colors } from '../theme';
import { detectivePending } from './detective';

export const studyStyles = StyleSheet.create({ card: { padding: 19, marginTop: 16, backgroundColor: colors.white, borderRadius: 23, borderWidth: 1, borderColor: colors.border }, title: { color: colors.ink, fontSize: 20, lineHeight: 27, fontWeight: '800' }, body: { color: colors.muted, fontSize: 15, lineHeight: 23, marginTop: 9 }, small: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 7 }, row: { flexDirection: 'row', alignItems: 'center', gap: 10 }, input: { color: colors.ink, backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border, padding: 14, borderRadius: 15, marginTop: 12, fontSize: 17, lineHeight: 25 }, chip: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 14, paddingVertical: 9, borderWidth: 1, borderColor: colors.border, borderRadius: 25, backgroundColor: colors.white }, chipText: { color: colors.navy, fontSize: 13, fontWeight: '700' }, selected: { backgroundColor: colors.bluePale, borderColor: colors.blue }, option: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, padding: 15, borderRadius: 16, marginTop: 10, minHeight: 52 } });
export function MathLine({ value, size = 17, bold = false }: { value: string; size?: number; bold?: boolean }) {
  const parts = value.split(/([−-]?\d+\/\d+)/g);
  return <View accessible accessibilityLabel={value} style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', maxWidth: '100%', rowGap: 5 }}>
    {parts.map((part, i) => {
      const m = /^([−-]?\d+)\/(\d+)$/.exec(part);
      if (m) {
        const punctuation = /^[.,;:!?)]*/.exec(parts[i + 1] ?? '')?.[0] ?? '';
        if (punctuation) parts[i + 1] = parts[i + 1].slice(punctuation.length);
        return <View key={i} style={{ flexDirection: 'row', alignItems: 'center' }}><WrittenFraction n={Number(m[1].replace('−', '-'))} d={Number(m[2])} size={size * .9} />{punctuation ? <Text style={{ color: colors.ink, fontSize: size }}>{punctuation}</Text> : null}</View>;
      }
      return part ? <Text selectable key={i} style={{ flexShrink: 1, color: colors.ink, fontSize: size, lineHeight: size * 1.5, fontWeight: bold ? '700' : '400' }}>{part}</Text> : null;
    })}
  </View>;
}
export function StudySummary() {
  const { progress } = useProgress(), state = progress.study, stats = Object.values(state.detective.stats), attempts = stats.reduce((s, x) => s + x.attempts, 0), independent = stats.reduce((s, x) => s + x.independent, 0);
  return <View style={studyStyles.card}>
    <Pill tone="mint">УЧИСЬ И ПРОВЕРЯЙ СЕБЯ</Pill>
    <Button title={state.exam.current && !state.exam.current.finishedAt ? 'Продолжить пробный экзамен  →' : 'Пробный экзамен ОГЭ  →'} onPress={() => router.push('/exam-hub')} />
    <Text style={studyStyles.small}>10 готовых вариантов №1–25 · новая подборка каждую неделю.</Text>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 12 }}>{[{ title: 'Справочник формул', path: '/reference' }, { title: 'Найди ошибку', path: '/detective' }].map(item => <Pressable key={item.path} accessibilityRole="button" onPress={() => router.push(item.path as '/reference' | '/detective')} style={[studyStyles.chip, { flexGrow: 1 }]}><Text style={[studyStyles.chipText, { textAlign: 'center' }]}>{item.title}  ↗</Text></Pressable>)}</View>
    {attempts > 0 && <Text style={studyStyles.small}>«Найди ошибку»: {independent}/{attempts} самостоятельно · на повторение: {detectivePending(state.detective).length}. Эта статистика считается отдельно.</Text>}
  </View>;
}
