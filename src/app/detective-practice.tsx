import React from 'react';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { Button, Pill, ProgressBar, Screen, type } from '../components';
import { TaskActions } from '../task-actions';
import { GeometryFigure } from '../geometry-figure';
import { useProgress } from '../progress';
import { detectiveGroups, detectiveTask } from '../study/detective-bank';
import { emptyDetectiveWork } from '../study/detective';
import { MathLine, studyStyles as s } from '../study/ui';
import { cardPalette, colors } from '../theme';
export default function DetectivePractice() {
  const { progress, study } = useProgress(), current = progress.study.detective.current;
  if (!current) return <Screen><Text style={type.title}>Выбери тему</Text><Button title="К поиску ошибок" onPress={() => router.dismissTo('/detective')} /></Screen>;
  const id = current.ids[current.position], task = id ? detectiveTask(id) : null;
  if (!task) { const done = Object.values(current.work).filter(w => w.done); return <Screen><Pill tone="mint">ПОДБОРКА РАЗОБРАНА</Pill><Text style={[type.title, { marginTop: 20 }]}>Ошибки стали понятнее</Text><View style={s.card}><Text style={s.title}>Самостоятельно: {done.filter(w => !w.wrong && !w.help).length}/{done.length}</Text><Text style={s.body}>С помощью или после повторного выбора: {done.filter(w => w.wrong || w.help).length}. Эти задачи остаются на закреплении.</Text></View><Button title="К другим темам  →" onPress={() => { study({ area: 'detective', action: { type: 'finish', session: current.id } }); router.dismissTo('/detective'); }} /></Screen>; }
  const work = current.work[id] ?? emptyDetectiveWork(), session = current.id, index = current.position;
  const act = (type: 'check-step' | 'check-choice' | 'help' | 'book' | 'next') => study({ area: 'detective', action: { type, session, index } });
  return <Screen key={id} footer={<TaskActions title={work.done ? index + 1 === current.ids.length ? 'Итог подборки →' : 'Следующая ошибка →' : work.found ? 'Проверить исправление' : 'Проверить выбранный шаг'} disabled={!work.done && (work.found ? work.choice === undefined : work.step === undefined)} onPress={() => act(work.done ? 'next' : work.found ? 'check-choice' : 'check-step')} condition={<View style={s.card}><MathLine value={task.condition} size={18} bold />{task.scene && <GeometryFigure figure={{ kind: 'grid-scene', scene: task.scene }} />}</View>} />}>
    <Pressable accessibilityRole="button" onPress={() => router.dismissTo('/detective')} style={{ paddingVertical: 12 }}><Text style={s.chipText}>‹  Сохранить и к темам</Text></Pressable><Pill tone={current.review ? 'mint' : 'amber'}>{current.review ? 'ЗАКРЕПЛЯЕМ' : 'МАТЕМАТИЧЕСКИЙ ДЕТЕКТИВ'}</Pill><Text style={[s.title, { marginTop: 18 }]}>{detectiveGroups[task.group - 1]}</Text><Text style={s.small}>Задача {index + 1}/{current.ids.length} · вариант {task.index + 1}</Text><View style={{ marginTop: 12 }}><ProgressBar current={index} total={current.ids.length} /></View>
    <View style={[s.card, { backgroundColor: cardPalette[task.index] }]}><MathLine value={task.condition} size={18} bold />{task.scene && <GeometryFigure figure={{ kind: 'grid-scene', scene: task.scene, caption: 'Рисунок к условию' }} />}</View>
    <View style={s.card}><Text style={s.title}>Чужое решение</Text><Text style={s.small}>Выбери первый неверный шаг. Следующие строки могут продолжать уже допущенную ошибку.</Text>{task.steps.map((step, i) => <Pressable key={i} accessibilityRole="radio" accessibilityLabel={`Шаг ${i + 1}: ${step}`} aria-checked={work.step === i} accessibilityState={{ checked: work.step === i, disabled: work.found || work.done }} disabled={work.found || work.done} onPress={() => study({ area: 'detective', action: { type: 'step', session, index, value: i } })} style={[s.option, work.step === i && s.selected, work.done && i === task.badIndex && { backgroundColor: '#FCE9EA', borderColor: colors.red }]}><Text style={s.small}>ШАГ {i + 1}</Text><MathLine value={step} /></Pressable>)}
      {work.stepError && !work.done && <Text accessibilityLiveRegion="polite" style={[s.body, { color: colors.red }]}>Это не первый неверный переход. Сравни каждую строку с предыдущей.</Text>}
      {work.found && !work.done && <Text accessibilityLiveRegion="polite" style={[s.body, { color: colors.green }]}>Первый неверный переход найден. Теперь исправь его.</Text>}
    </View>
    {work.found && !work.done && <View style={s.card}><Text style={s.title}>Как записать этот шаг правильно?</Text>{task.choices.map((choice, i) => <Pressable key={i} accessibilityRole="radio" accessibilityLabel={`Исправление ${i + 1}: ${choice}`} aria-checked={work.choice === i} accessibilityState={{ checked: work.choice === i }} onPress={() => study({ area: 'detective', action: { type: 'choice', session, index, value: i } })} style={[s.option, work.choice === i && s.selected]}><MathLine value={choice} /></Pressable>)}{work.choiceError && <Text accessibilityLiveRegion="polite" style={[s.body, { color: colors.red }]}>Такое исправление не сохраняет верное правило. Проверь знаки, ограничения и само действие.</Text>}</View>}
    {work.done ? <>
      <View style={[s.card, { backgroundColor: colors.mint }]}><Text style={s.title}>{work.wrong || work.help ? 'Разобрались с помощью' : 'Самостоятельно найдено и исправлено!'}</Text><Text style={s.body}>{task.explanation}</Text><Text style={[s.title, { fontSize: 17, marginTop: 16 }]}>Правильное решение</Text>{task.corrected.map((line, i) => <View key={i} style={{ marginTop: 10 }}><MathLine value={`${i + 1}. ${line}`} /></View>)}{(work.wrong || work.help) && <Text style={s.small}>Задача сохранена на повторение. Самостоятельность закрепим позже.</Text>}</View>
    </> : <View style={s.card}><Text style={s.title}>Если нужна опора</Text>{work.help ? <Text style={s.body}>{task.tip}</Text> : <Button secondary title="Небольшая подсказка" onPress={() => act('book')} />}<Button secondary title="Показать объяснение и решение" onPress={() => act('help')} /><Text style={s.small}>Подсказка, разбор или открытие формулы учитываются как помощь.</Text></View>}
    <Button secondary title="Формула к этой задаче  ↗" onPress={() => { if (!work.done) act('book'); router.push({ pathname: '/reference', params: { id: task.reference } }); }} />
  </Screen>;
}
