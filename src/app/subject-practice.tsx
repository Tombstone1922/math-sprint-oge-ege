import React from 'react';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { Button, Disclosure, Pill, ProgressBar, Screen, type } from '../components';
import { TaskActions } from '../task-actions';
import { cardPalette, colors } from '../theme';
import { s } from '../subject-ui';
import { answerFor, physicsGroups, scienceTask, taskSolution } from '../science/bank';
import { emptyScienceWork } from '../science/state';
import { useScience } from '../science/provider';
import { CourseBack, courseRoute, MatchingCard, MatchingSolution, ScienceGate, ScienceSaveNotice } from '../science/ui';
export default function SubjectPractice() {
  const { state, ready, dispatch } = useScience(), active = state.active;
  if (!ready) return <ScienceGate />;
  if (!active) return <Screen><CourseBack /><Text style={type.title}>Выбери группу по физике</Text><Text style={s.body}>Здесь появится твоя подборка №1.</Text><Button title="К группам физики" onPress={() => router.dismissTo(courseRoute)} /></Screen>;
  const finish = () => { dispatch({ type: 'finish', session: active.id }); router.dismissTo(courseRoute); };
  if (active.phase === 'result') {
    const works = Object.values(active.work).filter(w => w.submitted), correct = works.filter(w => w.correct).length, independent = works.filter(w => w.correct && !w.hint).length;
    return <Screen key="result" footer={<Button title="К группам физики →" onPress={finish} />}><Pill tone="mint">ПОДБОРКА ЗАВЕРШЕНА</Pill><Text accessibilityRole="header" style={[type.title, { marginTop: 22 }]}>Физика становится понятнее</Text><View style={s.card}><Text style={s.title}>Верно: {correct} из {works.length}</Text><Text style={s.body}>Самостоятельно: {independent}. С подсказками: {works.filter(w => w.hint > 0).length}.</Text><Text style={s.small}>Засчитывается совпадение всех трёх соответствий. Ошибки и помощь остаются в повторении.</Text></View><ScienceSaveNotice /></Screen>;
  }
  const guided = active.phase === 'view', id = (guided ? active.ids : active.order)[active.position], task = scienceTask(id)!, options = guided ? task.options : active.options[id];
  const work = active.work[id] ?? emptyScienceWork(), base = { session: active.id, task: id };
  const condition = <View style={s.card}><MatchingCard task={task} options={options} /></View>;
  return <Screen key={`${id}-${active.phase}`} footer={<TaskActions condition={condition} answer={!guided ? work.input : undefined} title={guided ? active.position === active.ids.length - 1 ? 'Теперь самостоятельно →' : 'Следующая карточка →' : work.submitted ? active.position === active.order.length - 1 ? 'Итог подборки →' : 'Следующее задание →' : 'Проверить ответ'} disabled={!guided && !work.submitted && work.input.length !== 3} onPress={() => dispatch({ ...base, type: guided ? 'view-next' : work.submitted ? 'next' : 'submit' })} />}>
    <CourseBack title="Сохранить и к модулю" /><Pill tone="mint">ФИЗИКА · ОГЭ №1 · {active.mode === 'review' ? 'ПОВТОРЕНИЕ' : guided ? 'С ОТВЕТОМ' : 'ТВОЙ ХОД'}</Pill>
    <Text style={s.small}>{active.group ? physicsGroups[active.group - 1].title : 'Прошлые ошибки разных групп'} · {active.position + 1}/{active.ids.length}</Text><View style={{ marginTop: 12 }}><ProgressBar current={active.position + 1} total={active.ids.length} /></View>
    <Text accessibilityRole="header" style={[type.section, { marginTop: 24 }]}>{guided ? 'Разберись в соответствии' : 'Запиши три цифры: А, Б, В'}</Text>{!guided && active.mode !== 'review' && <Text style={s.small}>Те же десять заданий. Порядок и номера вариантов перемешаны заново.</Text>}
    <View style={[s.card, { backgroundColor: cardPalette[task.colorIndex] }]}><MatchingCard task={task} options={options} /></View>
    {guided ? <MatchingSolution task={task} options={options} /> : <>
      <View style={[s.row, { justifyContent: 'center', marginTop: 22 }]}>{['А', 'Б', 'В'].map((letter, i) => <View key={letter} accessible accessibilityLabel={`Ответ ${letter}: ${work.input[i] ?? 'не выбран'}`} style={{ flex: 1, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: work.submitted && work.input[i] !== answerFor(task, options)[i] ? colors.red : colors.border, borderRadius: 15, backgroundColor: colors.white }}><Text style={s.caption}>{letter}</Text><Text style={{ color: colors.navy, fontSize: 27, lineHeight: 34, fontWeight: '800' }}>{work.input[i] ?? '—'}</Text></View>)}</View>
      {!work.submitted && <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 }}>{['1', '2', '3', '4', '5', '⌫'].map(value => { const disabled = value === '⌫' ? !work.input : work.input.length === 3; return <Pressable key={value} accessibilityRole="button" accessibilityLabel={value === '⌫' ? 'Удалить последнюю цифру' : `Ввести цифру ${value}`} accessibilityState={{ disabled }} disabled={disabled} onPress={() => dispatch({ ...base, type: 'input', value: value === '⌫' ? work.input.slice(0, -1) : work.input + value })} style={({ pressed }) => [{ width: '30%', flexGrow: 1, minHeight: 50, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 14, opacity: disabled ? .45 : 1 }, pressed && s.pressed]}><Text style={[s.title, { fontSize: 23 }]}>{value}</Text></Pressable>; })}</View>}
      {work.submitted ? <View accessibilityLiveRegion="polite"><Text style={[s.title, { marginTop: 22 }]}>{work.correct ? work.hint ? 'Верно с помощью' : 'Все три соответствия верны' : `Совпало соответствий: ${work.matched} из 3`}</Text><MatchingSolution task={task} options={options} /></View> : <Disclosure title="Подсказки по шагам" initialOpen={work.hint > 0}>
        {work.hint >= 1 && <Text style={s.body}>Вспомни смысл физического понятия, определение величины или формулу. Подставь в неё единицы вместо чисел. Проверяй буквы А, Б и В по очереди.</Text>}
        {work.hint >= 2 && <Text style={s.body}>Первое соответствие: {taskSolution(task, options)[0]}</Text>}
        {work.hint >= 3 && <MatchingSolution task={task} options={options} />}
        <Button secondary title={work.hint === 0 ? 'Небольшой намёк' : work.hint === 1 ? 'Показать первую пару' : work.hint === 2 ? 'Показать полный разбор' : 'Все подсказки открыты'} disabled={work.hint === 3} onPress={() => dispatch({ ...base, type: 'hint', level: work.hint + 1 })} /><Text style={s.small}>Ответ после подсказки учитывается как решение с помощью.</Text>
      </Disclosure>}
    </>}
    <ScienceSaveNotice />
  </Screen>;
}
