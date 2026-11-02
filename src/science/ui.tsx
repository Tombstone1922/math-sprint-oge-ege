import React from 'react';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { Button, Screen, type } from '../components';
import { s } from '../subject-ui';
import { colors } from '../theme';
import { type MatchingTask, optionText, targetText, taskSolution } from './bank';
import { quantities, units } from './physics-units';
import { useScience } from './provider';
export const courseRoute = { pathname: '/subject-module' as const, params: { subject: 'physics', exam: 'oge', number: '1' } };
export function CourseBack({ title = 'К модулю' }: { title?: string }) {
  return <Pressable accessibilityRole="button" accessibilityLabel={title} onPress={() => router.dismissTo(courseRoute)} style={({ pressed }) => [{ minHeight: 48, justifyContent: 'center', paddingVertical: 10, marginBottom: 10 }, pressed && s.pressed]}><Text style={s.link}>‹ {title}</Text></Pressable>;
}
export function ScienceGate() {
  const { loadError, retryLoad } = useScience();
  return <Screen><Pressable accessibilityRole="button" accessibilityLabel="К карте физики" onPress={() => router.dismissTo({ pathname: '/subject', params: { subject: 'physics', exam: 'oge' } })} style={{ minHeight: 48, justifyContent: 'center' }}><Text style={s.link}>‹ К карте физики</Text></Pressable><Text style={type.title}>{loadError ? 'Не удалось загрузить физику' : 'Загружаем тренировку…'}</Text><Text style={s.body}>{loadError ? 'Сохранённые данные не будут заменены пустыми. Повтори загрузку.' : 'Подождём сохранённые ответы и место остановки.'}</Text>{loadError && <Button title="Повторить загрузку физики" onPress={retryLoad} />}</Screen>;
}
export function ScienceSaveNotice() {
  const { saveError, retrySave } = useScience();
  return saveError ? <View accessibilityLiveRegion="polite" style={[s.notice, { backgroundColor: colors.amber }]}><Text style={s.body}>Пока не удалось сохранить физику. Повтори сохранение перед выходом.</Text><Button title="Сохранить физику ещё раз" onPress={retrySave} /></View> : null;
}
export function MatchingCard({ task, options = task.options }: { task: MatchingTask; options?: string[] }) {
  return <View testID="physics-matching-task">
    <Text style={[s.title, { marginBottom: 10 }]}>{task.concepts ? 'Подбери пример к каждому физическому понятию.' : 'Подбери единицу СИ для каждой величины.'}</Text>
    {task.base && <Text style={[s.small, { marginBottom: 10 }]}>Здесь единицы записаны через кг, м, с, А и К.</Text>}
    <Text style={[s.caption, { marginTop: 8, marginBottom: 7 }]}>{task.concepts ? 'ФИЗИЧЕСКИЕ ПОНЯТИЯ' : 'ФИЗИЧЕСКИЕ ВЕЛИЧИНЫ'}</Text>
    {task.targets.map((id, i) => <View key={id} style={{ flexDirection: 'row', gap: 10, paddingVertical: 9 }}><Text style={[s.title, { minWidth: 24 }]}>{'АБВ'[i]})</Text><Text style={[s.body, { marginTop: 0, flex: 1, minWidth: 0, color: colors.ink }]}>{targetText(task, id)}</Text></View>)}
    <Text style={[s.caption, { marginTop: 16, marginBottom: 7 }]}>{task.concepts ? 'ПРИМЕРЫ' : 'ЕДИНИЦЫ ИЗМЕРЕНИЯ'}</Text>
    {options.map((id, i) => <View key={id} style={{ flexDirection: 'row', gap: 10, paddingVertical: 8 }}><Text style={[s.title, { minWidth: 24 }]}>{i + 1})</Text><Text style={[s.body, { marginTop: 0, flex: 1, minWidth: 0, color: colors.ink }]}>{optionText(task, id)}</Text></View>)}
  </View>;
}
export function MatchingSolution({ task, options = task.options }: { task: MatchingTask; options?: string[] }) {
  return <View testID="physics-solution" style={[s.notice, { backgroundColor: colors.mint }]}><Text style={s.title}>Разбор соответствий</Text>{taskSolution(task, options).map(text => <Text key={text} style={s.body}>{text}</Text>)}</View>;
}
export function UnitsReference() {
  return <View><Text style={s.body}>Название величины отвечает на вопрос «что измеряем?», единица — «в чём?». Варианты ниже не являются ответами к одному конкретному заданию.</Text>{units.map(u => <View key={u.id} style={{ borderTopWidth: 1, borderTopColor: colors.border, paddingVertical: 12 }}><Text style={s.title}>{u.name}: {u.symbol}</Text><Text style={s.small}>{quantities.filter(q => q.unit === u.id).map(q => q.title).join(' · ')}</Text>{u.base !== u.symbol && <Text style={s.small}>Через основные единицы: {u.base}</Text>}</View>)}</View>;
}
export function ScienceResume() {
  const { state, ready } = useScience();
  return ready && state.active ? <Pressable accessibilityRole="button" accessibilityLabel="Продолжить физику №1" onPress={() => router.push('/subject-practice')} style={({ pressed }) => [s.card, pressed && s.pressed]}><Text style={s.title}>Продолжить физику №1 →</Text><Text style={s.body}>{state.active.phase === 'view' ? 'Карточки с объяснениями' : state.active.phase === 'result' ? 'Итог сохранённой подборки' : 'Самостоятельная тренировка'} · место остановки сохранено</Text></Pressable> : null;
}
