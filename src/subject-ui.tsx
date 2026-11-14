import React, { useState } from 'react';
import { router } from 'expo-router';
import * as Linking from 'expo-linking';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Disclosure } from './components';
import { catalogSources, fipiSources, subjects, type ExamId, type PlannedSubjectId, type SubjectId } from './subjects';
import { colors, surface } from './theme';

export const subjectTint = (subject: SubjectId) => subject === 'physics' ? colors.mint : subject === 'informatics' ? colors.amber : colors.bluePale;
export function SubjectIcon({ subject }: { subject: SubjectId }) {
  return <View accessible={false} importantForAccessibility="no-hide-descendants" style={[s.icon, { backgroundColor: subjectTint(subject) }]}>
    {subject === 'physics' ? <View style={{ width: 28, height: 28 }}>{[0, 60, 120].map(angle => <View key={angle} style={{ position: 'absolute', width: 28, height: 12, top: 8, borderWidth: 1.7, borderColor: colors.navy, borderRadius: 14, transform: [{ rotate: `${angle}deg` }] }} />)}<View style={{ position: 'absolute', left: 12, top: 12, width: 4, height: 4, borderRadius: 2, backgroundColor: colors.navy }} /></View>
      : subject === 'informatics' ? <View style={{ width: 28, height: 28 }}><View style={{ width: 28, height: 20, borderWidth: 1.8, borderColor: colors.navy, borderRadius: 4 }} /><View style={{ width: 2, height: 6, backgroundColor: colors.navy, alignSelf: 'center' }} /><View style={{ width: 17, height: 2, backgroundColor: colors.navy, alignSelf: 'center', borderRadius: 1 }} /></View>
        : <View style={{ width: 27, height: 27 }}><View style={{ position: 'absolute', top: 6, left: 0, width: 12, height: 2, backgroundColor: colors.navy }} /><View style={{ position: 'absolute', top: 1, left: 5, width: 2, height: 12, backgroundColor: colors.navy }} /><View style={{ position: 'absolute', top: 6, right: 0, width: 10, height: 2, backgroundColor: colors.navy }} />{[19, 24].map(top => <View key={top} style={{ position: 'absolute', top, left: 8, width: 12, height: 2, backgroundColor: colors.navy }} />)}</View>}
  </View>;
}
export function SubjectShortcut({ subject = 'math' }: { subject?: SubjectId }) {
  const item = subjects.find(s => s.id === subject)!;
  return <Pressable accessibilityRole="button" accessibilityLabel={`Выбрать предмет. Сейчас: ${item.title}`} onPress={() => router.push('/subjects')} style={({ pressed }) => [s.shortcut, pressed && s.pressed]}>
    <View style={{ flex: 1 }}><Text style={s.caption}>ПРЕДМЕТ</Text><Text style={s.title}>{item.title}</Text></View><Text style={s.link}>Сменить ›</Text>
  </Pressable>;
}
export function SubjectSources({ subject, exam }: { subject: PlannedSubjectId; exam: ExamId }) {
  const [error, setError] = useState(false);
  return <Disclosure title="Источники · ФИПИ 2027">
    <Text style={s.body}>Нумерация сверена по утверждённым спецификациям и демоверсиям ФИПИ-2027. Задания в приложении авторские; каталог «Решу» — дополнительный источник примеров.</Text>
    {[['Каталог «Решу»', catalogSources[subject][exam]], ['Демоверсия и спецификация ФИПИ', fipiSources[exam]]].map(([title, url]) => <Pressable accessibilityRole="link" key={url} onPress={() => { setError(false); void Linking.openURL(url).catch(() => setError(true)); }} style={({ pressed }) => [s.sourceLink, pressed && s.pressed]}><Text style={s.link}>{title} ↗</Text></Pressable>)}
    {error && <Text accessibilityLiveRegion="polite" style={s.body}>Не удалось открыть источник. Проверь подключение и попробуй ещё раз.</Text>}
  </Disclosure>;
}
export const s = StyleSheet.create({
  card: { ...surface.panel, padding: 18, marginTop: 16 },
  icon: { width: 48, height: 48, borderRadius: 15, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  title: { fontSize: 17, lineHeight: 24, fontWeight: '800', color: colors.ink, flexShrink: 1, minWidth: 0 },
  body: { color: colors.muted, fontSize: 15, lineHeight: 23, marginTop: 8 },
  caption: { color: colors.muted, fontSize: 12, lineHeight: 18, letterSpacing: .6 },
  small: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 6 },
  link: { color: colors.blue, fontSize: 14, lineHeight: 21, fontWeight: '700', flexShrink: 1 },
  pressed: surface.pressed, shortcut: { ...surface.panel, flexDirection: 'row', gap: 12, alignItems: 'center', paddingHorizontal: 15, paddingVertical: 10, minHeight: 64, marginTop: 18 },
  row: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  number: { width: 44, minHeight: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  badge: { color: colors.navy, fontSize: 17, fontWeight: '800' },
  sourceLink: { minHeight: 48, justifyContent: 'center', paddingVertical: 10 },
  notice: { padding: 18, backgroundColor: colors.bluePale, borderRadius: 18, marginTop: 20 },
});
