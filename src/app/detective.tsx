import React, { useState } from 'react';
import { router } from 'expo-router';
import { Text, View } from 'react-native';
import { Back, Button, Pill, ProgressBar, Screen, type } from '../components';
import { useProgress } from '../progress';
import { detectiveGroups, detectiveTasks } from '../study/detective-bank';
import { detectivePending } from '../study/detective';
import { studyStyles as s } from '../study/ui';
import { useLearningClock } from '../learning-ui';
import { colors } from '../theme';
export default function Detective() {
  const { progress, study } = useProgress(), state = progress.study.detective, active = state.current, now = useLearningClock(), [confirm, setConfirm] = useState(false);
  const pending = detectivePending(state), due = detectivePending(state, now), stats = Object.values(state.stats), attempts = stats.reduce((n, x) => n + x.attempts, 0), independent = stats.reduce((n, x) => n + x.independent, 0);
  return <Screen><Back /><Pill tone="amber">ОБЪЯСНИ, ПОЧЕМУ НЕВЕРНО</Pill><Text style={[type.title, { marginTop: 20 }]}>Найди ошибку</Text><Text style={s.body}>В чужом решении найди первый неверный переход, затем выбери правильное исправление. 200 задач · 10 групп по 20 · в подборке случайные 10.</Text>
    <View style={[s.card, { backgroundColor: colors.navy }]}><Text style={[s.title, { color: colors.white }]}>{independent} / {attempts}</Text><Text style={[s.body, { color: '#DEE8F8' }]}>Самостоятельно найдены и исправлены обе части. На повторение: {pending.length}, из них сейчас {due.length}.</Text></View>
    {active && <View style={[s.card, { backgroundColor: colors.amber }]}><Text style={s.title}>Продолжим твою подборку</Text><Text style={s.body}>{detectiveGroups[active.group - 1]} · разобрано {Object.values(active.work).filter(w => w.done).length}/{active.ids.length}</Text><Button title="Продолжить поиск ошибок  →" onPress={() => router.push('/detective-practice')} /><Button secondary title={confirm ? 'Завершить текущую подборку' : 'Закончить подборку досрочно'} onPress={() => { if (confirm) { study({ area: 'detective', action: { type: 'finish', session: active.id } }); setConfirm(false); } else setConfirm(true); }} />{confirm && <><Text style={s.small}>Учтённые ответы и очередь повторения останутся. Текущий выбор и нерешённые карточки будут закрыты.</Text><Button secondary title="Оставить подборку" onPress={() => setConfirm(false)} /></>}</View>}
    {detectiveGroups.map((title, i) => {
      const group = i + 1, tasks = detectiveTasks.filter(t => t.group === group), seen = tasks.filter(t => (state.stats[t.id]?.attempts ?? 0) > 0).length, repeat = due.filter(([id]) => tasks.some(t => t.id === id)).length;
      return <View style={s.card} key={group}><Text style={s.title}>{group}. {title}</Text><Text style={s.small}>Разобрано разных задач: {seen}/20</Text><View style={{ marginTop: 11 }}><ProgressBar current={seen} total={20} /></View><Button disabled={Boolean(active)} title="Найти ошибки в 10 решениях  →" onPress={() => { study({ area: 'detective', action: { type: 'start', group } }); router.push('/detective-practice'); }} />{repeat > 0 && <Button disabled={Boolean(active)} secondary title={`Повторить сейчас · ${Math.min(10, repeat)}`} onPress={() => { study({ area: 'detective', action: { type: 'start', group, review: true } }); router.push('/detective-practice'); }} />}</View>;
    })}
    <Text style={s.small}>Ошибочный выбор или помощь сохраняют задачу для повторения сразу. Для закрепления нужны три самостоятельных повтора: сейчас, через день и ещё через три дня. Статистика этого тренажёра считается отдельно от решения обычных задач.</Text>
  </Screen>;
}
