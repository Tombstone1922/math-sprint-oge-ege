import React, { useMemo, useState } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Choice, PageHeader, Screen, SearchField, type } from '../components';
import { catalog, searchCatalog, sectionTitles, type CatalogFilter, type CatalogItem, type CatalogSection } from '../catalog';
import { useProgress } from '../progress';
import { colors, surface } from '../theme';
import { accuracy } from '../learning-progress';
import { SubjectShortcut } from '../subject-ui';

export default function Topics() {
  const [query, setQuery] = useState(''), [filter, setFilter] = useState<CatalogFilter>('all');
  const shown = useMemo(() => searchCatalog(query, filter), [query, filter]);
  return <Screen><PageHeader label="КАТАЛОГ ПОДГОТОВКИ" title="Темы и задания" /><SubjectShortcut />
    <SearchField label="Поиск тем и заданий" value={query} onChange={setQuery} placeholder="Дроби, уравнения или №16" />
    <View style={styles.filters}>{([['all', 'Все'], ['skills', 'Навыки'], ['first', 'ОГЭ · 1 часть'], ['second', 'ОГЭ · 2 часть'], ['ege', 'Для ЕГЭ']] as const).map(([value, label]) => <Choice key={value} title={label} selected={filter === value} onPress={() => setFilter(value)} />)}</View>
    <Pressable accessibilityRole="button" onPress={() => router.push('/reference')} style={styles.reference}><Text style={{ fontSize: 20, color: colors.blue }}>ƒ</Text><View style={{ flex: 1 }}><Text style={styles.rowTitle}>Справочник формул</Text><Text style={styles.caption}>Примеры, рисунки и избранное</Text></View><Text style={styles.arrow}>›</Text></Pressable>
    {!shown.length && <View style={styles.empty}><Text style={type.section}>Ничего не нашлось</Text><Text style={type.body}>Попробуй другое слово или номер задания. Можно сбросить фильтр и посмотреть все темы.</Text><Pressable accessibilityRole="button" onPress={() => { setQuery(''); setFilter('all'); }} style={{ paddingVertical: 16 }}><Text style={styles.link}>Показать все темы →</Text></Pressable></View>}
    {(['skills', 'first', 'second'] as CatalogSection[]).map(section => {
      const items = shown.filter(item => item.section === section);
      return items.length ? <View key={section}><View style={styles.section}><Text style={type.section}>{sectionTitles[section]}</Text><Text style={styles.caption}>{items.length}</Text></View>{items.map(item => <TopicRow item={item} key={item.id} />)}</View> : null;
    })}
    <Text style={[styles.caption, { marginTop: 22 }]}>{filter === 'ege' ? 'Базовые навыки для ЕГЭ. Полные варианты в приложении пока относятся к ОГЭ.' : `В каталоге ${catalog.length} тем. Открой группу для практики или начни с короткого урока.`}</Text>
  </Screen>;
}
function TopicRow({ item }: { item: CatalogItem }) {
  const { progress } = useProgress(), stats = item.moduleId ? progress.byModule[item.moduleId] : null;
  const percent = stats ? accuracy(stats.independent, stats.attempts) : null;
  const label = item.numbers.length ? item.numbers.length > 1 ? '1–5' : String(item.numbers[0]) : '∑';
  return <View style={styles.row}>
    <Pressable accessibilityRole="button" accessibilityLabel={`Открыть тему ${item.numbers.length ? `№${label}. ` : ''}${item.title}`} onPress={() => item.moduleId ? router.push({ pathname: '/groups', params: { module: item.moduleId } }) : router.push({ pathname: '/extended', params: { number: String(item.extendedNumber) } })} style={({ pressed }) => [styles.main, pressed && surface.pressed]}>
      <View style={[styles.badge, { backgroundColor: item.section === 'second' ? colors.amber : colors.bluePale }]}><Text style={styles.badgeText}>{label}</Text></View><View style={{ flex: 1 }}><Text style={styles.rowTitle}>{item.title}</Text><Text style={styles.caption}>{item.subtitle}</Text><Text style={styles.meta}>{item.groups.length} групп{percent === null ? ' · можно начать с любой' : ` · ${percent}% самостоятельно`}</Text></View><Text style={styles.arrow}>›</Text>
    </Pressable>
    {item.moduleId && <Pressable accessibilityRole="button" accessibilityLabel={`Короткий урок: ${item.title}`} onPress={() => router.push({ pathname: '/lesson', params: { module: item.moduleId } })} style={styles.lesson}><Text style={styles.link}>Короткий урок ↗</Text></Pressable>}
  </View>;
}
const styles = StyleSheet.create({
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 14 },
  reference: { flexDirection: 'row', gap: 13, alignItems: 'center', padding: 16, borderRadius: 18, backgroundColor: colors.bluePale, marginTop: 18 }, section: { flexDirection: 'row', alignItems: 'center', gap: 10, justifyContent: 'space-between', marginTop: 28, marginBottom: 10 }, row: { ...surface.panel, marginBottom: 10 }, main: { padding: 15, flexDirection: 'row', gap: 12, alignItems: 'center' }, badge: { width: 43, height: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 13 }, badgeText: { fontSize: 16, color: colors.navy, fontWeight: '800' }, rowTitle: { color: colors.ink, fontSize: 16, lineHeight: 22, fontWeight: '800' }, caption: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 3 }, meta: { color: colors.muted, fontSize: 12, lineHeight: 19, marginTop: 6 }, arrow: { color: colors.blue, fontSize: 23 }, lesson: { borderTopWidth: 1, borderTopColor: colors.border, paddingVertical: 12, paddingHorizontal: 16, minHeight: 44 }, link: { color: colors.blue, fontSize: 13, lineHeight: 20, fontWeight: '700' }, empty: { marginTop: 28, gap: 10 },
});
