import React, { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { Back, Button, Pill, ProgressBar, Screen, type } from '../components';
import { extendedModules } from '../extended/bank';
import { extendedPending } from '../extended/progress';
import { extendedStyles as s } from '../extended/ui';
import { useProgress } from '../progress';
import { colors } from '../theme';
import { useLearningClock } from '../learning-ui';
import { WorkbookSummary } from '../workbook/ui';

export default function Extended() {
  const { number } = useLocalSearchParams<{ number?: string }>();
  const [open, setOpen] = useState(Number(number) || 20), [confirm, setConfirm] = useState(false);
  const { progress, extended } = useProgress(), state = progress.extended, active = state.active, now = useLearningClock();
  const pending = extendedPending(state), due = extendedPending(state, now);
  return <Screen>
    <Back label="Назад" />
    <Pill tone="amber">№20–25 · РАЗВЁРНУТОЕ РЕШЕНИЕ</Pill>
    <Text style={[type.title, { marginTop: 20 }]}>Вторая часть ОГЭ</Text>
    <Text style={s.body}>Шесть модулей по 200 авторских задач. В каждом — 10 групп по 20. На тренировку случайно выбираются 10 задач; решай по одной в своём темпе.</Text>
    <WorkbookSummary />
    <View style={[s.card, { backgroundColor: colors.navy }]}><Text style={[s.heading, { color: colors.white }]}>Сначала твоё решение</Text><Text style={[s.body, { color: '#DBE5F6' }]}>Бумага или черновик → подсказка при затруднении → образец решения → проверка ключевых шагов. Приложение проверяет отдельный числовой итог; полноту решения оцениваешь ты или преподаватель.</Text></View>
    {active && <View style={[s.card, { backgroundColor: colors.amber }]}>
      <Text style={s.heading}>Сохранена подборка №{active.number}</Text><Text style={s.body}>Группа {active.group} · разобрано {Object.values(active.work).filter(w => w.rating).length} из {active.ids.length}. Черновик и подсказки сохранены.</Text>
      <Button title="Продолжить с места остановки  →" onPress={() => router.push('/extended-practice')} />
      <Button title={confirm ? 'Завершить и освободить подборку' : 'Закончить подборку досрочно'} secondary onPress={() => { if (!confirm) setConfirm(true); else { extended({ type: 'finish', session: active.id }); setConfirm(false); } }} />
      {confirm && <><Text style={s.small}>Оценённые решения, очередь повторения и записанные черновики останутся в рабочей тетради. Подборка завершится.</Text><Button title="Сохранить подборку и продолжить позже" secondary onPress={() => setConfirm(false)} /></>}
    </View>}
    <Text style={[type.section, { marginTop: 26 }]}>Выбери номер</Text>
    {extendedModules.map(module => {
      const expanded = open === module.number;
      const stats = module.tasks.map(t => state.stats[t.id]).filter(Boolean), attempts = stats.reduce((sum, x) => sum + x.attempts, 0), self = stats.reduce((sum, x) => sum + x.self, 0);
      return <View style={s.card} key={module.number}>
        <Pressable accessibilityRole="button" accessibilityState={{ expanded }} onPress={() => setOpen(expanded ? 0 : module.number)}>
          <View style={s.row}><Text style={s.badge}>{module.number}</Text><View style={{ flex: 1 }}><Text style={s.heading}>{module.title}</Text><Text style={s.small}>{module.subtitle}</Text></View><Text style={s.link}>{expanded ? '⌃' : '⌄'}</Text></View>
          <Text style={s.small}>По самооценке: {self} самостоятельно / {attempts} разборов</Text>
        </Pressable>
        {expanded && <>
          <Text style={s.body}>{module.plan}</Text>
          {module.groups.map((title, index) => {
            const group = index + 1, tasks = module.tasks.filter(t => t.group === group), seen = tasks.filter(t => (state.stats[t.id]?.attempts ?? 0) > 0).length, groupDue = due.filter(([id]) => tasks.some(t => t.id === id)).length, groupPending = pending.filter(([id]) => tasks.some(t => t.id === id)).length;
            return <View key={group} style={{ borderTopWidth: 1, borderTopColor: colors.border, marginTop: 20, paddingTop: 18 }}>
              <Text style={s.heading}>{group}. {title}</Text><Text style={s.small}>Разобрано разных задач: {seen}/20 · на закреплении: {groupPending}</Text><View style={{ marginTop: 10 }}><ProgressBar current={seen} total={20} /></View>
              <Button disabled={Boolean(active)} title="Случайные 10 задач  →" onPress={() => { extended({ type: 'start', number: module.number, group }); router.push('/extended-practice'); }} />
              {groupPending > 0 && <Button disabled={Boolean(active) || !groupDue} secondary title={groupDue ? `Повторить сейчас · ${Math.min(10, groupDue)}` : 'Повторение откроется позже'} onPress={() => { extended({ type: 'start', number: module.number, group, review: true }); router.push('/extended-practice'); }} />}
            </View>;
          })}
        </>}
      </View>;
    })}
    <Text style={s.small}>Закрепление: три самостоятельных повторения по самооценке — сейчас, через день и ещё через три дня. Подсказка или ошибка числового итога возвращает задачу на начало закрепления.</Text>
    <Text style={s.small}>Основа типов: демоверсия и спецификация ФИПИ ОГЭ‑2026, проект ОГЭ‑2027. Это учебный банк по выбранным типам, а не полный официальный банк и не прогноз экзамена.</Text>
  </Screen>;
}
