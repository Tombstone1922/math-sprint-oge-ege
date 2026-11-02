import React, { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { Button, Disclosure, Pill, ProgressBar, Screen, type } from '../components';
import { reviewTime, useLearningClock } from '../learning-ui';
import { SubjectSources, s } from '../subject-ui';
import { colors } from '../theme';
import { PHYSICS_COURSE, physicsGroups, physicsTasks } from './bank';
import { useScience } from './provider';
import { sciencePending, scienceTotals } from './state';
import { ScienceGate, ScienceSaveNotice, UnitsReference } from './ui';
export function PhysicsOverview() {
  const { state, ready, dispatch } = useScience(), [confirm, setConfirm] = useState(false), now = useLearningClock();
  if (!ready) return <ScienceGate />;
  const totals = scienceTotals(state), pending = sciencePending(state), due = sciencePending(state, now), active = state.active;
  const start = (group: number, review = false) => { dispatch({ type: 'start', group, review }); router.push('/subject-practice'); };
  return <Screen><Pressable accessibilityRole="button" accessibilityLabel="К карте физики" onPress={() => router.dismissTo({ pathname: '/subject', params: { subject: 'physics', exam: 'oge' } })} style={{ minHeight: 48, justifyContent: 'center' }}><Text style={s.link}>‹ К карте физики</Text></Pressable>
    <Pill tone="mint">ФИЗИКА · ОГЭ · №1</Pill><Text accessibilityRole="header" style={[type.title, { marginTop: 20 }]}>Физические понятия и СИ</Text><Text style={s.body}>200 заданий на соответствие · 10 групп по 20. В каждой тренировке — случайные 10.</Text>
    <Button title="Короткий урок по №1 →" onPress={() => router.push({ pathname: '/subject-lesson', params: { course: PHYSICS_COURSE } })} />
    <ScienceSaveNotice />
    {active && <View style={[s.card, { backgroundColor: colors.amber }]}><Text style={s.title}>Подборка сохранена</Text><Text style={s.body}>{active.mode === 'review' ? 'Повторение ошибок' : `Группа ${active.group}`} · {active.phase === 'view' ? 'карточки с ответами' : active.phase === 'result' ? 'итог' : 'самостоятельно'}.</Text><Button title="Продолжить физику №1 →" onPress={() => router.push('/subject-practice')} /><Button secondary title={confirm ? 'Да, завершить подборку' : 'Завершить подборку досрочно'} onPress={() => { if (!confirm) setConfirm(true); else { dispatch({ type: 'finish', session: active.id }); setConfirm(false); } }} />{confirm && <><Text style={s.small}>Проверенные ответы и очередь повторения сохранятся. Нерешённые задания не засчитываются.</Text><Button secondary title="Оставить подборку" onPress={() => setConfirm(false)} /></>}</View>}
    <View style={s.card}><Text style={s.title}>Прогресс по физике</Text><Text style={s.body}>{totals.attempts ? `Без подсказок верно: ${totals.independent} из ${totals.attempts} (${Math.round(totals.independent / totals.attempts * 100)}%). С помощью: ${totals.assisted}.` : 'Пока нет самостоятельных ответов. Просмотр карточек не увеличивает точность.'}</Text><Text style={s.small}>Считается полный ответ из трёх соответствий. Это тренировочная точность, а не баллы экзамена.</Text>
      <Button secondary title={due.length ? `Повторить ошибки по физике · ${Math.min(10, due.length)}` : 'Ошибок к повторению сейчас нет'} disabled={Boolean(active) || !due.length} onPress={() => start(1, true)} /><Text style={s.small}>На закреплении: {pending.length}.{pending.length > 0 && !due.length ? ` ${reviewTime(pending[0][1].dueAt!, now)}.` : ''} Три самостоятельных повторения: сейчас, через день и ещё через три дня.</Text>
    </View>
    <Disclosure title="Памятка единиц СИ"><UnitsReference /></Disclosure>
    <Text style={[type.section, { marginTop: 26 }]}>Выбери группу</Text><Text style={s.body}>Сначала изучишь десять карточек с ответами. Затем решишь те же задания в другом порядке; номера вариантов тоже изменятся.</Text>
    {physicsGroups.map(group => {
      const ids = physicsTasks.filter(t => t.group === group.number).map(t => t.id), seen = ids.filter(id => (state.stats[id]?.attempts ?? 0) > 0).length, stat = scienceTotals(state, group.number);
      return <View key={group.number} style={s.card}><Text style={s.title}>{group.number}. {group.title}</Text><Text style={s.body}>{group.note}</Text><Text style={s.small}>Решено разных заданий: {seen}/20{stat.attempts ? ` · без помощи: ${stat.independent}/${stat.attempts}` : ''}</Text><View style={{ marginTop: 10 }}><ProgressBar current={seen} total={20} /></View><Button disabled={Boolean(active)} title={`Начать группу ${group.number} · 10 заданий`} onPress={() => start(group.number)} /></View>;
    })}
    <Text style={s.small}>Это авторская подготовка к сопоставлениям №1: понятия и примеры, величины и единицы, закрепление составных единиц. Другие номера пока готовятся.</Text><SubjectSources subject="physics" exam="oge" />
  </Screen>;
}
