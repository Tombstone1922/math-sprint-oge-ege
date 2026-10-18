import React from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Button, Pill, ProgressBar, Screen, type } from '../components';
import { extendedModule, extendedTask } from '../extended/bank';
import { emptyWork } from '../extended/progress';
import { GraphFigure } from '../extended/figure';
import { extendedStyles as s } from '../extended/ui';
import { GeometryFigure } from '../geometry-figure';
import { useProgress } from '../progress';
import { cardPalette, colors } from '../theme';

export default function ExtendedPractice() {
  const { progress, extended } = useProgress(), active = progress.extended.active;
  if (!active) return <Screen><Text style={type.title}>Выбери задачу</Text><Text style={s.body}>Здесь появится твоя подборка второй части.</Text><Button title="К номерам 20–25" onPress={() => router.dismissTo('/extended')} /></Screen>;
  const module = extendedModule(active.number)!, id = active.ids[active.position], task = id ? extendedTask(id) : null;
  const results = Object.values(active.work).filter(w => w.rating);
  if (!task) return <Screen key="summary"><Pill tone="mint">ПОДБОРКА РАЗОБРАНА</Pill><Text style={[type.title, { marginTop: 22 }]}>Теперь понятнее</Text><Text style={s.body}>№{active.number} · {module.groups[active.group - 1]}</Text><View style={s.card}><Text style={s.heading}>Самооценка {results.length} решений</Text><Text style={s.body}>Самостоятельно: {results.filter(w => w.rating === 'self').length}{'\n'}Разобрался с помощью: {results.filter(w => w.rating === 'help').length}{'\n'}Нужно повторить: {results.filter(w => w.rating === 'repeat').length}</Text><Text style={s.small}>Это учебная самооценка. Экзаменационные баллы за полноту решения здесь не выставляются.</Text></View><Button title="К другим задачам  →" onPress={() => { extended({ type: 'finish', session: active.id }); router.dismissTo('/extended'); }} /></Screen>;
  const work = active.work[id] ?? emptyWork(), session = active.id, index = active.position;
  const allChecked = work.checks.length === task.checklist.length;
  return <Screen key={id}>
    <Pressable accessibilityRole="button" onPress={() => router.dismissTo('/extended')} style={{ paddingVertical: 12 }}><Text style={s.link}>‹  Сохранить и к модулям</Text></Pressable>
    <Pill tone={active.mode === 'review' ? 'mint' : 'amber'}>№{task.number} · {active.mode === 'review' ? 'ПОВТОРЕНИЕ' : 'ПОЛНОЕ РЕШЕНИЕ'}</Pill>
    <Text style={[s.heading, { marginTop: 17 }]}>{module.groups[active.group - 1]}</Text><Text style={s.small}>Задача {index + 1} из {active.ids.length} · группа {active.group} · вариант {task.index + 1}</Text><View style={{ marginTop: 12 }}><ProgressBar current={index} total={active.ids.length} /></View>
    <View style={[s.card, { backgroundColor: cardPalette[task.colorIndex], padding: 18 }]}>
      {task.fractionDisplay ? <View accessible accessibilityLabel={task.condition}>
        <Text style={styles.condition}>Решите {task.fractionDisplay.inequality ? 'неравенство' : 'уравнение'}.</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
          <View style={{ alignItems: 'center', maxWidth: '100%' }}><Text style={[styles.condition, { borderBottomWidth: 1.5, borderBottomColor: colors.ink, paddingHorizontal: 4, paddingBottom: 4, textAlign: 'center' }]}>{task.fractionDisplay.top}</Text><Text style={[styles.condition, { paddingTop: 4 }]}>{task.fractionDisplay.bottom}</Text></View>
          <Text style={styles.condition}>{task.fractionDisplay.tail}</Text>
        </View>
      </View> : <Text selectable style={styles.condition}>{task.condition}</Text>}
      {task.scene && <GeometryFigure figure={{ kind: 'grid-scene', scene: task.scene, caption: 'Рисунок к условию. Нажми, чтобы увеличить.' }} />}
      {task.graph && !work.revealed && <Text style={s.small}>Построй график на бумаге. Образец появится при сравнении решения.</Text>}
    </View>
    <Button secondary title="Справочник формул ↗" onPress={() => { if (!work.revealed && !work.rating && work.hint === 0) extended({ type: 'hint', session, index }); router.push('/reference'); }} />
    {!work.revealed ? <>
      <View style={s.card}>
        <Text style={s.heading}>Твой ход решения</Text><Text style={s.small}>Запиши основные преобразования и основания. Можно решить на бумаге и отметить это ниже.</Text>
        <TextInput accessibilityLabel="Черновик решения" placeholder="Дано, идея, шаги и вывод…" placeholderTextColor={colors.muted} multiline textAlignVertical="top" maxLength={6000} value={work.draft} onChangeText={draft => extended({ type: 'edit', session, index, draft })} style={[styles.input, { minHeight: 160 }]} />
        <Text style={s.small}>{work.draft.length}/6000 · черновик сохраняется на устройстве</Text>
        <Pressable accessibilityRole="checkbox" accessibilityLabel="Решил на бумаге" accessibilityState={{ checked: work.paper }} onPress={() => extended({ type: 'edit', session, index, paper: !work.paper })} style={styles.check}><Text style={styles.checkMark}>{work.paper ? '☑' : '☐'}</Text><Text style={[s.body, { marginTop: 0, flex: 1 }]}>Решил на бумаге</Text></Pressable>
        {task.answerSpec?.kind === 'numbers' && <>
          <Text style={[s.heading, { marginTop: 14 }]}>Числовой итог</Text><Text style={s.small}>Необязательно. Несколько корней разделяй точкой с запятой; допустимы дроби a/b.</Text>
          <TextInput accessibilityLabel="Числовой итог" placeholder="Твой ответ" placeholderTextColor={colors.muted} maxLength={160} autoCapitalize="none" autoCorrect={false} value={work.input} onChangeText={input => extended({ type: 'edit', session, index, input })} style={styles.input} />
          <Button title="Проверить только итог" secondary disabled={!work.input.trim()} onPress={() => extended({ type: 'check', session, index })} />
          {work.checked !== undefined && <Text accessibilityLiveRegion="polite" style={[s.body, { color: work.checked ? colors.green : colors.red }]}>{work.checked ? 'Числовой итог совпал. Теперь проверь полноту хода решения.' : 'Итог не совпал. Проверь вычисления, ограничения и все возможные корни.'}</Text>}
        </>}
      </View>
      <View style={s.card}><Text style={s.heading}>Если застрял</Text>{task.clues.slice(0, work.hint).map((clue, i) => <Text key={i} style={s.body}>{i + 1}. {clue}</Text>)}<Button secondary disabled={work.hint >= 2} title={work.hint === 0 ? 'Небольшой намёк' : work.hint === 1 ? 'Показать первый шаг' : 'Обе подсказки открыты'} onPress={() => extended({ type: 'hint', session, index })} /><Text style={s.small}>Подсказки учитываются в самооценке и добавляют задачу на закрепление.</Text></View>
      <Button title="Сравнить с решением  →" disabled={!work.paper && !work.draft.trim()} onPress={() => extended({ type: 'reveal', session, index })} /><Text style={s.small}>Сначала запиши свой ход или отметь решение на бумаге. После сравнения исходный черновик останется для проверки.</Text>
    </> : <>
      {work.draft && <View style={s.card}><Text style={s.heading}>Твой исходный черновик</Text><Text selectable style={s.body}>{work.draft}</Text></View>}
      <View style={s.card}><Pill tone="mint">ОБРАЗЕЦ РЕШЕНИЯ</Pill>{task.graph && <GraphFigure graph={task.graph} />}{task.steps.map((step, i) => <View key={i} style={{ marginTop: 19 }}><Text style={s.heading}>{i + 1}. {step.title}</Text><Text selectable style={s.body}>{step.text}</Text></View>)}<View style={styles.answer}><Text style={s.small}>ИТОГ</Text><Text selectable style={s.heading}>{task.answer}</Text></View><Text style={s.small}>{task.pitfall}</Text></View>
      <View style={s.card}><Text style={s.heading}>Сверь своё решение</Text><Text style={s.small}>Отмечай то, что присутствовало в твоём решении или теперь стало понятно после разбора. Совпадение с образцом слово в слово не требуется.</Text>{task.checklist.map((item, i) => <Pressable key={i} accessibilityRole="checkbox" accessibilityLabel={item} accessibilityState={{ checked: work.checks.includes(i), disabled: Boolean(work.rating) }} disabled={Boolean(work.rating)} onPress={() => extended({ type: 'tick', session, index, item: i })} style={styles.check}><Text style={styles.checkMark}>{work.checks.includes(i) ? '☑' : '☐'}</Text><Text style={[s.body, { flex: 1, marginTop: 0 }]}>{item}</Text></Pressable>)}
        {!work.rating ? <>
          <Text style={s.small}>Самостоятельно — только если все эти шаги были в твоей работе до открытия образца. Если дополнил решение по разбору, выбери «с помощью».</Text>
          <Button title="Решил самостоятельно" disabled={!allChecked || work.hint > 0 || work.wrong} onPress={() => extended({ type: 'rate', session, index, rating: 'self' })} />
          <Button title="Разобрался с помощью" secondary disabled={!allChecked} onPress={() => extended({ type: 'rate', session, index, rating: 'help' })} />
          <Button title="Нужно повторить" secondary onPress={() => extended({ type: 'rate', session, index, rating: 'repeat' })} />
          {(work.hint > 0 || work.wrong) && <Text style={s.small}>Была подсказка или ошибка итога. Самостоятельность закрепим в следующем повторении.</Text>}
        </> : <Text accessibilityLiveRegion="polite" style={[s.body, { color: colors.green }]}>Самооценка сохранена: {work.rating === 'self' ? 'самостоятельно' : work.rating === 'help' ? 'разобрался с помощью' : 'нужно повторить'}.</Text>}
      </View>
      {work.rating && <Button title={index + 1 < active.ids.length ? 'Следующая задача  →' : 'Посмотреть итог подборки  →'} onPress={() => extended({ type: 'next', session, index })} />}
    </>}
  </Screen>;
}
const styles = StyleSheet.create({ condition: { color: colors.ink, fontSize: 18, lineHeight: 28, fontWeight: '600' }, input: { padding: 14, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background, color: colors.ink, fontSize: 16, lineHeight: 24, marginTop: 12 }, check: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 13, minHeight: 48 }, checkMark: { fontSize: 23, color: colors.blue }, answer: { backgroundColor: colors.mint, padding: 16, borderRadius: 16, marginTop: 20 } });
