import React, { useCallback, useRef, useState } from 'react';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Back, Button, Pill, Screen, problemCardStyle, type } from '../components';
import { getModule } from '../content';
import { checkAnswer, getGroupProblems, parseGroup } from '../engine';
import { getHintSteps } from '../hints';
import { ProblemFigure } from '../problem-figure';
import { loadAssistantConnection } from '../assistant-storage';
import { askAssistant } from '../assistant-client';
import type { AssistantConnection, Explanation } from '../assistant-contract';
import { colors } from '../theme';

export default function Explain() {
  const { module: requested, group: requestedGroup, problem: problemId, answer: submittedAnswer = '' } = useLocalSearchParams<{ module?: string; group?: string; problem?: string; answer?: string }>();
  const selected = getModule(requested), group = parseGroup(requestedGroup, selected.id);
  const problem = getGroupProblems(selected.id, group).find(p => p.id === problemId);
  const [connection, setConnection] = useState<AssistantConnection | null>(null), [loaded, setLoaded] = useState(false);
  const [question, setQuestion] = useState(''), [response, setResponse] = useState<Explanation | null>(null), [asked, setAsked] = useState('');
  const [loading, setLoading] = useState(false), [error, setError] = useState('');
  const controller = useRef<AbortController | null>(null), active = useRef(false);
  useFocusEffect(useCallback(() => {
    active.current = true; setLoading(false);
    loadAssistantConnection().then(value => { if (active.current) { setConnection(value); setLoaded(true); } }).catch(() => { if (active.current) { setLoaded(true); setError('Не удалось прочитать подключение. Открой настройки помощника и подключись заново.'); } });
    return () => { active.current = false; controller.current?.abort(); controller.current = null; };
  }, []));
  async function ask() {
    if (!connection || !problem || !question.trim() || controller.current) return;
    const pending = new AbortController(); controller.current = pending;
    const text = question.trim(); setLoading(true); setError('');
    try {
      const value = await askAssistant(connection, { moduleId: selected.id, group, problemId: problem.id, submittedAnswer: submittedAnswer.slice(0, 64), question: text }, pending.signal);
      if (!active.current || pending.signal.aborted) return;
      if (value?.referenceAnswer !== (problem.answerDisplay ?? problem.answer)) throw new Error('Банк задач на сервере отличается от приложения. Сообщи преподавателю; пользуйся проверенным решением ниже.');
      setResponse(value); setAsked(text);
    } catch (e) { if (active.current && !pending.signal.aborted) setError(e instanceof Error ? e.message : 'Не удалось получить объяснение.'); }
    finally { if (controller.current === pending) { controller.current = null; if (active.current) setLoading(false); } }
  }
  if (!problem) return <Screen><Back /><Text style={type.title}>Не удалось открыть задачу</Text><Button title="К модулям" onPress={() => router.dismissTo('/topics')} /></Screen>;
  const steps = getHintSteps(problem, selected.id, group);
  const suggestions = [problem.numberLines || problem.rootTask || selected.id === 'equations' ? 'Почему здесь меняется знак?' : 'Объясни первый шаг проще.', 'Как проверить мой ответ?', 'Где я мог ошибиться?'];
  return <Screen>
    <Back label="К задаче" />
    <Pill tone="mint">РАЗБОР ПО КОНКРЕТНОЙ ЗАДАЧЕ</Pill>
    <Text style={[type.title, { marginTop: 18 }]}>Поймём этот шаг</Text>
    <Text style={[type.body, { marginTop: 8 }]}>{selected.title} · группа {group}</Text>
    <View style={problemCardStyle(problem.colorIndex)}>
      <ProblemFigure problem={problem} />
      <Text testID="explain-expression" style={styles.expression}>{problem.expression}</Text>
      <Text style={styles.caption}>Твой ответ: {submittedAnswer || 'не указан'}{submittedAnswer ? checkAnswer(submittedAnswer, problem) ? ' · верно' : ' · пока неверно' : ''}</Text>
    </View>
    <View style={styles.card}>
      <Text style={styles.label}>ПРОВЕРЕННЫЙ РАЗБОР · БЕЗ ИНТЕРНЕТА</Text>
      <Text style={styles.heading}>1. Идея</Text><Text selectable style={styles.body}>{steps.clue}</Text>
      <Text style={styles.heading}>2. Первый шаг</Text><Text selectable style={styles.body}>{steps.firstStep}</Text>
      <Text style={styles.heading}>3. Решение и ответ</Text><Text selectable testID="verified-solution" style={styles.body}>{steps.solution}</Text>
    </View>
    <View style={[styles.card, { backgroundColor: '#F0F4FC' }]}>
      <Text style={styles.label}>НЕЙРОСЕТЕВОЙ ПОМОЩНИК</Text>
      <Text style={[type.section, { marginTop: 10 }]}>Что осталось непонятным?</Text>
      <Text style={styles.body}>Помощник получает условие, данные рисунка, проверенное решение, твой ответ и вопрос. Объяснение нейросети сверяй с решением выше.</Text>
      {!loaded ? <ActivityIndicator style={{ marginTop: 18 }} color={colors.blue} /> : !connection ? <>
        <Text style={styles.notice}>Помощник ещё не подключён преподавателем. Проверенный разбор выше уже работает без интернета.</Text>
        <Button title="Подключение преподавателя" secondary onPress={() => router.push('/assistant-settings')} />
      </> : <>
        <View style={{ gap: 8, marginTop: 16 }}>{suggestions.map(text => <Pressable key={text} accessibilityRole="button" disabled={loading} onPress={() => setQuestion(text)} style={styles.suggestion}><Text style={{ color: colors.blue, fontWeight: '600', fontSize: 14 }}>{text}</Text></Pressable>)}</View>
        <TextInput accessibilityLabel="Вопрос о решении" placeholder="Например: почему делим именно на это число?" placeholderTextColor={colors.muted} multiline maxLength={600} editable={!loading} value={question} onChangeText={setQuestion} style={styles.input} textAlignVertical="top" />
        <Text style={styles.caption}>{question.length}/600 · не указывай личные данные</Text>
        <Button title={loading ? 'Разбираем твой вопрос…' : 'Спросить помощника'} disabled={loading || !question.trim()} onPress={ask} />
        {loading && <ActivityIndicator color={colors.blue} style={{ marginTop: 12 }} />}
        <Button title="Настройки подключения" secondary onPress={() => router.push('/assistant-settings')} />
      </>}
      {error ? <Text accessibilityLiveRegion="polite" style={styles.error}>{error}</Text> : null}
    </View>
    {response && <View accessibilityLiveRegion="polite" style={styles.card}>
      <Text style={styles.label}>ОБЪЯСНЕНИЕ НЕЙРОСЕТИ</Text><Text style={styles.heading}>{asked}</Text>
      <Text selectable testID="neural-explanation" style={styles.body}>{response.explanation}</Text>
      <Text style={styles.heading}>Проверь себя</Text><Text selectable style={styles.body}>{response.check}</Text>
    </View>}
    <Button title="Вернуться к задаче" onPress={() => router.back()} />
  </Screen>;
}
const styles = StyleSheet.create({ card: { backgroundColor: colors.white, borderRadius: 22, borderWidth: 1, borderColor: colors.border, padding: 19, marginTop: 18 }, label: { color: colors.blue, fontSize: 11, lineHeight: 17, fontWeight: '800', letterSpacing: .7 }, heading: { color: colors.navy, fontSize: 17, lineHeight: 24, fontWeight: '800', marginTop: 18 }, body: { color: colors.ink, fontSize: 15, lineHeight: 24, marginTop: 8 }, expression: { color: colors.navy, fontSize: 20, fontWeight: '700', lineHeight: 28, textAlign: 'center', marginVertical: 12 }, caption: { color: colors.muted, fontSize: 12, lineHeight: 19, marginTop: 7 }, input: { color: colors.ink, fontSize: 15, lineHeight: 23, padding: 15, borderRadius: 16, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, minHeight: 110, marginTop: 18 }, suggestion: { padding: 12, borderRadius: 13, backgroundColor: colors.white }, notice: { color: colors.navy, fontSize: 14, lineHeight: 22, marginTop: 18 }, error: { color: colors.red, fontSize: 14, lineHeight: 22, marginTop: 15 } });
