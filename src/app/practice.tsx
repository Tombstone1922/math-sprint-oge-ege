import React, { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Back, Button, Pill, ProgressBar, Screen, type } from '../components';
import { checkAnswer, makeRound, Problem } from '../engine';
import { useProgress } from '../progress';
import { colors } from '../theme';

type Feedback = { correct: boolean; answer: number; hint: string };

export default function Practice() {
  const initial = useMemo(() => makeRound(), []);
  const [queue, setQueue] = useState<Problem[]>(initial);
  const [position, setPosition] = useState(0);
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [firstTryScore, setFirstTryScore] = useState(0);
  const [retried, setRetried] = useState<string[]>([]);
  const { record } = useProgress();
  const problem = queue[position];

  function pressKey(key: string) {
    if (feedback) return;
    if (key === '⌫') setInput(value => value.slice(0, -1));
    else if (key === '−') setInput(value => value.startsWith('-') ? value.slice(1) : '-' + value);
    else setInput(value => value.length < 5 ? value + key : value);
  }

  function submit() {
    if (!input || input === '-' || feedback) return;
    const correct = checkAnswer(input, problem);
    if (correct && position < 10) setFirstTryScore(score => score + 1);
    if (!correct && !retried.includes(problem.id)) {
      setQueue(items => [...items, problem]);
      setRetried(items => [...items, problem.id]);
    }
    setFeedback({ correct, answer: problem.answer, hint: problem.hint });
  }

  function next() {
    if (position + 1 >= queue.length) {
      record(firstTryScore);
      router.replace({ pathname: '/result', params: { score: String(firstTryScore), total: '10' } });
    } else {
      setPosition(value => value + 1);
      setInput('');
      setFeedback(null);
    }
  }

  return <Screen>
    <Back label="К уроку" />
    <View style={styles.row}><Text style={type.eyebrow}>ТЕПЕРЬ ТВОЯ ОЧЕРЕДЬ</Text><Text style={styles.count}>{position + 1} / {queue.length}</Text></View>
    <ProgressBar current={position + 1} total={queue.length} />
    <Text style={[type.title, { marginTop: 20, fontSize: 27 }]}>Сколько получится?</Text>
    <Text style={[type.body, { fontSize: 14, marginTop: 4 }]}>Введи ответ. Ошибочные примеры вернутся в конце.</Text>
    <View style={styles.card}>
      <Pill tone={position >= 10 ? 'amber' : 'blue'}>{position >= 10 ? 'ПОВТОРЕНИЕ' : `ЗАДАНИЕ ${position + 1}`}</Pill>
      <Text style={styles.expression}>{problem.expression} = ?</Text>
      <View style={[styles.input, feedback && { borderColor: feedback.correct ? colors.green : colors.red }]}><Text style={[styles.inputText, !input && { color: '#AFBBC9' }]}>{input || 'Твой ответ'}</Text></View>
    </View>
    {feedback ? <View accessible accessibilityLiveRegion="polite" style={[styles.feedback, { backgroundColor: feedback.correct ? colors.mint : '#FCE9EA' }]}><Text style={[styles.feedbackTitle, { color: feedback.correct ? colors.green : colors.red }]}>{feedback.correct ? 'Верно! Отличная работа' : `Пока нет. Ответ: ${feedback.answer}`}</Text><Text style={styles.feedbackHint}>Удобный путь: {feedback.hint}</Text></View> : <View style={{ flex: 1 }} />}
    {!feedback && <View style={styles.keypad}>{['1', '2', '3', '4', '5', '6', '7', '8', '9', '−', '0', '⌫'].map(key => <Pressable accessibilityRole="button" accessibilityLabel={key === '⌫' ? 'Удалить' : key === '−' ? 'Минус' : key} key={key} onPress={() => pressKey(key)} style={({ pressed }) => [styles.key, pressed && { backgroundColor: colors.bluePale }]}><Text style={styles.keyText}>{key}</Text></Pressable>)}</View>}
    <Button title={feedback ? position + 1 >= queue.length ? 'Мой результат  →' : 'Дальше  →' : 'Проверить ответ'} disabled={!feedback && (!input || input === '-')} onPress={feedback ? next : submit} />
  </Screen>;
}

const styles = StyleSheet.create({ row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }, count: { color: colors.muted, fontWeight: '800' }, card: { marginTop: 19, backgroundColor: colors.white, borderRadius: 25, borderWidth: 1, borderColor: colors.border, padding: 18, alignItems: 'center' }, expression: { fontSize: 37, color: colors.ink, fontWeight: '800', marginVertical: 18 }, input: { width: '100%', minHeight: 56, borderWidth: 2, borderColor: colors.border, borderRadius: 15, justifyContent: 'center', alignItems: 'center' }, inputText: { fontSize: 22, color: colors.ink, fontWeight: '700' }, feedback: { marginTop: 16, padding: 17, borderRadius: 18, flex: 1, justifyContent: 'center' }, feedbackTitle: { fontSize: 18, fontWeight: '800' }, feedbackHint: { color: colors.ink, fontSize: 14, marginTop: 7 }, keypad: { flex: 1, minHeight: 196, marginTop: 15, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignContent: 'space-between' }, key: { width: '31.5%', height: '23%', minHeight: 39, borderRadius: 13, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, justifyContent: 'center', alignItems: 'center' }, keyText: { fontSize: 23, fontWeight: '700', color: colors.ink } });
