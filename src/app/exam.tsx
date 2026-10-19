import React, { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Button, Pill, Screen, type } from '../components';
import { useProgress } from '../progress';
import { emptyExamWork, examHasWork, examRemaining, examResults, resolveExam, type ExamSession } from '../study/exam';
import { examClock, useExamNow } from '../study/exam-clock';
import { ExamPrompt, ExamSolution } from '../study/task-view';
import { studyStyles as s } from '../study/ui';
import { colors } from '../theme';
import { extendedTask } from '../extended/bank';
import { WorkbookLink } from '../workbook/ui';
import { weeklyTitle } from '../study/weekly';

export default function Exam() {
  const { id } = useLocalSearchParams<{ id?: string }>(), { progress, study } = useProgress(), state = progress.study.exam;
  const session = id ? [state.current, ...state.history].find(e => e?.id === id) : state.current;
  const now = useExamNow(session, id => study({ area: 'exam', action: { type: 'sync', id } }));
  if (!session) return <Screen><Text style={type.title}>Работа не найдена</Text><Button title="К пробному экзамену" onPress={() => router.dismissTo('/exam-hub')} /></Screen>;
  return session.finishedAt ? <ExamResult key={session.id} session={session} /> : <ExamWork key={session.id} session={session} now={now} />;
}
function Navigation({ session, position, select, result = false }: { session: ExamSession; position: number; select: (index: number) => void; result?: boolean }) {
  const r = result ? examResults(session) : null;
  return <View style={s.card}><Text style={[s.title, { fontSize: 16 }]}>{result ? 'Выбери задание для разбора' : 'Навигация по работе'}</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 13 }}>{session.tasks.map((task, i) => {
    const answered = examHasWork(task, session.work[task.number]), flagged = session.work[task.number]?.flagged;
    const correct = r ? i < 19 ? r.first[i].correct : session.points[task.number] === 2 : undefined;
    const color = result ? correct ? colors.mint : i < 19 || session.points[task.number] === 0 ? '#FCE9EA' : session.points[task.number] === 1 ? colors.amber : colors.white : flagged ? colors.amber : answered ? colors.mint : colors.white;
    return <Pressable key={task.number} accessibilityRole="button" accessibilityLabel={`Задание ${task.number}${answered ? ', есть ответ' : ', без ответа'}${flagged ? ', вернуться позже' : ''}`} accessibilityState={{ selected: i === position }} onPress={() => select(i)} style={{ width: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center', borderWidth: i === position ? 2 : 1, borderColor: i === position ? colors.blue : colors.border, borderRadius: 12, backgroundColor: color }}><Text style={{ color: colors.navy, fontWeight: '800', fontSize: 14 }}>{task.number}{flagged && !result ? '•' : ''}</Text></Pressable>;
  })}</View><Text style={s.small}>{result ? 'Зелёный — верно или вручную 2; жёлтый — вручную 1; красный — ошибка, пропуск или вручную 0.' : 'Зелёный — есть ответ/решение · жёлтый — вернуться позже. Цвет пока не означает правильность.'}</Text></View>;
}
function ExamWork({ session, now }: { session: ExamSession; now: number }) {
  const { study } = useProgress(), [confirm, setConfirm] = useState(false), task = session.tasks[session.position], work = session.work[task.number] ?? emptyExamWork();
  const remaining = examRemaining(session, now), problem = task.number <= 19 ? resolveExam(task) : null;
  const count = session.tasks.filter(t => examHasWork(t, session.work[t.number])).length;
  const edit = (patch: Partial<typeof work>) => study({ area: 'exam', action: { type: 'edit', id: session.id, number: task.number, ...patch } });
  const go = (position: number) => { setConfirm(false); study({ area: 'exam', action: { type: 'select', id: session.id, position } }); };
  return <Screen key={task.number}>
    <Pressable accessibilityRole="button" onPress={() => router.dismissTo('/exam-hub')} style={{ paddingVertical: 12 }}><Text style={s.chipText}>‹  Сохранить и выйти</Text></Pressable>
    <Pill tone="amber">ПРОБНЫЙ ЭКЗАМЕН</Pill>{session.weekly && <Text style={s.small}>{weeklyTitle(session.weekly)}</Text>}<View style={[s.row, { justifyContent: 'space-between', marginTop: 15 }]}><Text style={s.title}>Задание {task.number}</Text><Text accessibilityLabel="Оставшееся время экзамена" style={[s.title, { color: remaining !== null && remaining < 600000 ? colors.red : colors.blue }]}>{remaining === null ? 'Без таймера' : examClock(remaining)}</Text></View>
    <Text style={s.small}>{remaining === null ? 'Ответы сохраняются. Разбор откроется после сдачи.' : 'Таймер идёт и вне приложения. Разбор — после сдачи.'}</Text>
    <Navigation session={session} position={session.position} select={go} />
    <ExamPrompt task={task} />
    <View style={s.card}>
      {task.number <= 19 ? <>
        <Text style={s.title}>Твой ответ</Text><Text style={s.small}>{problem?.answerMode === 'choice' ? 'Введи номер выбранного варианта.' : problem?.answerMode === 'sequence' ? 'Цифры в требуемом порядке, без пробелов.' : problem?.answerMode === 'statements' ? 'Номера верных утверждений по возрастанию без пробелов.' : 'Десятичную дробь можно вводить через запятую; обыкновенную — через /. Ответ до сдачи можно изменить.'}</Text>
        <TextInput accessibilityLabel={`Ответ на задание ${task.number}`} value={work.input} onChangeText={input => edit({ input })} maxLength={64} autoCorrect={false} autoCapitalize="none" placeholder="Ответ" placeholderTextColor={colors.muted} style={s.input} />
      </> : <>
        <Text style={s.title}>Развёрнутое решение</Text><Text style={s.small}>Запиши ход, преобразования и обоснования. Можно решить на бумаге. Готовый график №22 появится после сдачи.</Text>
        <TextInput accessibilityLabel={`Черновик задания ${task.number}`} value={work.draft} onChangeText={draft => edit({ draft })} maxLength={6000} multiline textAlignVertical="top" placeholder="Дано, решение, обоснование, ответ…" placeholderTextColor={colors.muted} style={[s.input, { minHeight: 190 }]} />
        <Text style={s.small}>{work.draft.length}/6000</Text><Pressable accessibilityRole="checkbox" accessibilityLabel="Решил на бумаге" accessibilityState={{ checked: work.paper }} onPress={() => edit({ paper: !work.paper })} style={[s.row, { paddingVertical: 14, minHeight: 48 }]}><Text style={{ color: colors.blue, fontSize: 24 }}>{work.paper ? '☑' : '☐'}</Text><Text style={s.body}>Решил на бумаге</Text></Pressable>
      </>}
      <Button secondary title={work.flagged ? 'Снять отметку «вернуться позже»' : 'Отметить «вернуться позже»'} onPress={() => edit({ flagged: !work.flagged })} />
    </View>
    <View style={{ flexDirection: 'row', gap: 8 }}><View style={{ flex: 1 }}><Button secondary disabled={session.position === 0} title="← Назад" onPress={() => go(session.position - 1)} /></View><View style={{ flex: 1 }}><Button disabled={session.position === 24} title="Дальше →" onPress={() => go(session.position + 1)} /></View></View>
    {confirm ? <View style={[s.card, { backgroundColor: colors.amber }]}><Text style={s.title}>Сдать работу?</Text><Text style={s.body}>Есть ответ или решение: {count}/25. После сдачи ответы и черновики зафиксируются. Ошибки и пропуски первой части будут добавлены в повторение.</Text><Button title="Сдать и открыть результат" onPress={() => study({ area: 'exam', action: { type: 'finish', id: session.id } })} /><Button secondary title="Продолжить решать" onPress={() => setConfirm(false)} /></View> : <Button secondary title="Завершить и сдать работу" onPress={() => setConfirm(true)} />}
  </Screen>;
}
function ExamResult({ session }: { session: ExamSession }) {
  const { study } = useProgress(), [position, setPosition] = useState(0), task = session.tasks[position], work = session.work[task.number] ?? emptyExamWork(), result = examResults(session), extended = task.number >= 20 ? extendedTask(task.problemId)! : null;
  return <Screen key={`${session.id}-${position}`}>
    <Pressable accessibilityRole="button" onPress={() => router.dismissTo('/exam-hub')} style={{ paddingVertical: 12 }}><Text style={s.chipText}>‹  К пробным работам</Text></Pressable><Pill tone="mint">РАБОТА СДАНА</Pill><Text style={[type.title, { marginTop: 20 }]}>Результат пробника</Text>{session.expired && <Text style={[s.body, { color: colors.red }]}>Время закончилось. Учтены ответы, сохранённые до истечения таймера.</Text>}
    {session.weekly && <Text style={s.body}>{weeklyTitle(session.weekly)}</Text>}
    <View style={[s.card, { backgroundColor: colors.navy }]}><Text style={{ color: colors.white, fontSize: 48, fontWeight: '800' }}>{result.automatic}<Text style={{ fontSize: 24 }}>/19</Text></Text><Text style={[s.body, { color: '#DDE8FA' }]}>Первая часть · проверена автоматически</Text><Text style={[s.body, { color: '#DDE8FA' }]}>Вторая часть: {result.manual}/12 · вручную оценено {result.scored}/6</Text>{result.total !== null && <Text style={[s.title, { color: colors.white, marginTop: 13 }]}>Учебный итог: {result.total}/31</Text>}</View>
    <Text style={s.small}>Итог включает ручную оценку второй части. Это учебный результат; он не подтверждает экзаменационную оценку. Ошибки и пропуски первой части сохранены в повторении.</Text>
    <Navigation session={session} position={position} select={setPosition} result />
    <Text style={[s.title, { marginTop: 20 }]}>Задание {task.number}</Text><ExamPrompt task={task} />
    <View style={s.card}><Text style={s.title}>{task.number <= 19 ? result.first[position].correct ? 'Ответ верный' : 'Нужно разобрать' : 'Твоё исходное решение'}</Text><Text selectable style={s.body}>{task.number <= 19 ? `Введено: ${work.input || 'нет ответа'}` : work.draft || (work.paper ? 'Решение выполнено на бумаге.' : 'Черновика нет; решение на бумаге не отмечено.')}</Text></View>
    {extended && <WorkbookLink source="exam" session={session.id} taskId={task.problemId} />}
    <ExamSolution task={task} />
    {extended && <View style={s.card}><Text style={s.title}>Ручная оценка · 0–2</Text><Text style={s.body}>Сравни свою работу с образцом и обсуди спорные шаги с преподавателем. Введи балл вручную. Приложение не проверяет текст доказательства.</Text>{extended.checklist.map((item, i) => <Text key={i} style={s.small}>• {item}</Text>)}<View style={{ flexDirection: 'row', gap: 10, marginTop: 16 }}>{[0, 1, 2].map(points => <Pressable key={points} accessibilityRole="radio" accessibilityLabel={`Оценка ${points} за задание ${task.number}`} accessibilityState={{ checked: session.points[task.number] === points }} onPress={() => study({ area: 'exam', action: { type: 'score', id: session.id, number: task.number, points } })} style={[s.option, { flex: 1, alignItems: 'center' }, session.points[task.number] === points && s.selected]}><Text style={s.title}>{points}</Text></Pressable>)}</View><Text style={s.small}>Оценки 0 и 1 добавляют задачу второй части на закрепление. Полный учебный итог появится после оценки всех шести заданий.</Text></View>}
    <View style={{ flexDirection: 'row', gap: 8 }}><View style={{ flex: 1 }}><Button secondary disabled={position === 0} title="← Назад" onPress={() => setPosition(position - 1)} /></View><View style={{ flex: 1 }}><Button disabled={position === 24} title="Дальше →" onPress={() => setPosition(position + 1)} /></View></View>
  </Screen>;
}
