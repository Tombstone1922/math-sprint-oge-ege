import React from 'react';
import { router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Disclosure, Screen, type } from '../components';
import { useProgress } from '../progress';
import { accuracy, pendingMistakes } from '../learning-progress';
import { extendedPending } from '../extended/progress';
import { detectivePending } from '../study/detective';
import { localDay } from '../daily-model';
import { nextTopic, resumeItems, type ResumeItem } from '../today-model';
import { useLearningClock } from '../learning-ui';
import { colors } from '../theme';

export default function Today() {
  const { progress } = useProgress(), now = useLearningClock(), saved = resumeItems(progress), current = saved[0];
  const due = pendingMistakes(progress, { dueOnly: true, now }).length + extendedPending(progress.extended, now).length + detectivePending(progress.study.detective, now).length;
  const done = progress.daily.history.find(r => r.day === localDay(now)), recommendation = nextTopic(progress), percent = accuracy(progress.independent, progress.attempts);
  const open = (item: ResumeItem) => item.daily ? router.push({ pathname: '/practice', params: { mode: 'daily' } }) : router.push(item.path);
  return <Screen>
    <View style={styles.brand}><View style={styles.logo}><Text style={styles.logoText}>∑</Text></View><View><Text style={styles.brandName}>Математика: рывок</Text><Text style={styles.caption}>{new Date(now).toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}</Text></View></View>
    <Text style={[type.title, { marginTop: 24 }]}>Сегодня</Text><Text style={[type.body, { marginTop: 5 }]}>Один понятный шаг вперёд.</Text>
    <View style={styles.hero}>
      <Text style={styles.heroLabel}>{current ? 'СОХРАНЕНО ДЛЯ ТЕБЯ' : done ? 'ХОРОШЕЕ НАЧАЛО' : 'НАЧНЁМ С МАЛЕНЬКОГО'}</Text>
      <Text style={styles.heroTitle}>{current ? current.title : done ? 'Сегодня уже позанимались' : 'Пять минут математики'}</Text>
      <Text style={styles.heroText}>{current ? current.description : done ? `В короткой тренировке: ${done.independent} из ${done.answered} самостоятельно. Можно перейти к любимой теме.` : 'Немного счёта, знакомые темы и прошлые ошибки — всё в одной короткой тренировке.'}</Text>
      <Pressable accessibilityRole="button" onPress={() => current ? open(current) : router.push(done ? '/topics' : '/daily')} style={styles.heroButton}><Text style={styles.heroButtonText}>{current ? 'Продолжить работу' : done ? 'Выбрать тему' : 'Начать пять минут'}  →</Text></Pressable>
    </View>
    {saved.length > 1 && <Disclosure title={`Ещё сохранённые работы · ${saved.length - 1}`}>{saved.slice(1).map(item => <Pressable key={item.id} accessibilityRole="button" accessibilityLabel={`Продолжить: ${item.title}`} onPress={() => open(item)} style={styles.smallRow}><View style={{ flex: 1 }}><Text style={styles.rowTitle}>{item.title}</Text><Text style={styles.caption}>{item.description}</Text></View><Text style={styles.arrow}>›</Text></Pressable>)}</Disclosure>}
    <View style={styles.section}><Text style={type.section}>На ближайшее занятие</Text></View>
    <Pressable accessibilityRole="button" accessibilityLabel="Ошибки к повторению" onPress={() => router.push('/review')} style={styles.row}><View style={[styles.badge, { backgroundColor: colors.amber }]}><Text style={styles.badgeText}>↻</Text></View><View style={{ flex: 1 }}><Text style={styles.rowTitle}>Повторить ошибки</Text><Text style={styles.caption}>{due ? `${due} задач готовы к повторению во всех режимах` : 'Новые ошибки появятся здесь автоматически'}</Text></View><Text style={styles.arrow}>›</Text></Pressable>
    {recommendation && <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/guided', params: { module: recommendation.moduleId, group: String(recommendation.group) } })} style={styles.row}><View style={[styles.badge, { backgroundColor: colors.bluePale }]}><Text style={styles.badgeText}>ƒ</Text></View><View style={{ flex: 1 }}><Text style={styles.rowTitle}>Повторить: {recommendation.title}</Text><Text style={styles.caption}>{recommendation.groupTitle} · здесь пока меньше самостоятельных ответов</Text></View><Text style={styles.arrow}>›</Text></Pressable>}
    {current && !current.daily && !done && <Pressable accessibilityRole="button" onPress={() => router.push('/daily')} style={styles.row}><View style={[styles.badge, { backgroundColor: colors.mint }]}><Text style={styles.badgeText}>5′</Text></View><View style={{ flex: 1 }}><Text style={styles.rowTitle}>Есть пять минут</Text><Text style={styles.caption}>Короткая тренировка без выбора темы</Text></View><Text style={styles.arrow}>›</Text></Pressable>}
    <View style={styles.section}><Text style={type.section}>Под рукой</Text></View>
    <View style={styles.tools}>{[{ title: 'Формулы', text: 'Памятки и примеры', path: '/reference', icon: 'ƒ' }, { title: 'Найди ошибку', text: 'Учимся замечать шаги', path: '/detective', icon: '?' }].map(item => <Pressable accessibilityRole="button" key={item.path} onPress={() => router.push(item.path as '/reference' | '/detective')} style={styles.tool}><Text style={styles.toolIcon}>{item.icon}</Text><Text style={styles.rowTitle}>{item.title}</Text><Text style={styles.caption}>{item.text}</Text></Pressable>)}</View>
    <Pressable accessibilityRole="button" onPress={() => router.push('/exam-hub')} style={styles.weekly}><View style={{ flex: 1 }}><Text style={styles.rowTitle}>Варианты этой недели</Text><Text style={styles.caption}>10 готовых работ ОГЭ · задания №1–25</Text></View><Text style={styles.arrow}>›</Text></Pressable>
    <Pressable accessibilityRole="button" onPress={() => router.push('/progress')} style={styles.progress}><Text style={styles.caption}>{percent === null ? 'После первых ответов здесь появится твой прогресс.' : `Самостоятельно в тренировках: ${percent}% · проверено ответов: ${progress.attempts}`}</Text><Text style={styles.progressLink}>Мой прогресс →</Text></Pressable>
  </Screen>;
}
const styles = StyleSheet.create({
  brand: { flexDirection: 'row', gap: 11, alignItems: 'center', paddingTop: 4 }, logo: { width: 40, height: 40, borderRadius: 13, backgroundColor: colors.navy, alignItems: 'center', justifyContent: 'center' }, logoText: { fontSize: 26, color: colors.white, fontWeight: '700' }, brandName: { color: colors.ink, fontSize: 15, fontWeight: '800', lineHeight: 21 }, caption: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 3 },
  hero: { padding: 23, backgroundColor: colors.navy, borderRadius: 23, marginTop: 20 }, heroLabel: { color: '#BDD0F1', fontSize: 11, lineHeight: 18, letterSpacing: 1, fontWeight: '800' }, heroTitle: { color: colors.white, fontSize: 26, lineHeight: 33, fontWeight: '800', marginTop: 12 }, heroText: { color: '#D9E4F6', fontSize: 15, lineHeight: 23, marginTop: 9 }, heroButton: { backgroundColor: colors.white, borderRadius: 14, minHeight: 54, alignItems: 'center', justifyContent: 'center', padding: 13, marginTop: 20 }, heroButtonText: { color: colors.navy, fontSize: 15, lineHeight: 22, fontWeight: '800' },
  section: { marginTop: 27, marginBottom: 12 }, row: { flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.white, padding: 15, borderRadius: 18, marginBottom: 10 }, smallRow: { flexDirection: 'row', gap: 10, alignItems: 'center', paddingVertical: 13 }, rowTitle: { color: colors.ink, fontSize: 16, lineHeight: 23, fontWeight: '800' }, badge: { width: 43, height: 45, borderRadius: 13, alignItems: 'center', justifyContent: 'center' }, badgeText: { color: colors.navy, fontSize: 23, fontWeight: '700' }, arrow: { color: colors.blue, fontSize: 24 }, tools: { flexDirection: 'row', gap: 10 }, tool: { flex: 1, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: 18, padding: 15 }, toolIcon: { color: colors.blue, fontSize: 24, fontWeight: '700', marginBottom: 9 }, weekly: { marginTop: 12, backgroundColor: colors.bluePale, borderRadius: 18, padding: 17, flexDirection: 'row', alignItems: 'center', gap: 10 }, progress: { marginTop: 18, paddingBottom: 8 }, progressLink: { color: colors.blue, fontSize: 13, lineHeight: 20, fontWeight: '700', marginTop: 9, paddingVertical: 6 },
});
