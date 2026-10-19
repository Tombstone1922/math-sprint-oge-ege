import { FractionReference } from '../fraction-reference';
import React, { useMemo, useRef, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Back, Button, Disclosure, Pill, ProgressBar, Screen, problemCardStyle, type } from '../components';
import { getModule, type ModuleId } from '../content';
import { checkAnswer, parseGroup, restoreRound, shuffleForPractice } from '../engine';
import { useProgress } from '../progress';
import { colors } from '../theme';
import { ProblemFigure, hasFigure } from '../problem-figure';
import { mistakeKey, restoreReviewRound, type TrainingMode } from '../learning-progress';
import { getHintSteps } from '../hints';
import { HintPanel } from '../hint-panel';
import { reviewTime } from '../learning-ui';
import { TaskActions } from '../task-actions';
import { DAILY_TARGET_MS, resolveDailyTask, type DailySession } from '../daily-model';
import { clockText, useDailyClock } from '../daily-clock';

type Feedback = { correct: boolean; assisted: boolean; at: number };

export default function Practice() {
  const { ids, module: requested, group: requestedGroup, mode: requestedMode } = useLocalSearchParams<{ ids?: string; module?: string; group?: string; mode?: string }>();
  const { progress } = useProgress();
  if (requestedMode === 'daily') {
    const daily = progress.daily.current;
    if (!daily || daily.finishedAt) return <Screen><Text style={type.title}>Твоя короткая тренировка</Text><Button title="Открыть подборку" onPress={() => router.dismissTo('/daily')} /></Screen>;
    return <PracticeContent key={daily.id} moduleId="mental-math" group={1} mode="practice" daily={daily} />;
  }
  const selected = getModule(requested);
  const group = parseGroup(requestedGroup, selected.id);
  const mode = requestedMode === 'review' ? 'review' : 'practice';
  return <PracticeContent key={`${selected.id}:${group}:${mode}:${ids ?? ''}`} moduleId={selected.id} group={group} ids={ids} mode={mode} />;
}

