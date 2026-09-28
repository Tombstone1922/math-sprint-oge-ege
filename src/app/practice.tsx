import React, { useMemo, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Back, Button, Pill, ProgressBar, Screen, problemCard, type } from '../components';
import { getModule, type ModuleId } from '../content';
import { checkAnswer, restoreRound, ROUND_SIZE, shuffleForPractice } from '../engine';
import { useProgress } from '../progress';
import { colors } from '../theme';

type Feedback = { correct: boolean; answer: string; hint: string };

export default function Practice() {
  const { ids, module: requested } = useLocalSearchParams<{ ids?: string; module?: string }>();
  const selected = getModule(requested);
  return <PracticeContent key={`${selected.id}:${ids ?? ''}`} moduleId={selected.id} ids={ids} />;
}

function PracticeContent({ ids, moduleId }: { ids?: string; moduleId: ModuleId }) {
  const round = useMemo(() => {
    try { return shuffleForPractice(restoreRound(ids ?? '', moduleId)); }
    catch { return null; }
  }, [ids, moduleId]);
  const [position, setPosition] = useState(0);
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [score, setScore] = useState(0);
  const { record } = useProgress();
  const problem = round?.[position];
  const fractionInput = moduleId === 'fractions' || moduleId === 'probability';
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', fractionInput ? '/' : '', '0', '⌫'];

  function pressKey(key: string) {
    if (feedback) return;
    if (key === '⌫') setInput(value => value.slice(0, -1));
    else if (key === '/') setInput(value => value && !value.includes('/') ? value + key : value);
    else setInput(value => value.length < 7 ? value + key : value);
  }
  function submit() {
    if (!input || !problem || feedback) return;
    const correct = checkAnswer(input, problem);
    if (correct) setScore(value => value + 1);
    setFeedback({ correct, answer: problem.answer, hint: problem.hint });
  }
  function next() {
    if (position + 1 >= ROUND_SIZE) {
      record(score, moduleId);
      router.replace({ pathname: '/result', params: { score: String(score), module: moduleId } });
    } else {
      setPosition(value => value + 1);
      setInput('');
      setFeedback(null);
    }
  }

  if (!round || !problem) return <Screen><Text style={type.title}>Сначала посмотри карточки с ответами</Text><Button title="К карточкам" onPress={() => router.replace({ pathname: '/guided', params: { module: moduleId } })} /></Screen>;
  return <Screen>
    <Back label="К уроку" />
    <View style={styles.row}><Text style={type.eyebrow}>ТЕПЕРЬ ТВОЯ ОЧЕРЕДЬ</Text><Text style={styles.count}>{position + 1} / {ROUND_SIZE}</Text></View>
    <ProgressBar current={position + 1} total={ROUND_SIZE} />
    <Text style={[type.title, { marginTop: 20, fontSize: 27 }]}>Найди ответ</Text>
    <Text style={[type.body, { fontSize: 14, marginTop: 4 }]}>Те же десять задач в другом порядке.{fractionInput ? ' Дробь запиши через /.' : ''}</Text>
    <View style={problemCard}>
      <Pill>ПРИМЕР {position + 1}</Pill>
      <Text style={styles.expression}>{problem.expression}</Text>
      <View style={[styles.input, feedback && { borderColor: feedback.correct ? colors.green : colors.red }]}><Text style={[styles.inputText, !input && { color: '#AFBBC9' }]}>{input || (fractionInput ? 'Например, 2/3' : 'Твой ответ')}</Text></View>
    </View>
    {feedback ? <View accessible accessibilityLiveRegion="polite" style={[styles.feedback, { backgroundColor: feedback.correct ? colors.mint : '#FCE9EA' }]}><Text style={[styles.feedbackTitle, { color: feedback.correct ? colors.green : colors.red }]}>{feedback.correct ? 'Верно! Отличная работа' : `Пока нет. Ответ: ${feedback.answer}`}</Text><Text style={styles.feedbackHint}>Удобный путь: {feedback.hint}</Text></View> : <View style={{ flex: 1 }} />}
    {!feedback && <View style={styles.keypad}>{keys.map((key, index) => key ? <Pressable accessibilityRole="button" accessibilityLabel={key === '⌫' ? 'Удалить' : key === '/' ? 'Дробная черта' : key} key={key} onPress={() => pressKey(key)} style={({ pressed }) => [styles.key, pressed && { backgroundColor: colors.bluePale }]}><Text style={styles.keyText}>{key}</Text></Pressable> : <View key={`empty-${index}`} style={styles.keyBlank} />)}</View>}
    <Button title={feedback ? position + 1 >= ROUND_SIZE ? 'Мой результат  →' : 'Дальше  →' : 'Проверить ответ'} disabled={!feedback && (!input || input.endsWith('/'))} onPress={feedback ? next : submit} />
  </Screen>;
}
const styles = StyleSheet.create({ row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }, count: { color: colors.muted, fontWeight: '800' }, expression: { fontSize: 29, lineHeight: 37, textAlign: 'center', color: colors.ink, fontWeight: '800', marginVertical: 18 }, input: { width: '100%', minHeight: 56, borderWidth: 2, borderColor: colors.border, borderRadius: 15, justifyContent: 'center', alignItems: 'center' }, inputText: { fontSize: 22, color: colors.ink, fontWeight: '700' }, feedback: { marginTop: 16, padding: 17, borderRadius: 18, flex: 1, justifyContent: 'center' }, feedbackTitle: { fontSize: 18, fontWeight: '800' }, feedbackHint: { color: colors.ink, fontSize: 14, marginTop: 7 }, keypad: { flex: 1, minHeight: 196, marginTop: 15, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignContent: 'space-between' }, key: { width: '31.5%', height: '23%', minHeight: 39, borderRadius: 13, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, justifyContent: 'center', alignItems: 'center' }, keyBlank: { width: '31.5%', height: '23%', minHeight: 39 }, keyText: { fontSize: 23, fontWeight: '700', color: colors.ink } });
