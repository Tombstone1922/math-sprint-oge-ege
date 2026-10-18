import React, { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, Text, TextInput, View } from 'react-native';
import { Back, Button, Pill, Screen, type } from '../components';
import { GeometryFigure } from '../geometry-figure';
import { useProgress } from '../progress';
import { formulaEntries, formulaMatchesModule, type FormulaEntry } from '../study/reference';
import { FormulaIllustration } from '../study/formula-illustrations';
import { quizSolutions } from '../study/quiz-solutions';
import { MathLine, studyStyles as s } from '../study/ui';
import { colors } from '../theme';
export default function Reference() {
  const { id, module } = useLocalSearchParams<{ id?: string; module?: string }>(), { progress, study } = useProgress();
  const [query, setQuery] = useState(''), [category, setCategory] = useState(''), [favorites, setFavorites] = useState(false), [topic, setTopic] = useState(Boolean(module && formulaEntries.some(f => formulaMatchesModule(f, module)))), [open, setOpen] = useState(id ?? '');
  const normalize = (s: string) => s.toLocaleLowerCase('ru-RU').replaceAll('ё', 'е'), term = normalize(query.trim());
  const ordered = id ? [...formulaEntries.filter(f => f.id === id), ...formulaEntries.filter(f => f.id !== id)] : formulaEntries;
  const shown = ordered.filter(f => (!category || f.category === category) && (!favorites || progress.study.favorites.includes(f.id)) && (!topic || Boolean(module && formulaMatchesModule(f, module))) && (!term || normalize(`${f.title} ${f.formula} ${f.notation} ${f.tags ?? ''}`).includes(term)));
  return <Screen><Back /><Pill tone="mint">ПОНИМАТЬ, А НЕ ЗУБРИТЬ</Pill><Text style={[type.title, { marginTop: 20 }]}>Справочник формул</Text><Text style={s.body}>{formulaEntries.length} карточек: обозначения, условия применения, пример и короткая проверка. Звёздочка сохраняет формулу в избранном.</Text>
    <TextInput accessibilityLabel="Поиск формулы" placeholder="Например, Пифагор, дроби, проценты…" placeholderTextColor={colors.muted} value={query} onChangeText={setQuery} maxLength={100} style={s.input} />
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7, marginTop: 14 }}>{['Все', 'Арифметика', 'Алгебра', 'Геометрия', 'Вероятность'].map(item => <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: !topic && (category || 'Все') === item }} onPress={() => { setCategory(item === 'Все' ? '' : item); setTopic(false); }} style={[s.chip, !topic && (category || 'Все') === item && s.selected]}><Text style={s.chipText}>{item}</Text></Pressable>)}{module && formulaEntries.some(f => formulaMatchesModule(f, module)) && <Pressable accessibilityRole="button" accessibilityState={{ selected: topic }} onPress={() => { setTopic(true); setCategory(''); }} style={[s.chip, topic && s.selected]}><Text style={s.chipText}>Моя тема</Text></Pressable>}<Pressable accessibilityRole="checkbox" accessibilityLabel="Только избранные формулы" accessibilityState={{ checked: favorites }} onPress={() => setFavorites(!favorites)} style={[s.chip, favorites && s.selected]}><Text style={s.chipText}>★ Избранное</Text></Pressable></View>
    <Text style={s.small}>Найдено: {shown.length}</Text>
    {!shown.length && <View style={s.card}><Text style={s.title}>Подходящей карточки пока нет</Text><Button secondary title="Показать все формулы" onPress={() => { setQuery(''); setCategory(''); setFavorites(false); setTopic(false); }} /></View>}
    {shown.map(f => <View style={s.card} key={f.id}>
      <View style={[s.row, { alignItems: 'flex-start' }]}><Pressable accessibilityRole="button" accessibilityLabel={`Формула: ${f.title}`} accessibilityState={{ expanded: open === f.id }} onPress={() => setOpen(open === f.id ? '' : f.id)} style={{ flex: 1 }}><Text style={s.small}>{f.category.toUpperCase()}</Text><Text style={s.title}>{f.title}</Text><Text style={[s.body, { color: colors.blue }]}>{open === f.id ? 'Свернуть ↑' : 'Формула, пример и проверка ↓'}</Text></Pressable><Pressable accessibilityRole="checkbox" accessibilityLabel={`В избранное: ${f.title}`} accessibilityState={{ checked: progress.study.favorites.includes(f.id) }} onPress={() => study({ area: 'book', id: f.id })} style={{ minWidth: 44, minHeight: 44, justifyContent: 'center', alignItems: 'center' }}><Text style={{ color: colors.blue, fontSize: 28 }}>{progress.study.favorites.includes(f.id) ? '★' : '☆'}</Text></Pressable></View>
      {open === f.id && <>
        <View style={{ backgroundColor: colors.bluePale, padding: 15, borderRadius: 16, marginTop: 16 }}>
          {f.ratio ? <View accessible accessibilityLabel={f.formula} style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, alignItems: 'center' }}><Text style={s.title}>{f.ratio.left}</Text><View style={{ alignItems: 'center', maxWidth: '100%' }}><Text style={[s.title, { paddingBottom: 5, textAlign: 'center' }]}>{f.ratio.top}</Text><View style={{ height: 1.5, backgroundColor: colors.ink, alignSelf: 'stretch' }} /><Text style={[s.title, { paddingTop: 5 }]}>{f.ratio.bottom}</Text></View></View> : <MathLine value={f.formula} size={21} bold />}
          {f.ratio && <Text style={[s.small, { color: colors.navy }]}>{f.formula}</Text>}
        </View>
        <Text style={s.body}>{f.notation}</Text>
        <View testID={`formula-visual-${f.id}`}>{f.scene ? <GeometryFigure figure={{ kind: 'grid-scene', scene: f.scene, caption: 'Обозначения к формуле. Данные примера приведены ниже.' }} /> : <FormulaIllustration id={f.id} />}</View>
        <Text style={[s.title, { marginTop: 19, fontSize: 17 }]}>Пример</Text><View style={{ marginTop: 9 }}><MathLine value={f.example} /></View><View style={{ marginTop: 9 }}><MathLine value={f.solution} /></View>
        <FormulaQuiz key={f.id} entry={f} />
        <Button title="Тренировать эту тему  →" onPress={() => router.push({ pathname: '/guided', params: { module: f.practice.module, group: String(f.practice.group) } })} />
      </>}
    </View>)}
    <Text style={s.small}>Это учебный справочник. Набор карточек шире официального справочного листа экзамена; в режиме пробника эта подсказка не открывается.</Text>
  </Screen>;
}
function FormulaQuiz({ entry }: { entry: FormulaEntry }) {
  const [choice, setChoice] = useState<number | null>(null), [checked, setChecked] = useState(false);
  return <View style={{ marginTop: 20, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.border }}>
    <Text style={[s.title, { fontSize: 17 }]}>Проверь себя</Text><View style={{ marginTop: 9 }}><MathLine value={entry.quiz.question} /></View>
    {entry.quiz.options.map((value, i) => <Pressable key={i} accessibilityRole="radio" accessibilityLabel={`Ответ: ${value}`} accessibilityState={{ checked: choice === i, disabled: checked }} disabled={checked} onPress={() => setChoice(i)} style={[s.option, choice === i && s.selected, checked && i === entry.quiz.answer && { backgroundColor: colors.mint, borderColor: colors.green }, checked && choice === i && i !== entry.quiz.answer && { backgroundColor: '#FCE9EA', borderColor: colors.red }]}><MathLine value={value} /></Pressable>)}
    {!checked ? <Button secondary disabled={choice === null} title="Проверить формулу" onPress={() => setChecked(true)} /> : <View accessibilityLiveRegion="polite"><Text style={[s.title, { fontSize: 17, color: choice === entry.quiz.answer ? colors.green : colors.red, marginTop: 14 }]}>{choice === entry.quiz.answer ? 'Верно!' : 'Разберём вместе'}</Text><View style={{ marginTop: 10 }}><MathLine value={quizSolutions[entry.id]} /></View></View>}
  </View>;
}
