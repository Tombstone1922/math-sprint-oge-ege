import React, { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { Back, Button, Pill, Screen, type } from '../components';
import { useProgress } from '../progress';
import { examHasWork, examRemaining, examResults } from '../study/exam';
import { examClock, useExamNow } from '../study/exam-clock';
import { studyStyles as s } from '../study/ui';
import { colors } from '../theme';
export default function ExamHub() {
  const { progress, study } = useProgress(), exam = progress.study.exam, current = exam.current;
  const [timed, setTimed] = useState(true);
  const now = useExamNow(current, id => study({ area: 'exam', action: { type: 'sync', id } }));
  const active = current && !current.finishedAt, remaining = current ? examRemaining(current, now) : null;
  const history = [current, ...exam.history].filter((e): e is NonNullable<typeof e> => Boolean(e?.finishedAt));
  return <Screen><Back label="К модулям" /><Pill tone="amber">ОДНА РАБОТА · №1–25</Pill><Text style={[type.title, { marginTop: 20 }]}>Пробный экзамен</Text><Text style={s.body}>Учебный вариант ОГЭ из наших банков. №1–5 связаны одним условием. Дальше — алгебра, вероятность, геометрия и вторая часть.</Text>
    <View style={[s.card, { backgroundColor: colors.navy }]}><Text style={[s.title, { color: colors.white }]}>Решай как на экзамене</Text><Text style={[s.body, { color: '#DBE6F8' }]}>Ответы и решения откроются после сдачи. Можно переходить между номерами, менять ответы и отмечать задачи, к которым нужно вернуться.</Text></View>
    {active ? <View style={[s.card, { backgroundColor: colors.amber }]}><Text style={s.title}>Работа сохранена</Text><Text style={s.body}>Есть ответ или решение: {current.tasks.filter(t => examHasWork(t, current.work[t.number])).length}/25.{remaining !== null ? `\nОсталось: ${examClock(remaining)}. Таймер идёт и вне приложения.` : '\nБез ограничения времени.'}</Text><Button title="Продолжить экзамен  →" onPress={() => router.push('/exam')} /></View> : <View style={s.card}>
      <Text style={s.title}>Выбери режим</Text>
      <View style={{ gap: 8, marginTop: 13 }}>{[{ title: 'С таймером · 3 ч 55 мин', value: true }, { title: 'Без ограничения времени', value: false }].map(item => <Pressable key={item.title} accessibilityRole="radio" accessibilityState={{ checked: timed === item.value }} onPress={() => setTimed(item.value)} style={[s.option, timed === item.value && s.selected]}><Text style={s.title}>{item.title}</Text></Pressable>)}</View>
      <Text style={s.small}>{timed ? 'Таймер не останавливается при сворачивании и закрытии приложения. По истечении времени работа сдаётся автоматически.' : 'Можно вернуться к работе позже. Ответы сохранятся на устройстве.'}</Text>
      <Button title="Начать новый вариант  →" onPress={() => { study({ area: 'exam', action: { type: 'start', timed } }); router.push('/exam'); }} />
    </View>}
    <View style={s.card}><Text style={s.title}>Как считается результат</Text><Text style={s.body}>№1–19: автоматическая проверка, до 19 баллов. №20–25: сравнение с образцом и ручная оценка 0–2 за каждое задание. Учебный итог до 31 балла включает эту ручную оценку.</Text><Text style={s.small}>Баллы второй части вводишь ты или преподаватель. Автоматической проверки доказательств нет. Ошибки и пропуски первой части попадут в повторение после сдачи. Эти результаты учитываются отдельно от тренировочной точности.</Text></View>
    {history.length > 0 && <><Text style={[type.section, { marginTop: 25 }]}>Последние работы</Text>{history.map(e => { const r = examResults(e); return <View style={s.card} key={e.id}><Text style={s.title}>{new Date(e.startedAt).toLocaleString('ru-RU', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })}</Text><Text style={s.body}>Первая часть: {r.automatic}/19 · вручную оценено: {r.scored}/6{r.total !== null ? `\nУчебный итог: ${r.total}/31` : ''}</Text><Button secondary title="Открыть работу и разбор" onPress={() => router.push({ pathname: '/exam', params: { id: e.id } })} /></View>; })}</>}
    <Text style={s.small}>Структура сверена с материалами ФИПИ ОГЭ‑2026 и проекта ОГЭ‑2027. Авторский учебный вариант по выбранным типам не является официальным КИМ. На устройстве хранятся текущая работа и до пяти предыдущих.</Text>
  </Screen>;
}
