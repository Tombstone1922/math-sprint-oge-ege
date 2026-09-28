import React, { useMemo, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Back, Button, Pill, ProgressBar, Screen, problemCard, type } from '../components';
import { getModule, type ModuleId } from '../content';
import { makeRound, ROUND_SIZE } from '../engine';
import { colors } from '../theme';

export default function Guided() {
  const { module: requested } = useLocalSearchParams<{ module?: string }>();
  const selected = getModule(requested);
  return <GuidedContent key={selected.id} moduleId={selected.id} />;
}

function GuidedContent({ moduleId }: { moduleId: ModuleId }) {
  const round = useMemo(() => makeRound(moduleId), [moduleId]);
  const [index, setIndex] = useState(0);
  const problem = round[index];
  return <Screen>
    <Back label="К уроку" />
    <View style={styles.row}><Text style={type.eyebrow}>КАРТОЧКИ С ОТВЕТОМ</Text><Text style={styles.count}>{index + 1} / {ROUND_SIZE}</Text></View>
    <ProgressBar current={index + 1} total={ROUND_SIZE} />
    <Text style={[type.title, { marginTop: 31 }]}>Смотри и запоминай</Text>
    <Text style={[type.body, { marginTop: 10 }]}>Сначала просмотри десять примеров с ответами. Затем реши эти же примеры сам в другом порядке.</Text>
    <View style={problemCard}>
      <Pill tone="amber">ПРИМЕР {index + 1}</Pill>
      <Text style={styles.expression}>{problem.expression}</Text>
      <Text style={styles.hint}>{problem.hint}</Text>
      <View style={styles.answer}><Text style={styles.answerText}>= {problem.answer}</Text></View>
    </View>
    <View style={{ flex: 1, minHeight: 25 }} />
    <Button title={index === ROUND_SIZE - 1 ? 'Теперь решаю сам  →' : 'Следующая карточка  →'} onPress={() => index === ROUND_SIZE - 1 ? router.replace({ pathname: '/practice', params: { module: moduleId, ids: round.map(item => item.id).join(',') } }) : setIndex(index + 1)} />
  </Screen>;
}
const styles = StyleSheet.create({ row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 13, alignItems: 'center' }, count: { fontWeight: '800', color: colors.muted }, expression: { fontSize: 30, lineHeight: 38, textAlign: 'center', fontWeight: '800', color: colors.ink, marginTop: 30 }, hint: { fontSize: 17, textAlign: 'center', color: colors.muted, marginTop: 16 }, answer: { backgroundColor: colors.mint, paddingVertical: 12, paddingHorizontal: 26, borderRadius: 17, marginTop: 22 }, answerText: { color: colors.green, fontSize: 30, fontWeight: '800' } });
