import React, { useMemo, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Back, Button, Pill, Screen, type } from '../components';
import { examId, examTitles, formatTitles, plannedSubject, searchSubjectModules, subjectRevision, subjects, type ExamId, type PlannedSubjectId } from '../subjects';
import { SubjectShortcut, SubjectSources, subjectTint, s } from '../subject-ui';
import { colors } from '../theme';

export default function Subject() {
  const params = useLocalSearchParams<{ subject?: string; exam?: string }>();
  const subject = plannedSubject(params.subject), exam = examId(params.exam ?? 'oge');
  if (!subject || !exam) return <Screen><Back /><Text style={type.title}>Выбери предмет и экзамен</Text><Text style={s.body}>Этот раздел не найден. Открой доступную карту подготовки.</Text><Button title="К предметам" onPress={() => router.replace('/subjects')} /></Screen>;
  return <SubjectCatalog key={`${subject}-${exam}`} subject={subject} exam={exam} />;
}
function SubjectCatalog({ subject, exam }: { subject: PlannedSubjectId; exam: ExamId }) {
  const [query, setQuery] = useState('');
  const all = useMemo(() => searchSubjectModules(subject, exam), [subject, exam]);
  const shown = useMemo(() => searchSubjectModules(subject, exam, query), [subject, exam, query]);
  const name = subjects.find(s => s.id === subject)!.title;
  return <Screen><Back label="Назад" /><SubjectShortcut subject={subject} />
    <Text style={[type.eyebrow, { marginTop: 24 }]}>КАРТА БУДУЩИХ МОДУЛЕЙ</Text><Text accessibilityRole="header" style={[type.title, { marginTop: 8 }]}>{name}</Text>
    <View accessibilityRole="tablist" style={styles.tabs}>{(['oge', 'ege'] as const).map(value => <Pressable key={value} accessibilityRole="tab" accessibilityLabel={`${examTitles[value]} по ${subject === 'physics' ? 'физике' : 'информатике'}`} aria-selected={exam === value} accessibilityState={{ selected: exam === value }} onPress={() => router.setParams({ exam: value })} style={({ pressed }) => [styles.tab, exam === value && styles.selected, pressed && s.pressed]}><Text style={[styles.tabText, exam === value && { color: colors.white }]}>{examTitles[value]}</Text></Pressable>)}</View>
    <View style={[s.notice, { backgroundColor: subjectTint(subject) }]}><Pill tone={subject === 'physics' ? 'mint' : 'amber'}>В РАЗРАБОТКЕ</Pill><Text style={[s.title, { marginTop: 12 }]}>Сначала — понятная структура</Text><Text style={s.body}>{all.length} номеров экзамена. У каждого уже есть тема и план модуля; готовых задач пока нет.</Text><Text style={s.small}>{subjectRevision.label}</Text></View>
    {subject === 'informatics' && exam === 'ege' && <View style={s.card}><Text style={s.title}>Новая нумерация 2027</Text><Text style={s.body}>№10 — маски подсетей, №13 — исполнение алгоритмов, №23 — пути в графах. В №27 изменён формат ответа.</Text></View>}
    <Text style={[s.title, { marginTop: 24 }]}>Найти номер или тему</Text><View style={styles.search}><TextInput accessibilityLabel={`Поиск: ${name}, ${examTitles[exam]}`} value={query} onChangeText={setQuery} autoCorrect={false} maxLength={100} placeholder={subject === 'physics' ? 'Например, №17 или механика' : 'Например, №4 или кодирование'} placeholderTextColor={colors.muted} style={styles.input} />{Boolean(query) && <Pressable accessibilityRole="button" accessibilityLabel="Очистить поиск" onPress={() => setQuery('')} style={styles.clear}><Text style={{ color: colors.navy, fontSize: 22 }}>×</Text></Pressable>}</View>
    <Text accessibilityLiveRegion="polite" style={[s.small, { marginBottom: 4 }]}>Показано номеров: {shown.length} из {all.length}</Text>
    {!shown.length && <View style={s.card}><Text style={s.title}>Ничего не нашлось</Text><Text style={s.body}>Попробуй другой номер или слово. Здесь перечислены только номера выбранного экзамена.</Text><Button secondary title="Показать все номера" onPress={() => setQuery('')} /></View>}
    {shown.map(module => <Pressable key={module.id} accessibilityRole="button" accessibilityLabel={`План модуля ${examTitles[exam]} №${module.number}: ${module.title}`} onPress={() => router.push({ pathname: '/subject-module', params: { subject, exam, number: String(module.number) } })} style={({ pressed }) => [s.card, { padding: 16, marginTop: 10 }, pressed && s.pressed]}>
      <View style={[s.row, { alignItems: 'flex-start' }]}><View style={[s.number, { backgroundColor: subjectTint(subject) }]}><Text style={s.badge}>{module.number}</Text></View><View style={{ flex: 1 }}><Text style={s.title}>{module.title}</Text><Text style={s.small}>{formatTitles[module.format]}{module.part ? ` · часть ${module.part}` : ''}</Text><Text style={[s.small, { color: colors.navy }]}>В разработке</Text></View><Text style={{ color: colors.blue, fontSize: 23 }}>›</Text></View>
    </Pressable>)}
    <SubjectSources subject={subject} exam={exam} />
  </Screen>;
}
const styles = StyleSheet.create({ tabs: { flexDirection: 'row', gap: 10, marginTop: 20 }, tab: { minHeight: 50, flex: 1, alignItems: 'center', justifyContent: 'center', padding: 12, borderRadius: 15, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white }, selected: { backgroundColor: colors.navy, borderColor: colors.navy }, tabText: { color: colors.navy, fontSize: 16, fontWeight: '800' }, search: { flexDirection: 'row', borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, borderRadius: 15, marginTop: 12 }, input: { flex: 1, minWidth: 0, minHeight: 54, padding: 14, color: colors.ink, fontSize: 15 }, clear: { minWidth: 48, minHeight: 48, justifyContent: 'center', alignItems: 'center' } });
