import React, { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { Button, Disclosure, Screen, type } from '../components';
import { useProgress } from '../progress';
import { examHasWork, examRemaining, examResults } from '../study/exam';
import { examClock, useExamNow } from '../study/exam-clock';
import { studyStyles as s } from '../study/ui';
import { colors } from '../theme';
import { weeklyPeriod, weeklyTitle, weeklyVariants } from '../study/weekly';
import { useWeeklyNow } from '../study/weekly-clock';
import { WeeklyVariants } from '../study/weekly-ui';
export default function ExamHub() {
  const { progress, study } = useProgress(), exam = progress.study.exam, current = exam.current;
  const [timed, setTimed] = useState(true), week = weeklyPeriod(useWeeklyNow()).week;
  const variants = useMemo(() => weeklyVariants(week), [week]);
  const now = useExamNow(current, id => study({ area: 'exam', action: { type: 'sync', id } }));
  const active = current && !current.finishedAt, remaining = current ? examRemaining(current, now) : null;
  const history = [current, ...exam.history].filter((e): e is NonNullable<typeof e> => Boolean(e?.finishedAt));
  return <Screen><Text style={type.eyebrow}>ОТ ТРЕНИРОВКИ К ЭКЗАМЕНУ</Text><Text style={[type.title, { marginTop: 9 }]}>Варианты ОГЭ</Text><Text style={[type.body, { marginTop: 8 }]}>Полные учебные работы №1–25 из нашей базы. Разбор — после сдачи.</Text>
    {active ? <View style={[s.card, { backgroundColor: colors.bluePale }]}><Text style={s.title}>Продолжим работу</Text>{current.weekly && <Text style={s.body}>{weeklyTitle(current.weekly)}</Text>}<Text style={s.body}>Есть ответ или решение: {current.tasks.filter(t => examHasWork(t, current.work[t.number])).length}/25.{remaining !== null ? `\nОсталось: ${examClock(remaining)}` : '\nБез ограничения времени.'}</Text><Button title="Продолжить экзамен →" onPress={() => router.push('/exam')} /></View> : <>
      <Text style={[s.small, { marginTop: 22, fontWeight: '700' }]}>Режим для выбранного варианта</Text><View style={{ flexDirection: 'row', gap: 8, marginTop: 8 }}>{[{ title: 'С таймером', value: true }, { title: 'Без таймера', value: false }].map(item => <Pressable key={item.title} accessibilityRole="radio" aria-checked={timed === item.value} accessibilityState={{ checked: timed === item.value }} onPress={() => setTimed(item.value)} style={[s.chip, { flex: 1, borderRadius: 13, alignItems: 'center', paddingVertical: 13 }, timed === item.value && s.selected]}><Text style={s.chipText}>{item.title}</Text></Pressable>)}</View><Text style={s.small}>{timed ? '3 ч 55 мин · таймер идёт и вне приложения' : 'Можно решать в своём темпе и вернуться позже'}</Text>
    </>}
    <WeeklyVariants variants={variants} timed={timed} />
    <Disclosure title="Как считается результат"><Text style={s.body}>№1–19 проверяются автоматически: до 19 баллов. №20–25 оцениваешь ты или преподаватель вручную, по 0–2 балла. Учебный итог до 31 балла включает эту ручную оценку.</Text><Text style={s.small}>Ошибки и пропуски первой части попадут в повторение после сдачи. Автоматической проверки доказательств нет; тренировочная точность считается отдельно.</Text></Disclosure>
    {history.length > 0 && <Disclosure title={`Последние работы · ${history.length}`}>{history.map(e => { const r = examResults(e); return <Pressable accessibilityRole="button" accessibilityLabel={`Открыть работу ${e.weekly ? weeklyTitle(e.weekly) : new Date(e.startedAt).toLocaleDateString('ru-RU')}`} key={e.id} onPress={() => router.push({ pathname: '/exam', params: { id: e.id } })} style={{ borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 15 }}><Text style={[s.title, { fontSize: 16 }]}>{e.weekly ? weeklyTitle(e.weekly) : 'Случайный вариант'}</Text><Text style={s.small}>{new Date(e.startedAt).toLocaleDateString('ru-RU')} · первая часть {r.automatic}/19 · вручную {r.scored}/6{r.total !== null ? ` · итог ${r.total}/31` : ''}  ›</Text></Pressable>; })}</Disclosure>}
    <Text style={[s.small, { marginTop: 22 }]}>Авторские учебные варианты по выбранным типам. Основа структуры — ОГЭ‑2026 и проект ОГЭ‑2027; это не официальные КИМ.</Text>
  </Screen>;
}
