import React, { useMemo, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Back, Button, Pill, ProgressBar, Screen, problemCardStyle, type } from '../components';
import { getModule, type ModuleId } from '../content';
import { checkAnswer, parseGroup, restoreRound, ROUND_SIZE, shuffleForPractice } from '../engine';
import { useProgress } from '../progress';
import { colors } from '../theme';
import { ProblemFigure, hasFigure } from '../problem-figure';

type Feedback = { correct: boolean; answer: string; hint: string };

export default function Practice() {
  const { ids, module: requested, group: requestedGroup } = useLocalSearchParams<{ ids?: string; module?: string; group?: string }>();
  const selected = getModule(requested);
  const group = parseGroup(requestedGroup);
  return <PracticeContent key={`${selected.id}:${group}:${ids ?? ''}`} moduleId={selected.id} group={group} ids={ids} />;
}

function PracticeContent({ ids, moduleId, group }: { ids?: string; moduleId: ModuleId; group: number }) {
  const round = useMemo(() => {
    try { return shuffleForPractice(restoreRound(ids ?? '', moduleId, group)); }
    catch { return null; }
  }, [ids, moduleId, group]);
  const [position, setPosition] = useState(0);
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [score, setScore] = useState(0);
  const { record } = useProgress();
  const problem = round?.[position];
  const fractionInput = moduleId === 'fractions' || moduleId === 'probability';
  const decimalInput = ['oge-12', 'oge-14', 'oge-15', 'oge-16', 'oge-17', 'oge-18'].includes(moduleId);
  const signedInput = moduleId === 'oge-12' || moduleId === 'oge-14';
  const sequenceInput = problem?.answerMode === 'sequence';
  const choiceInput = problem?.answerMode === 'choice';
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', fractionInput ? '/' : decimalInput ? ',' : '', '0', '⌫'];

  function pressKey(key: string) {
    if (feedback) return;
    if (key === '±') setInput(value => value.startsWith('−') ? value.slice(1) : value ? '−' + value : '−');
    else if (key === '⌫') setInput(value => value.slice(0, -1));
    else if (key === '/') setInput(value => value && !value.includes('/') ? value + key : value);
    else if (key === ',') setInput(value => value && value !== '−' && !value.includes(',') ? value + key : value);
    else setInput(value => value.length < (sequenceInput ? 3 : choiceInput ? 1 : 12) ? value + key : value);
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
      router.replace({ pathname: '/result', params: { score: String(score), module: moduleId, group: String(group) } });
    } else {
      setPosition(value => value + 1);
      setInput('');
      setFeedback(null);
    }
  }

  if (!round || !problem) return <Screen><Text style={type.title}>Сначала посмотри карточки с ответами</Text><Button title="К карточкам" onPress={() => router.replace({ pathname: '/guided', params: { module: moduleId, group: String(group) } })} /></Screen>;
  return <Screen>
    <Back label="К группам" />
    <View style={styles.row}><Text style={type.eyebrow}>ГРУППА {group} · ТВОЯ ОЧЕРЕДЬ</Text><Text style={styles.count}>{position + 1} / {ROUND_SIZE}</Text></View>
    <ProgressBar current={position + 1} total={ROUND_SIZE} />
    <Text style={[type.title, { marginTop: 20, fontSize: 27 }]}>Найди ответ</Text>
    <Text style={[type.body, { fontSize: 14, marginTop: 4 }]}>Те же десять задач в другом порядке.{sequenceInput ? ' Введи три цифры подряд в порядке А, Б, В.' : choiceInput ? ' Введи номер варианта: 1, 2, 3 или 4.' : fractionInput ? ' Дробь запиши через /.' : decimalInput ? ' Дробную часть вводи через запятую.' : ''}</Text>
    <View style={problemCardStyle(problem.colorIndex)}>
      <Pill>ПРИМЕР {position + 1}</Pill>
      <ProblemFigure problem={problem} />
      <Text style={[styles.expression, (hasFigure(problem) || moduleId === 'oge-12' || moduleId === 'oge-14') && styles.geometryExpression]}>{problem.expression}</Text>
      <View style={styles.inputRow}>{signedInput && !feedback && <Pressable accessibilityRole="button" accessibilityLabel="Изменить знак ответа" onPress={() => pressKey('±')} style={styles.signKey}><Text style={styles.keyText}>±</Text></Pressable>}<View style={[styles.input, feedback && { borderColor: feedback.correct ? colors.green : colors.red }]}><Text style={[styles.inputText, !input && { color: '#AFBBC9' }]}>{input || (sequenceInput ? 'Три цифры' : choiceInput ? 'Номер варианта' : fractionInput ? 'Например, 2/3' : 'Твой ответ')}</Text></View></View>
    </View>
    {feedback ? <View accessible accessibilityLiveRegion="polite" style={[styles.feedback, { backgroundColor: feedback.correct ? colors.mint : '#FCE9EA' }]}><Text style={[styles.feedbackTitle, { color: feedback.correct ? colors.green : colors.red }]}>{feedback.correct ? 'Верно! Отличная работа' : `Пока нет. Ответ: ${feedback.answer}`}</Text><Text style={styles.feedbackHint}>Удобный путь: {feedback.hint}</Text></View> : <View style={{ flex: 1 }} />}
    {!feedback && <View style={styles.keypad}>{keys.map((key, index) => key ? <Pressable accessibilityRole="button" accessibilityLabel={key === '⌫' ? 'Удалить' : key === '/' ? 'Дробная черта' : key} key={key} onPress={() => pressKey(key)} style={({ pressed }) => [styles.key, pressed && { backgroundColor: colors.bluePale }]}><Text style={styles.keyText}>{key}</Text></Pressable> : <View key={`empty-${index}`} style={styles.keyBlank} />)}</View>}
    <Button title={feedback ? position + 1 >= ROUND_SIZE ? 'Мой результат  →' : 'Дальше  →' : 'Проверить ответ'} disabled={!feedback && (!input || input === '−' || input.endsWith('/') || input.endsWith(','))} onPress={feedback ? next : submit} />
  </Screen>;
}
const styles = StyleSheet.create({ row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }, count: { color: colors.muted, fontWeight: '800' }, expression: { fontSize: 29, lineHeight: 37, textAlign: 'center', color: colors.ink, fontWeight: '800', marginVertical: 18 }, geometryExpression: { fontSize: 19, lineHeight: 27, marginVertical: 12 }, inputRow: { flexDirection: 'row', width: '100%', gap: 8 }, signKey: { width: 48, minHeight: 56, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border }, input: { flex: 1, minHeight: 56, borderWidth: 2, borderColor: colors.border, borderRadius: 15, justifyContent: 'center', alignItems: 'center' }, inputText: { fontSize: 22, color: colors.ink, fontWeight: '700' }, feedback: { marginTop: 16, padding: 17, borderRadius: 18, flex: 1, justifyContent: 'center' }, feedbackTitle: { fontSize: 18, fontWeight: '800' }, feedbackHint: { color: colors.ink, fontSize: 14, marginTop: 7 }, keypad: { flex: 1, minHeight: 196, marginTop: 15, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignContent: 'space-between' }, key: { width: '31.5%', height: '23%', minHeight: 39, borderRadius: 13, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, justifyContent: 'center', alignItems: 'center' }, keyBlank: { width: '31.5%', height: '23%', minHeight: 39 }, keyText: { fontSize: 23, fontWeight: '700', color: colors.ink } });
