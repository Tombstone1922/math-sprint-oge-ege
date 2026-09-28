import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Button, Pill, Screen, type } from '../components';
import { useProgress } from '../progress';
import { colors } from '../theme';

export default function Result() {
  const { score } = useLocalSearchParams<{ score: string }>();
  const value = Math.max(0, Math.min(10, Number(score) || 0));
  const { progress } = useProgress();
  return <Screen>
    <View style={{ flex: 1, minHeight: 50 }} />
    <View style={styles.badge}><Text style={styles.badgeText}>✦</Text></View>
    <Text style={[type.eyebrow, { textAlign: 'center', marginTop: 26 }]}>ТРЕНИРОВКА ЗАВЕРШЕНА</Text>
    <Text style={[type.title, { textAlign: 'center', marginTop: 13 }]}>Хороший рывок!</Text>
    <Text style={[type.body, { textAlign: 'center', marginTop: 10 }]}>Первый шаг к быстрому счёту сделан. Регулярная практика закрепит приёмы.</Text>
    <View style={styles.scoreCard}><Pill tone="mint">ПРАВИЛЬНО С ПЕРВОЙ ПОПЫТКИ</Pill><Text style={styles.score}>{value}<Text style={styles.denominator}> / 10</Text></Text><Text style={styles.caption}>{value >= 8 ? 'Отличный результат!' : 'Повтори карточки и попробуй ещё раз.'}</Text></View>
    <Text style={styles.best}>Личный рекорд: {progress.best} из 10</Text>
    <View style={{ flex: 1, minHeight: 50 }} />
    <Button title="Ещё одна тренировка  ↻" onPress={() => router.replace('/guided')} />
    <Button title="К модулям" secondary onPress={() => router.dismissTo('/')} />
  </Screen>;
}
const styles = StyleSheet.create({ badge: { alignSelf: 'center', width: 90, height: 90, borderRadius: 30, backgroundColor: colors.amber, justifyContent: 'center', alignItems: 'center' }, badgeText: { fontSize: 52, color: colors.navy }, scoreCard: { backgroundColor: colors.white, marginTop: 32, borderRadius: 27, padding: 25, alignItems: 'center', borderWidth: 1, borderColor: colors.border }, score: { color: colors.navy, fontSize: 74, fontWeight: '900', marginTop: 12 }, denominator: { fontSize: 30, color: colors.muted }, caption: { color: colors.muted, fontSize: 15, marginTop: 4 }, best: { textAlign: 'center', color: colors.navy, fontWeight: '700', marginTop: 20 } });
