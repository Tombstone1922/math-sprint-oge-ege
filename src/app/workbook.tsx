import React, { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Back, Button, Pill, Screen, type } from '../components';
import { extendedModule, extendedTask } from '../extended/bank';
import { useLearningClock } from '../learning-ui';
import { useProgress } from '../progress';
import { ExamPrompt, ExamSolution } from '../study/task-view';
import { colors } from '../theme';
import { errorKinds, sortedPages, type Page } from '../workbook/model';
import { WorkbookPhotos, formatWorkDate, ws as s } from '../workbook/ui';

export default function WorkbookScreen() {
  const { id } = useLocalSearchParams<{ id?: string }>(), { progress } = useProgress();
  if (id) {
    const page = progress.workbook.pages[id];
    return page ? <WorkPage key={id} page={page} /> : <Screen><Back /><Text style={type.title}>Работа не найдена</Text><Button title="К рабочей тетради" onPress={() => router.replace('/workbook')} /></Screen>;
  }
  return <WorkbookList />;
}
function WorkbookList() {
  const { progress } = useProgress(), [number, setNumber] = useState(0), [filter, setFilter] = useState('all'), [query, setQuery] = useState(''), [limit, setLimit] = useState(20);
  const pages = sortedPages(progress.workbook), q = query.trim().toLocaleLowerCase('ru-RU');
  const shown = pages.filter(p => {
    const task = extendedTask(p.taskId)!;
    return (!number || task.number === number) && (filter !== 'waiting' || !p.reviewedAt) && (filter !== 'errors' || p.kinds.length > 0 || Boolean(p.mistake.trim()) || p.step !== null) && (filter !== 'repeat' || progress.extended.stats[p.taskId]?.dueAt != null) && (!q || `${task.condition} ${p.draft} ${p.mistake} ${p.teacherComment}`.toLocaleLowerCase('ru-RU').includes(q));
  });
  return <Screen><Back label="К занятиям" /><Pill tone="mint">ОГЭ · №20–25</Pill><Text style={[type.title, { marginTop: 20 }]}>Рабочая тетрадь</Text><Text style={s.body}>Все твои попытки остаются здесь: фото листов, исходный черновик, разбор ошибок и замечания после проверки.</Text>
    <View style={[s.card, { backgroundColor: colors.navy }]}><Text style={[s.heading, { color: colors.white }]}>{pages.length} сохранённых работ</Text><Text style={[s.body, { color: '#DBE5F6' }]}>Ожидают проверки: {pages.filter(p => !p.reviewedAt).length} · с фотографиями: {pages.filter(p => p.photos.length).length}</Text></View>
    <TextInput accessibilityLabel="Поиск по тетради" value={query} onChangeText={value => { setQuery(value); setLimit(20); }} placeholder="Условие, ошибка или комментарий…" placeholderTextColor={colors.muted} style={[s.input, { minHeight: 54 }]} />
    <View style={s.wrap}>{[0, 20, 21, 22, 23, 24, 25].map(n => <Pressable accessibilityRole="button" aria-selected={number === n} accessibilityState={{ selected: number === n }} key={n} onPress={() => { setNumber(n); setLimit(20); }} style={[s.chip, number === n && s.selected]}><Text style={s.chipText}>{n ? `№${n}` : 'Все номера'}</Text></Pressable>)}</View>
    <View style={s.wrap}>{[['all', 'Все работы'], ['waiting', 'Ждут проверки'], ['errors', 'Есть ошибки'], ['repeat', 'На повторении']].map(([value, label]) => <Pressable accessibilityRole="button" aria-selected={filter === value} accessibilityState={{ selected: filter === value }} key={value} onPress={() => { setFilter(value); setLimit(20); }} style={[s.chip, filter === value && s.selected]}><Text style={s.chipText}>{label}</Text></Pressable>)}</View>
    {!shown.length && <View style={s.card}><Text style={s.heading}>{pages.length ? 'По этим условиям работ нет' : 'Начнём с первой работы'}</Text><Text style={s.body}>{pages.length ? 'Попробуй другой номер, фильтр или запрос.' : 'Открой задачу второй части, запиши решение или прикрепи фото. Работа сохранится автоматически.'}</Text><Button title="К заданиям второй части  →" onPress={() => router.push('/extended')} /></View>}
    {shown.slice(0, limit).map(page => {
      const task = extendedTask(page.taskId)!, group = extendedModule(task.number)!.groups[task.group - 1];
      return <Pressable accessibilityRole="button" accessibilityLabel={`Открыть работу №${task.number}, вариант ${task.index + 1}, ${formatWorkDate(page.createdAt)}`} key={page.id} onPress={() => router.push({ pathname: '/workbook', params: { id: page.id } })} style={s.card}><Pill tone={page.reviewedAt ? 'mint' : 'amber'}>{page.reviewedAt ? 'ПРОВЕРКА ОТМЕЧЕНА' : 'ЖДЁТ ПРОВЕРКИ'}</Pill><Text style={[s.heading, { marginTop: 12 }]}>№{task.number} · {group}</Text><Text style={s.small}>{page.source === 'exam' ? 'Пробный экзамен' : 'Тренировка'} · группа {task.group} · вариант {task.index + 1}{'\n'}{formatWorkDate(page.createdAt)}</Text><Text numberOfLines={3} style={s.body}>{page.mistake || task.condition}</Text><Text style={s.small}>Фото: {page.photos.length} · {page.compared ? 'образец открыт' : 'своё решение'}{progress.extended.stats[task.id]?.dueAt != null ? ' · на повторении' : ''}</Text><Text style={s.link}>Открыть работу  →</Text></Pressable>;
    })}
    {shown.length > limit && <Button secondary title={`Показать ещё · осталось ${shown.length - limit}`} onPress={() => setLimit(n => n + 20)} />}
    <Text style={s.small}>Отметка проверки и комментарий вводятся вручную на этом устройстве. Тетрадь не проверяет доказательства автоматически.</Text>
  </Screen>;
}
function WorkPage({ page }: { page: Page }) {
  const { progress, workbook, extended } = useProgress(), now = useLearningClock(), task = extendedTask(page.taskId)!, active = progress.extended.active;
  const stat = progress.extended.stats[task.id], pending = stat?.dueAt != null, due = pending && stat.dueAt! <= now;
  const current = page.source === 'practice' && active?.id === page.session && active.ids[active.position] === task.id;
  const ref = { number: task.number, moduleId: 'extended' as const, group: task.group, problemId: task.id };
  const edit = (patch: { mistake?: string; teacherComment?: string; step?: number | null }) => { void workbook({ type: 'edit', id: page.id, ...patch }); };
  return <Screen><Back label="Назад" /><Pill tone="mint">МОЯ РАБОТА · №{task.number}</Pill><Text style={[type.title, { marginTop: 18 }]}>Решение и разбор</Text><Text style={s.small}>{page.source === 'exam' ? 'Пробный экзамен' : 'Тренировка'} · группа {task.group} · вариант {task.index + 1}{'\n'}{formatWorkDate(page.createdAt)}</Text>
    <ExamPrompt task={ref} />
    <View style={s.card}><Text style={s.heading}>Твоё исходное решение</Text><Text selectable style={s.body}>{page.draft || (page.paper ? 'Решение выполнено на бумаге.' : 'Текстового черновика пока нет. Прикрепи фото своего решения.')}</Text>{Boolean(page.input) && <Text selectable style={s.body}>Числовой итог: {page.input}</Text>}{page.rating && <Text style={s.small}>Самооценка: {page.rating === 'self' ? 'самостоятельно' : page.rating === 'help' ? 'с помощью' : 'нужно повторить'}.</Text>}{current && !page.compared && <Button secondary title="Вернуться к своему черновику" onPress={() => router.dismissTo('/extended-practice')} />}</View>
    <WorkbookPhotos page={page} />
    {page.compared ? <ExamSolution task={ref} /> : <View style={s.card}><Text style={s.heading}>Сначала своё решение</Text><Text style={s.body}>Когда закончишь, открой образец и сравни шаги. Исходный черновик сохранится. После сравнения его уже нельзя переписать.</Text><Button disabled={!page.paper && !page.draft.trim() && !page.photos.length} title="Сравнить с образцом решения" onPress={() => { void workbook({ type: 'compare', id: page.id }); }} /></View>}
    <View style={s.card}><Text style={s.heading}>Где я ошибся</Text><Text style={s.small}>Выбери причины и запиши, что нужно изменить в следующей попытке.</Text><View style={s.wrap}>{errorKinds.map((label, kind) => <Pressable key={label} accessibilityRole="checkbox" accessibilityLabel={label} aria-checked={page.kinds.includes(kind)} accessibilityState={{ checked: page.kinds.includes(kind) }} onPress={() => { void workbook({ type: 'kind', id: page.id, kind }); }} style={[s.chip, page.kinds.includes(kind) && s.selected]}><Text style={s.chipText}>{page.kinds.includes(kind) ? '✓ ' : ''}{label}</Text></Pressable>)}</View>
      {page.compared && <><Text style={[s.heading, { marginTop: 20 }]}>С каким шагом было трудно</Text><Text style={s.small}>Укажи соответствующий шаг образца.</Text>{task.steps.map((step, i) => <Pressable key={i} accessibilityRole="radio" accessibilityLabel={`Трудный шаг ${i + 1}: ${step.title}`} aria-checked={page.step === i} accessibilityState={{ checked: page.step === i }} onPress={() => edit({ step: page.step === i ? null : i })} style={[s.chip, { marginTop: 10 }, page.step === i && s.selected]}><Text style={s.chipText}>{i + 1}. {step.title}</Text></Pressable>)}</>}
      <TextInput accessibilityLabel="Мой разбор ошибки" multiline textAlignVertical="top" maxLength={3000} placeholder="Например: разделил на выражение, не проверив, что оно не равно нулю…" placeholderTextColor={colors.muted} value={page.mistake} onChangeText={mistake => edit({ mistake })} style={s.input} /><Text style={s.small}>{page.mistake.length}/3000 · сохраняется автоматически</Text>
    </View>
    <View style={s.card}><Pill tone={page.reviewedAt ? 'mint' : 'amber'}>{page.reviewedAt ? 'ПРОВЕРКА ОТМЕЧЕНА' : 'ЖДЁТ ПРОВЕРКИ'}</Pill><Text style={[s.heading, { marginTop: 12 }]}>После проверки преподавателем</Text><Text style={s.body}>Запиши замечания преподавателя после совместного разбора и отметь, что работа проверена.</Text><TextInput accessibilityLabel="Комментарий преподавателя" multiline textAlignVertical="top" maxLength={3000} placeholder="Что исправить, какие обоснования добавить…" placeholderTextColor={colors.muted} value={page.teacherComment} onChangeText={teacherComment => edit({ teacherComment })} style={s.input} /><Pressable accessibilityRole="checkbox" accessibilityLabel="Работа проверена преподавателем" aria-checked={Boolean(page.reviewedAt)} accessibilityState={{ checked: Boolean(page.reviewedAt) }} onPress={() => { void workbook({ type: 'review', id: page.id, reviewed: !page.reviewedAt }); }} style={[s.chip, { marginTop: 14 }, Boolean(page.reviewedAt) && s.selected]}><Text style={s.chipText}>{page.reviewedAt ? '☑' : '☐'} Работа проверена преподавателем</Text></Pressable>{page.reviewedAt && <Text style={s.small}>Отметка: {formatWorkDate(page.reviewedAt)}. Изменение комментария или фото снимает отметку проверки.</Text>}</View>
    <View style={s.card}><Text style={s.heading}>Закрепить решение</Text><Text style={s.body}>{pending ? `Задача на повторении · самостоятельных повторений: ${stat.streak}/3. ${due ? 'Можно повторить сейчас.' : `Следующее: ${formatWorkDate(stat.dueAt!)}.`}` : 'Верни именно эту задачу на закрепление. Повторение создаст новую работу, а этот разбор останется в тетради.'}</Text><Button secondary disabled={pending} title={pending ? 'Задача уже на повторении' : 'Поставить задачу на повторение'} onPress={() => { void workbook({ type: 'repeat', id: page.id }); }} />
      {due && <Button disabled={Boolean(active)} title="Повторить эту задачу  →" onPress={() => { extended({ type: 'start-task', taskId: task.id, review: true }); router.push('/extended-practice'); }} />}
      {active && <Text style={s.small}>Чтобы начать новое повторение, сначала закончи сохранённую подборку №{active.number}.</Text>}
      <Text style={s.small}>Три самостоятельных повторения: сейчас, через день и ещё через три дня. Комментарий и отметка проверки не меняют баллы и самооценку прошлой попытки.</Text>
    </View>
    {current && <Button title="Вернуться к текущей задаче  →" onPress={() => router.dismissTo('/extended-practice')} />}
    <Button secondary title="Все сохранённые работы" onPress={() => router.push('/workbook')} />
  </Screen>;
}
