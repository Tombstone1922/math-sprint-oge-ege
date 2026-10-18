import { ExtendedSummary } from '../extended/ui';
import React, { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Back, Button, Pill, Screen, type } from '../components';
import { modules } from '../content';
import { findLearningProblem, pendingMistakes, REVIEW_PASSES, type Mistake } from '../learning-progress';
import { groupTitle, reviewTime, useLearningClock } from '../learning-ui';
import { problemSummary } from '../hints';
import { useProgress } from '../progress';
import { colors } from '../theme';

export default function Review() {
  const { module: requested } = useLocalSearchParams<{ module?: string }>();
  const module = modules.find(m => m.id === requested);
  const { progress } = useProgress(), now = useLearningClock();
  const [all, setAll] = useState(false);
  const pending = pendingMistakes(progress, { moduleId: module?.id }), due = pending.filter(m => m.dueAt <= now);
  const shown = all ? pending : due;
  const groups = new Map<string, Mistake[]>();
  for (const item of shown) { const key = `${item.moduleId}:${item.group}`; groups.set(key, [...(groups.get(key) ?? []), item]); }
  return <Screen>
    <Back />
    {!module && <ExtendedSummary />}
    <Pill tone="amber">ЛИЧНОЕ ПОВТОРЕНИЕ</Pill>
    <Text style={[type.title, { marginTop: 18 }]}>Ошибки становятся опытом</Text>
    <Text style={[type.body, { marginTop: 10 }]}>{module ? `${module.title}. ` : ''}Здесь задачи, в которых была ошибка или понадобилась подсказка. Повторяй их без предварительного показа ответов.</Text>
    <View style={styles.hero}><Text style={styles.big}>{due.length}<Text style={styles.bigLabel}> сейчас</Text></Text><Text style={[styles.caption, { color: '#D3E0F5' }]}>Ещё {pending.length - due.length} ожидают своего времени · успешных циклов закрепления: {progress.reviewed}</Text></View>
    <Text style={styles.rule}>Три самостоятельных повторения: первое — сейчас, следующее — через день, затем через три дня. Ошибка или подсказка начинает закрепление заново.</Text>
    <View style={styles.tabs}>{[{ title: `Сейчас · ${due.length}`, value: false }, { title: `Все · ${pending.length}`, value: true }].map(tab => <Pressable key={tab.title} accessibilityRole="button" accessibilityState={{ selected: all === tab.value }} onPress={() => setAll(tab.value)} style={[styles.tab, all === tab.value && styles.activeTab]}><Text style={[styles.tabText, all === tab.value && { color: colors.white }]}>{tab.title}</Text></Pressable>)}</View>
    {!shown.length && <View style={styles.card}><Text style={styles.cardTitle}>{pending.length ? 'На сейчас всё повторено' : 'Пока нет задач на повторение'}</Text><Text style={styles.caption}>{pending.length ? `Задания остаются на закреплении. Ближайший повтор: ${reviewTime(pending[0].dueAt, now)}.` : 'После ошибки или подсказки задача автоматически появится здесь, даже если выйти из тренировки.'}</Text>{pending.length > 0 && <Button title="Посмотреть ожидающие задачи" secondary onPress={() => setAll(true)} />}<Button title={module ? 'К обычной тренировке' : 'Выбрать модуль'} secondary onPress={() => module ? router.push({ pathname: '/groups', params: { module: module.id } }) : router.dismissTo('/')} /></View>}
    {[...groups.entries()].map(([key, items]) => {
      const first = items[0], selected = modules.find(m => m.id === first.moduleId)!, available = items.filter(m => m.dueAt <= now).slice(0, 10);
      const total = pending.filter(m => m.moduleId === first.moduleId && m.group === first.group).length;
      return <View key={key} style={styles.card}>
        <Text style={styles.module}>{selected.title}</Text><Text style={styles.cardTitle}>{groupTitle(first.moduleId, first.group)}</Text>
        <Text style={styles.caption}>Группа {first.group} · {total} на закреплении</Text>
        {items.slice(0, 3).map(item => <View key={item.problemId} style={styles.item}><Text numberOfLines={2} style={styles.problem}>{problemSummary(findLearningProblem(item.moduleId, item.group, item.problemId)!)}</Text><Text style={styles.meta}>{item.reason === 'hint' ? 'Была подсказка' : 'Была ошибка'} · {item.streak}/{REVIEW_PASSES} повторений · {reviewTime(item.dueAt, now)}</Text></View>)}
        {items.length > 3 && <Text style={styles.meta}>И ещё {items.length - 3} в этой группе</Text>}
        <Button disabled={!available.length} title={available.length ? `Повторить: ${available.length} ${available.length === 1 ? 'задачу' : available.length < 5 ? 'задачи' : 'задач'}  →` : `Следующий повтор: ${reviewTime(items[0].dueAt, now)}`} onPress={() => router.push({ pathname: '/practice', params: { module: selected.id, group: String(first.group), mode: 'review', ids: available.map(m => m.problemId).join(',') } })} />
      </View>;
    })}
  </Screen>;
}
const styles = StyleSheet.create({ hero: { backgroundColor: colors.navy, borderRadius: 22, padding: 20, marginTop: 22 }, big: { fontSize: 44, fontWeight: '800', color: colors.white }, bigLabel: { fontSize: 18, color: '#C9D9F0' }, caption: { fontSize: 14, lineHeight: 21, color: colors.muted, marginTop: 7 }, rule: { color: colors.muted, fontSize: 13, lineHeight: 20, marginTop: 15 }, tabs: { flexDirection: 'row', gap: 8, marginVertical: 18 }, tab: { paddingVertical: 11, paddingHorizontal: 17, backgroundColor: colors.white, borderRadius: 30, borderWidth: 1, borderColor: colors.border }, activeTab: { backgroundColor: colors.blue, borderColor: colors.blue }, tabText: { color: colors.navy, fontWeight: '700' }, card: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, padding: 18, borderRadius: 22, marginBottom: 14 }, module: { color: colors.blue, fontSize: 12, fontWeight: '800', marginBottom: 6 }, cardTitle: { color: colors.ink, fontSize: 19, fontWeight: '800', lineHeight: 25 }, item: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 12, marginTop: 12 }, problem: { fontSize: 14, color: colors.ink, lineHeight: 20 }, meta: { fontSize: 12, color: colors.muted, lineHeight: 18, marginTop: 5 } });
