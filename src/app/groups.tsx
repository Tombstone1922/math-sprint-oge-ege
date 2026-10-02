import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Back, Pill, Screen, type } from '../components';
import { getModule } from '../content';
import { GROUP_COUNT, GROUP_SIZE, ROUND_SIZE } from '../engine';
import { cardPalette, colors } from '../theme';
import { topicGroupNames } from '../module-groups';

export default function Groups() {
  const { module: requested } = useLocalSearchParams<{ module?: string }>();
  const selected = getModule(requested);
  const groupNames = topicGroupNames[selected.id];
  return <Screen>
    <Back label="К уроку" />
    <Pill tone="mint">{selected.title.toUpperCase()}</Pill>
    <Text style={[type.title, { marginTop: 18 }]}>Выбери группу</Text>
    <Text style={[type.body, { marginTop: 10, marginBottom: 18 }]}>{selected.numbers === '№1–5' ? '40 вариантов: 10 групп по 4 блока (20 вопросов). За тренировку — 2 случайных блока, сначала с решениями, затем без ответов. Внутри блока сохраняется порядок №1–5.' : '200 задач: 10 групп по 20. За тренировку увидишь 10 случайных задач выбранной группы сначала с ответами, затем без них.'}</Text>
    {Array.from({ length: GROUP_COUNT }, (_, index) => <Pressable key={index} accessibilityRole="button" accessibilityLabel={`${groupNames?.[index] ?? `Группа ${index + 1}`}, ${GROUP_SIZE} задач`} onPress={() => router.push({ pathname: '/guided', params: { module: selected.id, group: String(index + 1) } })} style={styles.group}>
      <View style={[styles.icon, { backgroundColor: cardPalette[index] }]}><Text style={styles.number}>{index + 1}</Text></View>
      <View style={styles.info}><Text style={styles.name}>{groupNames?.[index] ?? `Группа ${index + 1}`}</Text><Text style={styles.details}>{GROUP_SIZE} задач · {ROUND_SIZE} за тренировку</Text></View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>)}
  </Screen>;
}

const styles = StyleSheet.create({ group: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14, marginBottom: 10, backgroundColor: colors.white, borderRadius: 20, borderWidth: 1, borderColor: colors.border }, icon: { width: 50, height: 50, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }, number: { fontSize: 19, fontWeight: '800', color: colors.navy }, info: { flex: 1 }, name: { fontSize: 16, fontWeight: '800', color: colors.ink }, details: { fontSize: 12, color: colors.muted, marginTop: 4 }, chevron: { fontSize: 24, color: colors.muted } });