function PracticeContent({ ids, moduleId: baseModuleId, group: baseGroup, mode, daily }: { ids?: string; moduleId: ModuleId; group: number; mode: TrainingMode; daily?: DailySession }) {
  const round = useMemo(() => {
    if (daily) return daily.tasks.map(resolveDailyTask).filter((p): p is NonNullable<typeof p> => Boolean(p));
    try { return mode === 'review' ? restoreReviewRound(ids ?? '', baseModuleId, baseGroup) : shuffleForPractice(restoreRound(ids ?? '', baseModuleId, baseGroup)); }
    catch { return null; }
  }, [ids, baseModuleId, baseGroup, mode, daily]);
  const [position, setPosition] = useState(() => daily ? Math.min(daily.answers.length, daily.tasks.length - 1) : 0);
  const task = daily?.tasks[position];
  const moduleId = task?.moduleId ?? baseModuleId, group = task?.group ?? baseGroup;
  const [input, setInput] = useState('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [score, setScore] = useState(0);
  const [assistedCount, setAssistedCount] = useState(0);
  const [hintLevel, setHintLevel] = useState(() => daily?.hints[position] ?? 0);
  const hintLevelRef = useRef(hintLevel);
  const submitted = useRef(false), finished = useRef(false);
  const [sessionId] = useState(() => `session-${Date.now()}-${Math.random().toString(36).slice(2)}`);
  const { answer, hint, complete, progress, dailyAnswer, dailyHint, dailyTime, dailyFinish } = useProgress();
  const clock = useDailyClock(daily?.id, daily?.elapsedMs ?? 0, dailyTime);
  const alreadyAnswered = daily?.answers[position];
  const problem = round?.[position];
  const total = round?.length ?? 0;
  const fractionInput = moduleId === 'fractions' || moduleId === 'probability' || ['oge-6', 'oge-8', 'oge-10'].includes(moduleId);
  const decimalInput = moduleId === 'fraction-decimals' || Boolean(problem?.practical) || ['oge-6', 'oge-8', 'oge-9', 'oge-10', 'oge-12', 'oge-14', 'oge-15', 'oge-16', 'oge-17', 'oge-18'].includes(moduleId);
  const signedInput = moduleId === 'oge-6' || moduleId === 'oge-8' || moduleId === 'oge-9' || moduleId === 'oge-12' || moduleId === 'oge-14';
  const rootsInput = problem?.answerMode === 'roots';
  const sequenceInput = problem?.answerMode === 'sequence';
  const statementsInput = problem?.answerMode === 'statements';
  const choiceInput = problem?.answerMode === 'choice';
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', fractionInput && !decimalInput ? '/' : decimalInput && !rootsInput && !choiceInput ? ',' : '', '0', '⌫'];

  function pressKey(key: string) {
    if (feedback) return;
    if (key === '(') setInput(value => /^\d+[,]\d*$/.test(value) ? value + '(' : value);
    else if (key === ')') setInput(value => /\(\d+$/.test(value) ? value + ')' : value);
    else if (key === '±' && rootsInput) setInput(value => value.length < 24 && !value.endsWith('−') ? value + '−' : value);
    else if (key === '±') setInput(value => value.startsWith('−') ? value.slice(1) : value ? '−' + value : '−');
    else if (key === '⌫') setInput(value => value.slice(0, -1));
    else if (key === '/') setInput(value => value && !value.includes('/') && !value.includes(',') ? value + key : value);
    else if (key === ',') setInput(value => value && value !== '−' && !value.includes(',') && !value.includes('/') ? value + key : value);
    else setInput(value => !value.endsWith(')') && value.length < (statementsInput ? 3 : sequenceInput ? (problem?.answer.length ?? 3) : choiceInput ? 1 : rootsInput || moduleId === 'fraction-decimals' ? 32 : 12) ? value + key : value);
  }
  function submit() {
    if (!input || !problem || submitted.current || alreadyAnswered) return;
    submitted.current = true;
    const correct = checkAnswer(input, problem);
    const assisted = hintLevelRef.current > 0;
    const at = Date.now();
    if (daily) { dailyAnswer(daily.id, position, input); dailyTime(daily.id, clock.read()); }
    else answer({ sessionId, moduleId, group, problemId: problem.id, correct, hintLevel: hintLevelRef.current, mode, at });
    if (correct && !assisted) setScore(value => value + 1);
    if (correct && assisted) setAssistedCount(value => value + 1);
    setFeedback({ correct, assisted, at });
  }
  function reveal(level: number) {
    if (!problem) return;
    if (!submitted.current) {
      hintLevelRef.current = Math.max(hintLevelRef.current, Math.min(3, level));
      if (daily) dailyHint(daily.id, position, Math.min(3, level));
      else hint({ sessionId, moduleId, group, problemId: problem.id, at: Date.now() });
    }
    setHintLevel(value => Math.max(value, Math.min(3, level)));
  }
  function next() {
    if ((!submitted.current && !alreadyAnswered) || finished.current) return;
    if (position + 1 >= total) {
      finished.current = true;
      if (daily) { dailyFinish(daily.id, clock.read()); router.dismissTo('/daily'); return; }
      complete({ id: sessionId, score, total, moduleId, group, mode });
      router.replace({ pathname: '/result', params: { score: String(score), total: String(total), assisted: String(assistedCount), module: moduleId, group: String(group), mode } });
    } else {
      setPosition(value => value + 1);
      setInput('');
      setFeedback(null);
      const nextHint = daily?.hints[position + 1] ?? 0;
      setHintLevel(nextHint);
      hintLevelRef.current = nextHint;
      submitted.current = false;
    }
  }

  if (!round || !problem) return <Screen><Text style={type.title}>{mode === 'review' ? 'Эти задачи не удалось открыть' : 'Сначала посмотри карточки с ответами'}</Text><Button title={mode === 'review' ? 'К списку ошибок' : 'К карточкам'} onPress={() => router.replace({ pathname: mode === 'review' ? '/review' : '/guided', params: { module: moduleId, group: String(group) } })} /></Screen>;
  const pending = progress.mistakes[mistakeKey(moduleId, problem.id)];
  const answered = Boolean(feedback || alreadyAnswered);
  const actionDisabled = !answered && (!input || input.endsWith('−') || input.endsWith('/') || input.endsWith(',') || (moduleId === 'fraction-decimals' && input.includes('(') && !input.endsWith(')')));
  return <Screen key={problem.id} footer={<TaskActions answer={input} title={answered ? position + 1 >= total ? 'Мой результат →' : 'Дальше →' : 'Проверить ответ'} disabled={actionDisabled} onPress={answered ? next : submit} condition={<View style={{ marginTop: 18 }}><Text style={[type.body, { color: colors.ink }]}>{problem.expression}</Text><ProblemFigure problem={problem} /></View>} />}>
    <Back label={daily ? 'К ежедневной тренировке' : mode === 'review' ? 'К ошибкам' : 'К группам'} />
    {daily && <View style={styles.dailyHeader}><View style={{ flex: 1 }}><Text style={type.eyebrow}>ЕСТЬ ПЯТЬ МИНУТ</Text><Text style={styles.feedbackHint}>{clockText(clock.elapsed)} / 5:00 · {task?.kind === 'warmup' ? 'Разминка' : task?.kind === 'mistake' ? 'Прошлая ошибка' : 'Вспоминаем знакомое'}</Text></View><Pressable accessibilityRole="button" disabled={!daily.answers.length} onPress={() => { if (!finished.current) { finished.current = true; dailyFinish(daily.id, clock.read()); router.dismissTo('/daily'); } }} style={styles.finishDaily}><Text style={{ color: daily.answers.length ? colors.blue : colors.muted, fontWeight: '700' }}>Закончить</Text></Pressable></View>}
    {daily && clock.elapsed >= DAILY_TARGET_MS && <Text accessibilityLiveRegion="polite" style={styles.feedbackHint}>Пять минут прошли. Можно завершить занятие или спокойно дорешать подборку.</Text>}
    <View style={styles.row}><Text style={[type.eyebrow, { flex: 1 }]}>{daily ? getModule(moduleId).title : `ГРУППА ${group} · ${mode === 'review' ? 'ПОВТОРЕНИЕ' : 'ТВОЯ ОЧЕРЕДЬ'}`}</Text><Text style={styles.count}>{position + 1} / {total}</Text></View>
    <ProgressBar current={position + 1} total={total} />
    <Text style={[type.title, { marginTop: 20, fontSize: 27 }]}>Найди ответ</Text>
    <Text style={[type.body, { fontSize: 14, marginTop: 4 }]}>{daily ? 'Решай в своём темпе. Подсказки и рисунки всегда под рукой.' : mode === 'review' ? 'Личная подборка ошибок без предварительного показа ответов. Общее условие практической задачи можно открыть на карточке.' : problem.practical ? 'Два тех же блока: вопросы №1–5 идут по порядку.' : 'Те же десять задач в другом порядке.'}{rootsInput ? ' Введи все корни по возрастанию подряд без пробелов.' : statementsInput ? ' Введи номера всех верных утверждений по возрастанию без пробелов.' : sequenceInput ? ` Введи ${problem.answer.length} цифры подряд в указанном порядке.` : choiceInput ? ' Введи номер варианта: 1, 2, 3 или 4.' : fractionInput && decimalInput ? ' Введи точную дробь через / или десятичное число.' : fractionInput ? ' Дробь запиши через /.' : moduleId === 'fraction-decimals' ? ' Введи десятичную дробь. Период — в скобках: 0,(3).' : decimalInput ? ' Дробную часть вводи через запятую.' : ''}</Text>
    {moduleId === 'fraction-decimals' && <FractionReference onOpen={() => reveal(1)} />}
    <View testID={`problem-card-${problem.id}`} style={problemCardStyle(problem.colorIndex)}>
      <Pill>{problem.practical ? `ЗАДАНИЕ ${problem.practical.number}` : `ПРИМЕР ${position + 1}`}</Pill>
      {problem.practical && <Text testID="problem-expression" style={[styles.expression, styles.geometryExpression]}>{problem.expression}</Text>}
      <ProblemFigure problem={problem} />
      {!problem.practical && <Text testID="problem-expression" style={[styles.expression, (hasFigure(problem) || ['oge-6', 'oge-7', 'oge-8', 'oge-9', 'oge-10', 'oge-12', 'oge-14', 'oge-19'].includes(moduleId)) && styles.geometryExpression]}>{problem.expression}</Text>}
      <View style={styles.inputRow}>{signedInput && !choiceInput && !feedback && <Pressable accessibilityRole="button" accessibilityLabel={rootsInput ? "Добавить минус перед корнем" : "Изменить знак ответа"} onPress={() => pressKey('±')} style={styles.signKey}><Text style={styles.keyText}>{rootsInput ? '−' : '±'}</Text></Pressable>}{fractionInput && decimalInput && !choiceInput && !feedback && <Pressable accessibilityRole="button" accessibilityLabel="Дробная черта" onPress={() => pressKey('/')} style={styles.signKey}><Text style={styles.keyText}>/</Text></Pressable>}<View style={[styles.input, feedback && { borderColor: feedback.correct ? colors.green : colors.red }]}><Text style={[styles.inputText, !input && { color: '#AFBBC9' }]}>{input || (rootsInput ? 'Корни подряд' : statementsInput ? 'Номера утверждений' : sequenceInput ? 'Цифры подряд' : choiceInput ? 'Номер варианта' : fractionInput ? 'Например, 2/3' : 'Твой ответ')}</Text></View></View>
    </View>
    {!feedback && moduleId === 'fraction-decimals' && <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>{['(', ')'].map(key => <Pressable key={key} accessibilityRole="button" accessibilityLabel={key === '(' ? 'Начать период' : 'Закончить период'} onPress={() => pressKey(key)} style={styles.signKey}><Text style={styles.keyText}>{key}</Text></Pressable>)}<Text style={[type.body, { flex: 1, fontSize: 12 }]}>Повторяющиеся цифры заключай в скобки.</Text></View>}
    {!feedback && !alreadyAnswered && <View style={styles.keypad}>{keys.map((key, index) => key ? <Pressable accessibilityRole="button" accessibilityLabel={key === '⌫' ? 'Удалить' : key === '/' ? 'Дробная черта' : key} key={key} onPress={() => pressKey(key)} style={({ pressed }) => [styles.key, pressed && { backgroundColor: colors.bluePale }]}><Text style={styles.keyText}>{key}</Text></Pressable> : <View key={`empty-${index}`} style={styles.keyBlank} />)}</View>}
    {feedback && <View accessible accessibilityLiveRegion="polite" style={[styles.feedback, { backgroundColor: feedback.correct ? colors.mint : '#FCE9EA' }]}><Text style={[styles.feedbackTitle, { color: feedback.correct ? colors.green : colors.red }]}>{feedback.correct ? feedback.assisted ? 'Верно, с подсказкой' : 'Верно, самостоятельно!' : 'Пока неверно. Разберём по шагам'}</Text><Text style={styles.feedbackHint}>{!feedback.correct || feedback.assisted ? 'Задача сохранена для повторения. Подсказки помогут разобраться, а самостоятельные ответы — закрепить.' : (mode === 'review' || task?.kind === 'mistake') ? pending ? `Закрепление: ${pending.streak}/3. Следующий повтор: ${reviewTime(pending.dueAt, feedback.at)}.` : 'Три самостоятельных повторения пройдены. Задача закреплена!' : 'Ответ сохранён в твоём прогрессе.'}</Text></View>}
    {feedback && <Button title="Разобрать этот шаг" secondary onPress={() => router.push({ pathname: '/explain', params: { module: moduleId, group: String(group), problem: problem.id, answer: input } })} />}
    {alreadyAnswered && !feedback && <View style={styles.feedback}><Text style={styles.feedbackTitle}>Этот ответ уже учтён</Text><Text style={styles.feedbackHint}>Продолжим со следующей задачи.</Text></View>}
    <Disclosure title="Подсказки и формулы" initialOpen={hintLevel > 0}>
    <Button secondary title="Открыть справочник формул ↗" onPress={() => { if (!feedback && !alreadyAnswered) reveal(1); router.push({ pathname: '/reference', params: { module: moduleId } }); }} />
    <HintPanel steps={getHintSteps(problem, moduleId, group)} level={hintLevel} onReveal={reveal} />


    </Disclosure>
  </Screen>;
}
const styles = StyleSheet.create({
  dailyHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 15 },
  finishDaily: { paddingVertical: 14, paddingHorizontal: 8 }, row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }, count: { color: colors.muted, fontWeight: '800' }, expression: { fontSize: 29, lineHeight: 37, textAlign: 'center', color: colors.ink, fontWeight: '800', marginVertical: 18 }, geometryExpression: { fontSize: 19, lineHeight: 27, marginVertical: 12 }, inputRow: { marginTop: 12, flexDirection: 'row', width: '100%', gap: 8 }, signKey: { width: 48, minHeight: 56, alignItems: 'center', justifyContent: 'center', borderRadius: 15, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border }, input: { flex: 1, minHeight: 56, borderWidth: 2, borderColor: colors.border, borderRadius: 15, justifyContent: 'center', alignItems: 'center' }, inputText: { fontSize: 22, color: colors.ink, fontWeight: '700' }, feedback: { marginTop: 16, padding: 17, borderRadius: 18, flex: 1, justifyContent: 'center' }, feedbackTitle: { fontSize: 18, fontWeight: '800' }, feedbackHint: { color: colors.ink, fontSize: 14, lineHeight: 21, marginTop: 7 }, keypad: { minHeight: 220, marginTop: 15, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignContent: 'space-between' }, key: { width: '31.5%', height: 48, minHeight: 48, borderRadius: 13, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, justifyContent: 'center', alignItems: 'center' }, keyBlank: { width: '31.5%', height: 48, minHeight: 48 }, keyText: { fontSize: 23, fontWeight: '700', color: colors.ink } });
