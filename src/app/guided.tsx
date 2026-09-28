import React, { useState } from 'react';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Back, Button, Pill, ProgressBar, Screen, type } from '../components';
import { guided } from '../engine';
import { colors } from '../theme';

export default function Guided() {
  const [index, setIndex] = useState(0);
  const problem = guided[index];
  return <Screen>
    <Back label="К уроку" />
    <View style={styles.row}><Text style={type.eyebrow}>КАРТОЧКИ С ОТВЕТОМ</Text><Text style={styles.count}>{index + 1} / {guided.length}</Text></View>
    <ProgressBar current={index + 1} total={guided.length} />
    <Text style={[type.title, { marginTop: 31 }]}>Смотри и запоминай</Text>
    <Text style={[type.body, { marginTop: 10 }]}>Представь ответ, а потом посмотри, какой приём сработал.</Text>
    <View style={styles.card}>
      <Pill tone="amber">ПРИМЕР {index + 1}</Pill>
      <Text style={styles.expression}>{problem.expression}</Text>
      <Text style={styles.hint}>{problem.hint}</Text>
      <View style={styles.answer}><Text style={styles.answerText}>= {problem.answer}</Text></View>
    </View>
    <View style={{ flex: 1, minHeight: 25 }} />
    <Button title={index === guided.length - 1 ? 'Теперь решаю сам  →' : 'Следующая карточка  →'} onPress={() => index === guided.length - 1 ? router.replace('/practice') : setIndex(index + 1)} />
  </Screen>;
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 13, alignItems: 'center' }, count: { fontWeight: '800', color: colors.muted }, card: { marginTop: 30, backgroundColor: colors.white, borderRadius: 28, padding: 26, minHeight: 295, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.border }, expression: { fontSize: 45, fontWeight: '800', color: colors.ink, marginTop: 30 }, hint: { fontSize: 18, color: colors.muted, marginTop: 16 }, answer: { backgroundColor: colors.mint, paddingVertical: 12, paddingHorizontal: 26, borderRadius: 17, marginTop: 22 }, answerText: { color: colors.green, fontSize: 30, fontWeight: '800' } });
