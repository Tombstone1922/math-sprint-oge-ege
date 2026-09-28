import React, { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Pill, Screen, type } from '../components';
import { Exam, modules } from '../content';
import { useProgress } from '../progress';
import { colors } from '../theme';

type Filter = 'Все' | Exam;
const filters: Filter[] = ['Все', 'ОГЭ', 'ЕГЭ база', 'ЕГЭ профиль'];

export default function Home() {
  const [filter, setFilter] = useState<Filter>('Все');
  const { progress } = useProgress();
  const shown = modules.filter(module => filter === 'Все' || (module.exams as readonly string[]).includes(filter));
  return <Screen>
    <View style={styles.brand}><View style={styles.logo}><Text style={styles.logoText}>∑</Text></View><Text style={styles.brandText}>МАТЕМАТИКА · РЫВОК</Text></View>
    <Text style={[type.title, { marginTop: 26 }]}>Понимай. Решай.{'\n'}Успевай.</Text>
    <Text style={[type.body, { marginTop: 12 }]}>Короткие уроки и тренировки для подготовки к ОГЭ и ЕГЭ по математике.</Text>
    <View style={styles.hero}>
      <View style={{ flex: 1 }}><Pill tone="mint">ПЕРВЫЙ ШАГ</Pill><Text style={styles.heroTitle}>Устный счёт{ '\n' }без паузы</Text><Text style={styles.heroCaption}>Разберём приёмы, покажем примеры, потом попробуешь сам.</Text></View>
      <Text style={styles.heroSymbol}>✦</Text>
    </View>
    <Button title={progress.completed ? 'Повторить быстрый счёт  →' : 'Начать первый урок  →'} onPress={() => router.push({ pathname: '/lesson', params: { module: 'mental-math' } })} />
    <View style={styles.stats}>
      <View style={styles.stat}><Text style={styles.statNumber}>{progress.completed}</Text><Text style={styles.statLabel}>тренировок</Text></View>
      <View style={styles.divider} /><View style={styles.stat}><Text style={styles.statNumber}>{progress.best}/10</Text><Text style={styles.statLabel}>лучший результат</Text></View>
    </View>
    <Text style={[type.section, { marginTop: 30, marginBottom: 16 }]}>Модули</Text>
    <View style={styles.filters}>{filters.map(item => <Pressable key={item} accessibilityRole="button" accessibilityState={{ selected: filter === item }} onPress={() => setFilter(item)} style={[styles.filter, filter === item && styles.filterActive]}><Text style={[styles.filterText, filter === item && { color: colors.white }]}>{item}</Text></Pressable>)}</View>
    {shown.map((module, index) => <Pressable key={module.id} accessibilityRole="button" accessibilityLabel={`Открыть модуль ${module.title}`} onPress={() => router.push({ pathname: '/lesson', params: { module: module.id } })} style={styles.module}>
      <View style={[styles.moduleIcon, { backgroundColor: index % 2 ? colors.amber : colors.bluePale }]}><Text style={styles.moduleIconText}>{module.icon}</Text></View>
      <View style={{ flex: 1 }}><Text style={styles.moduleTitle}>{module.title}</Text><Text style={styles.moduleSub}>{module.subtitle}</Text><Text style={styles.moduleMeta}>{module.minutes} мин · урок + практика{progress.byModule[module.id] ? ` · рекорд ${progress.byModule[module.id]?.best}/10` : ''}</Text></View>
      <Text style={styles.chevron}>›</Text>
    </Pressable>)}
    <Text style={styles.footer}>Выбери тему и занимайся в удобном темпе. Привязку к номерам экзамена добавим после проверки материалов по актуальному году.</Text>
  </Screen>;
}

const styles = StyleSheet.create({
  brand: { flexDirection: 'row', alignItems: 'center', gap: 9 }, logo: { width: 34, height: 34, backgroundColor: colors.navy, borderRadius: 11, alignItems: 'center', justifyContent: 'center' }, logoText: { color: colors.white, fontSize: 23, fontWeight: '800' }, brandText: { fontSize: 12, fontWeight: '900', letterSpacing: 1, color: colors.navy },
  hero: { marginTop: 26, backgroundColor: colors.navy, borderRadius: 26, padding: 22, minHeight: 206, flexDirection: 'row', overflow: 'hidden' }, heroTitle: { color: colors.white, fontSize: 26, lineHeight: 31, fontWeight: '800', marginTop: 17 }, heroCaption: { color: '#C8D8EF', fontSize: 13, lineHeight: 19, marginTop: 8 }, heroSymbol: { color: '#92AFFF', fontSize: 72, alignSelf: 'center' },
  stats: { flexDirection: 'row', backgroundColor: colors.white, borderRadius: 20, marginTop: 20, padding: 18, alignItems: 'center' }, stat: { flex: 1, alignItems: 'center' }, statNumber: { color: colors.ink, fontSize: 24, fontWeight: '800' }, statLabel: { color: colors.muted, fontSize: 12, marginTop: 2 }, divider: { height: 36, width: 1, backgroundColor: colors.border },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 9 }, filter: { borderRadius: 30, backgroundColor: colors.white, paddingHorizontal: 13, paddingVertical: 9, borderWidth: 1, borderColor: colors.border }, filterActive: { backgroundColor: colors.blue, borderColor: colors.blue }, filterText: { color: colors.navy, fontSize: 12, fontWeight: '700' },
  module: { flexDirection: 'row', gap: 13, alignItems: 'center', backgroundColor: colors.white, borderRadius: 20, padding: 15, marginTop: 10, borderWidth: 1, borderColor: colors.border }, moduleIcon: { width: 51, height: 51, borderRadius: 16, justifyContent: 'center', alignItems: 'center' }, moduleIconText: { fontSize: 25, color: colors.navy }, moduleTitle: { fontSize: 16, color: colors.ink, fontWeight: '800' }, moduleSub: { color: colors.muted, fontSize: 12, marginTop: 3 }, moduleMeta: { color: colors.blue, fontSize: 11, fontWeight: '700', marginTop: 7 }, chevron: { fontSize: 23, color: colors.muted }, footer: { color: colors.muted, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 24 },
});
