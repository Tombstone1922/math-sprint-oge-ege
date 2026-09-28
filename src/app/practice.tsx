import React, { useMemo, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Back, Button, Pill, ProgressBar, Screen, problemCard, type } from '../components';
import { checkAnswer, restoreRound, ROUND_SIZE, shuffleForPractice } from '../engine';
import { useProgress } from '../progress';
import { colors } from '../theme';

type Feedback = { correct: boolean; answer: number; hint: string };

export default function Practice() {
  const { ids } = useLocalSearchParams<{ ids?: string }>();
  const round = useMemo(() => {
    try { return shuffleForPractice(restoreRound(ids ?? '')); }
    catch { return null; }
  }, [ids]);
  const [position, setPosition] = useState(0);
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [score, setScore] = useState(0);
  const { record } = useProgress();
  const problem = round?.[position];

  function pressKey(key: string) {
    if (feedback) return;
    if (key === '⌫') setInput(value => value.slice(0, -1));
    else setInput(value => value.length < 3 ? value + key : value);
  }
  function submit() {
    if (!input || !problem || feedback) return;
    const correct = checkAnswer(input, problem);
    if (correct) setScore(value => value + 1);
    setFeedback({ correct, answer: problem.answer, hint: problem.hint });
  }
  function next() {
    if (position + 1 >= ROUND_SIZE) {
      record(score);
      router.replace({ pathname: '/result', params: { score: String(score) } });
    } else {
      setPosition(value => value + 1);
      setInput('');
      setFeedback(null);
    }
  }

  if (!round || !problem) return <Screen><Text style={type.title}>Сначала посмотри карточки с ответами</Text><Button title="К карточкам" onPress={() => router.replace('/guided')} /></Screen>;
  return <Screen>
    <Back label="К уроку" />
    <View style={styles.row}><Text style={type.eyebrow}>ТЕПЕРЬ ТВОЯ ОЧЕРЕДЬ</Text><Text style={styles.count}>{position + 1} / {ROUND_SIZE}</Text></View>
    <ProgressBar current={position + 1} total={ROUND_SIZE} />
    <Text style={[type.title, { marginTop: 20, fontSize: 27 }]}>Сколько получится?</Text>
    <Text style={[type.body, { fontSize: 14, marginTop: 4 }]}>Те же десять примеров, теперь без ответа и в другом порядке.</Text>
    <View style={problemCard}>
      <Pill>ПРИМЕР {position + 1}</Pill>
      <Text style={styles.expression}>{problem.expression}</Text>
      <View style={[styles.input, feedback && { borderColor: feedback.correct ? colors.green : colors.red }]}><Text style={[styles.inputText, !input && { color: '#AFBBC9' }]}>{input || 'Твой ответ'}</Text></View>
    </View>
    {feedback ? <View accessible accessibilityLiveRegion="polite" style={[styles.feedback, { backgroundColor: feedback.correct ? colors.mint : '#FCE9EA' }]}><Text style={[styles.feedbackTitle, { color: feedback.correct ? colors.green : colors.red }]}>{feedback.correct ? 'Верно! Отличная работа' : `Пока нет. Ответ: ${feedback.answer}`}</Text><Text style={styles.feedbackHint}>Удобный путь: {feedback.hint}</Text></View> : <View style={{ flex: 1 }} />}
    {!feedback && <View style={styles.keypad}>{['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', '⌫'].map(key => <Pressable accessibilityRole="button" accessibilityLabel={key === '⌫' ? 'Удалить' : key} key={key} onPress={() => pressKey(key)} style={({ pressed }) => [styles.key, pressed && { backgroundColor: colors.bluePale }]}><Text style={styles.keyText}>{key}</Text></Pressable>)}</View>}
    <Button title={feedback ? position + 1 >= ROUND_SIZE ? 'Мой результат  →' : 'Дальше  →' : 'Проверить ответ'} disabled={!feedback && !input} onPress={feedback ? next : submit} />
  </Screen>;
}
const styles = StyleSheet.create({ row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }, count: { color: colors.muted, fontWeight: '800' }, expression: { fontSize: 37, color: colors.ink, fontWeight: '800', marginVertical: 18 }, input: { width: '100%', minHeight: 56, borderWidth: 2, borderColor: colors.border, borderRadius: 15, justifyContent: 'center', alignItems: 'center' }, inputText: { fontSize: 22, color: colors.ink, fontWeight: '700' }, feedback: { marginTop: 16, padding: 17, borderRadius: 18, flex: 1, justifyContent: 'center' }, feedbackTitle: { fontSize: 18, fontWeight: '800' }, feedbackHint: { color: colors.ink, fontSize: 14, marginTop: 7 }, keypad: { flex: 1, minHeight: 196, marginTop: 15, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignContent: 'space-between' }, key: { width: '31.5%', height: '23%', minHeight: 39, borderRadius: 13, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, justifyContent: 'center', alignItems: 'center' }, keyText: { fontSize: 23, fontWeight: '700', color: colors.ink } });
