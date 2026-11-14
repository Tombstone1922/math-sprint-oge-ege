import React, { useMemo, useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Back, Button, Choice, PageHeader, Pill, Screen, SearchField } from '../components';
import { examId, examTitles, formatTitles, plannedSubject, searchSubjectModules, subjectRevision, subjects, type ExamId, type PlannedSubjectId } from '../subjects';
import { SubjectIcon, SubjectShortcut, SubjectSources, subjectTint, s } from '../subject-ui';
import { colors } from '../theme';

export default function Subject() {
  const params = useLocalSearchParams<{ subject?: string; exam?: string }>();
  const subject = plannedSubject(params.subject), exam = examId(params.exam ?? 'oge');
  if (!subject || !exam) return <Screen><Back /><PageHeader label="КАТАЛОГ ПОДГОТОВКИ" title="Выбери предмет и экзамен" /><Text style={s.body}>Этот раздел не найден. Открой доступную карту подготовки.</Text><Button title="К предметам" onPress={() => router.replace('/subjects')} /></Screen>;
  return <SubjectCatalog key={`${subject}-${exam}`} subject={subject} exam={exam} />;
}
function SubjectCatalog({ subject, exam }: { subject: PlannedSubjectId; exam: ExamId }) {
  const [query, setQuery] = useState('');
  const all = useMemo(() => searchSubjectModules(subject, exam), [subject, exam]);
  const shown = useMemo(() => searchSubjectModules(subject, exam, query), [subject, exam, query]);
  const name = subjects.find(s => s.id === subject)!.title;
  const available = all.filter(m => m.status === 'ready');
  return <Screen><Back label="Назад" /><SubjectShortcut subject={subject} />
    <PageHeader label="КАТАЛОГ ПОДГОТОВКИ" title={name} mark={<SubjectIcon subject={subject} />} style={{ marginTop: 24 }} />
    <View accessibilityRole="tablist" style={styles.tabs}>{(['oge', 'ege'] as const).map(value => <Choice key={value} role="tab" title={examTitles[value]} label={`${examTitles[value]} по ${subject === 'physics' ? 'физике' : 'информатике'}`} selected={exam === value} onPress={() => router.setParams({ exam: value })} style={{ flex: 1 }} />)}</View>
    <View style={[s.notice, { backgroundColor: subjectTint(subject) }]}><Pill tone={subject === 'physics' ? 'mint' : 'amber'}>{available.length ? 'МОЖНО НАЧИНАТЬ' : 'В РАЗРАБОТКЕ'}</Pill><Text style={[s.title, { marginTop: 12 }]}>{available.length ? 'Можно тренироваться' : 'Сначала — понятная структура'}</Text><Text style={s.body}>{available.length ? `Доступно модулей: ${available.length} из ${all.length}. №${available.map(m => m.number).join(', №')}: урок, карточки, самостоятельная практика и повторение ошибок. Остальные номера готовятся.` : `${all.length} номеров экзамена. У каждого уже есть тема и план модуля; готовых задач пока нет.`}</Text><Text style={s.small}>{subjectRevision.label}</Text></View>
    {subject === 'informatics' && exam === 'ege' && <View style={s.card}><Text style={s.title}>Новая нумерация 2027</Text><Text style={s.body}>№10 — маски подсетей, №13 — исполнение алгоритмов, №23 — пути в графах. В №27 изменён формат ответа.</Text></View>}
    <Text style={[s.title, { marginTop: 24 }]}>Найти номер или тему</Text><SearchField label={`Поиск: ${name}, ${examTitles[exam]}`} value={query} onChange={setQuery} placeholder={subject === 'physics' ? 'Например, №17 или механика' : 'Например, №4 или кодирование'} style={{ marginTop: 10 }} />
    <Text accessibilityLiveRegion="polite" style={[s.small, { marginBottom: 4 }]}>Показано номеров: {shown.length} из {all.length}</Text>
    {!shown.length && <View style={s.card}><Text style={s.title}>Ничего не нашлось</Text><Text style={s.body}>Попробуй другой номер или слово. Здесь перечислены только номера выбранного экзамена.</Text><Button secondary title="Показать все номера" onPress={() => setQuery('')} /></View>}
    {shown.map(module => <Pressable key={module.id} accessibilityRole="button" accessibilityLabel={`${module.status === 'ready' ? 'Открыть модуль' : 'План модуля'} ${examTitles[exam]} №${module.number}: ${module.title}`} onPress={() => router.push({ pathname: '/subject-module', params: { subject, exam, number: String(module.number) } })} style={({ pressed }) => [s.card, { padding: 16, marginTop: 10 }, pressed && s.pressed]}>
      <View style={[s.row, { alignItems: 'flex-start' }]}><View style={[s.number, { backgroundColor: subjectTint(subject) }]}><Text style={s.badge}>{module.number}</Text></View><View style={{ flex: 1 }}><Text style={s.title}>{module.title}</Text><Text style={s.small}>{formatTitles[module.format]}{module.part ? ` · часть ${module.part}` : ''}</Text><Text style={[s.small, { color: colors.navy }]}>{module.status === 'ready' ? `Доступен · ${module.readyTasks} заданий` : 'В разработке'}</Text></View><Text style={{ color: colors.blue, fontSize: 23 }}>›</Text></View>
    </Pressable>)}
    <SubjectSources subject={subject} exam={exam} />
  </Screen>;
}
const styles = StyleSheet.create({ tabs: { flexDirection: 'row', gap: 10, marginTop: 20 } });
