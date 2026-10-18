import React from 'react';
import { router } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Back, Button, Pill, Screen, type } from '../components';
import { localDay } from '../daily-model';
import { clockText } from '../daily-clock';
import { useProgress } from '../progress';
import { colors } from '../theme';

export default function Daily() {
  const { progress, dailyStart } = useProgress(), s = progress.daily.current;
  const today = localDay(), active = s && !s.finishedAt, done = progress.daily.history.find(r => r.day === today);
  const latest = s?.finishedAt ? progress.daily.history.find(r => r.id === s.id) : null;
  const result = done ?? latest;
  function start() { dailyStart(); router.push({ pathname: '/practice', params: { mode: 'daily' } }); }
  return <Screen>
    <Back label="К модулям" />
    <Pill tone="mint">ПОНЕМНОГУ КАЖДЫЙ ДЕНЬ</Pill>
    <Text style={[type.title, { marginTop: 20 }]}>Есть пять минут</Text>
    <Text style={[type.body, { marginTop: 10 }]}>Одна кнопка — и подборка готова. Разомнём счёт, вспомним знакомое и поработаем над ошибками.</Text>
    <View style={styles.hero}><Text style={styles.time}>5 <Text style={{ fontSize: 22 }}>минут для себя</Text></Text><Text style={styles.heroText}>До 8 коротких заданий. Это ориентир по времени: можно закончить раньше или спокойно дорешать.</Text></View>
    {active ? <View style={styles.card}>
      <Text style={type.section}>Продолжим с места остановки</Text>
      <Text style={styles.body}>Проверено: {s.answers.length} из {s.tasks.length} · время: {clockText(s.elapsedMs)}{s.day !== today ? `\nПодборка за ${s.day}. Сначала завершим её.` : ''}</Text>
      <Button title="Продолжить тренировку  →" onPress={() => router.push({ pathname: '/practice', params: { mode: 'daily' } })} />
    </View> : <>
      {result && <View style={[styles.card, { backgroundColor: colors.mint }]}>
        <Text style={type.section}>{done ? 'Сегодня уже позанимались ✓' : 'Последняя тренировка'}</Text>
        <Text style={styles.result}>{result.independent}<Text style={{ fontSize: 22 }}> / {result.answered}</Text></Text>
        <Text style={styles.body}>Верно самостоятельно · с помощью: {result.assisted} · ошибок: {result.answered - result.independent - result.assisted}</Text>
        <Text style={styles.body}>Время: {clockText(result.elapsedMs)}. Нерешённые задания не считаются ошибками.</Text>
      </View>}
      {!done && <Button title="Начать пять минут  →" onPress={start} />}
      {done && <Text style={styles.body}>Новая ежедневная подборка появится завтра. Сейчас можно повторить ошибки или выбрать любую тему.</Text>}
    </>}
    <View style={styles.card}>
      <Text style={type.section}>Что внутри</Text>
      <Text style={styles.item}>01  ·  Три примера для разминки</Text><Text style={styles.body}>Сложность счёта зависит от твоих результатов.</Text>
      <Text style={styles.item}>02  ·  Повторение знакомых тем</Text><Text style={styles.body}>Берём задачи, которые ты уже пробовал. Если ты только начал — предложим основы.</Text>
      <Text style={styles.item}>03  ·  До двух прошлых ошибок</Text><Text style={styles.body}>Только те, которым подошёл срок. Если таких нет — добавим повторение.</Text>
    </View>
    <Button title="Мой прогресс" secondary onPress={() => router.push('/progress')} />
    <Button title="Повторить ошибки" secondary onPress={() => router.push('/review')} />
  </Screen>;
}
const styles = StyleSheet.create({ hero: { backgroundColor: colors.navy, borderRadius: 25, padding: 22, marginTop: 24 }, time: { color: colors.white, fontSize: 56, fontWeight: '800' }, heroText: { color: '#DAE5F7', fontSize: 15, lineHeight: 23, marginTop: 10 }, card: { backgroundColor: colors.white, borderRadius: 22, borderWidth: 1, borderColor: colors.border, padding: 20, marginTop: 20 }, body: { color: colors.muted, fontSize: 14, lineHeight: 22, marginTop: 9 }, item: { color: colors.navy, fontSize: 16, fontWeight: '700', marginTop: 20 }, result: { fontSize: 48, fontWeight: '800', color: colors.navy, marginTop: 12 } });
