import React, { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Back, Button, Pill, Screen, type } from '../components';
import { modules } from '../content';
import { getGroupCount, getGroupProblems } from '../engine';
import { accuracy, emptyGroup, pendingMistakes } from '../learning-progress';
import { groupTitle, LearningBar, percentText } from '../learning-ui';
import { useProgress } from '../progress';
import { colors } from '../theme';

export default function ProgressPage() {
  const { module: requested } = useLocalSearchParams<{ module?: string }>();
  const selected = modules.find(m => m.id === requested);
  const [expanded, setExpanded] = useState<Record<string, boolean>>(selected ? { [selected.id]: true } : {});
  const { progress } = useProgress();
  const candidates = selected ? [selected] : modules.filter(m => progress.byModule[m.id]);
  const weak = candidates.flatMap(module => Object.entries(progress.byModule[module.id]?.byGroup ?? {}).flatMap(([group, data]) => data.attempts >= 3 && data.independent / data.attempts < .8 ? [{ module, group: Number(group), data }] : [])).sort((a, b) => a.data.independent / a.data.attempts - b.data.independent / b.data.attempts).slice(0, 3);
  const totals = selected ? progress.byModule[selected.id] : progress;
  return <Screen>
    <Back />
    <Pill tone="mint">МОЙ ПРОГРЕСС</Pill>
    <Text style={[type.title, { marginTop: 18 }]}>Видно, что получается</Text>
    <Text style={[type.body, { marginTop: 10 }]}>{selected ? selected.title : 'Результаты по темам и группам'}. Точность считается по проверенным ответам, включая незаконченные тренировки.</Text>
    <View style={styles.hero}><Text style={styles.heroCaption}>БЕЗ ПОДСКАЗОК В ТРЕНИРОВКЕ</Text><Text style={styles.heroNumber}>{percentText(accuracy(totals?.independent ?? 0, totals?.attempts ?? 0))}</Text><Text style={styles.heroText}>Самостоятельно верно: {totals?.independent ?? 0} из {totals?.attempts ?? 0}</Text></View>
    <View style={styles.stats}><View style={styles.stat}><Text style={styles.statValue}>{percentText(accuracy(totals?.correct ?? 0, totals?.attempts ?? 0))}</Text><Text style={styles.statLabel}>верных ответов</Text></View><View style={styles.stat}><Text style={styles.statValue}>{totals?.assisted ?? 0}</Text><Text style={styles.statLabel}>ответов с помощью</Text></View><View style={styles.stat}><Text style={styles.statValue}>{totals?.completed ?? 0}</Text><Text style={styles.statLabel}>тренировок</Text></View></View>
    {!selected && <Text style={styles.note}>Повторений ошибок: {progress.reviewSessions} · успешных циклов закрепления: {progress.reviewed}. Короткие повторы считаются отдельно от обычных десяток.</Text>}
    {progress.completed > 0 && !progress.attempts && <Text style={styles.note}>Прежние рекорды сохранены. Подробные данные по ответам и группам начнут собираться с новой тренировки.</Text>}
    <Button title={`Повторить ошибки · ${pendingMistakes(progress, { moduleId: selected?.id }).length}`} secondary onPress={() => router.push({ pathname: '/review', params: selected ? { module: selected.id } : {} })} />
    {weak.length > 0 && <View style={{ marginTop: 28 }}><Text style={type.section}>Стоит повторить</Text><Text style={styles.note}>Группы, где пока меньше 80% самостоятельных ответов после трёх и более задач.</Text>{weak.map(({ module, group, data }) => <Pressable accessibilityRole="button" key={`${module.id}:${group}`} onPress={() => router.push({ pathname: '/guided', params: { module: module.id, group: String(group) } })} style={styles.recommendation}><View style={{ flex: 1 }}><Text style={styles.moduleLabel}>{module.title}</Text><Text style={styles.groupTitle}>{groupTitle(module.id, group)}</Text></View><Text style={styles.weakValue}>{percentText(accuracy(data.independent, data.attempts))} ›</Text></Pressable>)}</View>}
    <Text style={[type.section, { marginTop: 28, marginBottom: 8 }]}>{selected ? 'Группы модуля' : 'Темы'}</Text>
    <Text style={styles.note}>Группа отмечается пройденной, когда попробованы все её задачи. Точность и самостоятельность показаны отдельно.</Text>
    {!candidates.length && <View style={styles.card}><Text style={styles.moduleTitle}>Начнём с первой тренировки</Text><Text style={styles.note}>После каждого проверенного ответа здесь появятся результаты. Для подробной статистики не обязательно заканчивать все десять задач.</Text><Button title="Выбрать модуль" onPress={() => router.dismissTo('/')} /></View>}
    {candidates.map(module => {
      const data = progress.byModule[module.id], count = getGroupCount(module.id), groups = Array.from({ length: count }, (_, i) => ({ group: i + 1, data: data?.byGroup[i + 1] ?? emptyGroup(), size: getGroupProblems(module.id, i + 1).length }));
      const covered = groups.filter(g => g.data.seen.length >= g.size).length, open = Boolean(expanded[module.id]);
      return <View style={styles.card} key={module.id}>
        <Pressable accessibilityRole="button" accessibilityState={{ expanded: open }} onPress={() => setExpanded(before => ({ ...before, [module.id]: !before[module.id] }))}>
          <View style={styles.row}><Text style={[styles.moduleTitle, { flex: 1 }]}>{module.title}</Text><Text style={styles.arrow}>{open ? '⌃' : '⌄'}</Text></View>
          <Text style={styles.note}>{percentText(accuracy(data?.independent ?? 0, data?.attempts ?? 0))} самостоятельно · {data?.attempts ?? 0} ответов</Text>
          <LearningBar percent={covered / count * 100} />
          <Text style={styles.meta}>Пройдено групп: {covered}/{count} · рекорд: {data?.best ?? 0}/10</Text>
        </Pressable>
        {open && groups.map(({ group, data, size }) => <View style={styles.group} key={group}>
          <View style={styles.row}><Text style={[styles.groupTitle, { flex: 1 }]}>{group}. {groupTitle(module.id, group)}</Text>{data.seen.length >= size && <Text style={styles.done}>Пройдена</Text>}</View>
          <Text style={styles.meta}>Задач попробовано: {data.seen.length}/{size} · тренировок: {data.completed}</Text>
          <LearningBar percent={data.seen.length / size * 100} />
          <Text style={styles.note}>{data.attempts ? `Верно: ${percentText(accuracy(data.correct, data.attempts))} · без подсказок: ${percentText(accuracy(data.independent, data.attempts))}` : 'Ещё нет проверенных ответов'}</Text>
          <Button title="Тренировать эту группу  →" secondary onPress={() => router.push({ pathname: '/guided', params: { module: module.id, group: String(group) } })} />
        </View>)}
      </View>;
    })}
    {selected && <Button title="Посмотреть все темы" secondary onPress={() => router.replace('/progress')} />}
  </Screen>;
}
const styles = StyleSheet.create({ hero: { padding: 23, backgroundColor: colors.navy, borderRadius: 25, marginTop: 23 }, heroCaption: { fontSize: 11, fontWeight: '800', letterSpacing: 1, color: '#C3D5F0' }, heroNumber: { color: colors.white, fontSize: 60, fontWeight: '800', marginTop: 8 }, heroText: { color: '#DAE5F7', fontSize: 14, lineHeight: 21 }, stats: { flexDirection: 'row', gap: 6, marginTop: 12 }, stat: { flex: 1, paddingVertical: 15, paddingHorizontal: 6, backgroundColor: colors.white, borderRadius: 17, alignItems: 'center' }, statValue: { fontSize: 22, color: colors.navy, fontWeight: '800' }, statLabel: { fontSize: 10, lineHeight: 15, color: colors.muted, textAlign: 'center', marginTop: 4 }, note: { fontSize: 13, lineHeight: 20, color: colors.muted, marginTop: 7 }, card: { backgroundColor: colors.white, padding: 18, borderWidth: 1, borderColor: colors.border, borderRadius: 22, marginTop: 12 }, row: { flexDirection: 'row', alignItems: 'center', gap: 10 }, moduleTitle: { fontSize: 18, lineHeight: 24, color: colors.ink, fontWeight: '800' }, arrow: { color: colors.blue, fontSize: 23 }, meta: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 7 }, group: { borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 16, marginTop: 17 }, groupTitle: { color: colors.ink, fontSize: 15, lineHeight: 21, fontWeight: '700' }, done: { color: colors.green, fontSize: 11, fontWeight: '800' }, recommendation: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFF7E6', borderRadius: 17, padding: 15, marginTop: 10 }, moduleLabel: { fontSize: 11, fontWeight: '700', color: colors.muted, marginBottom: 4 }, weakValue: { color: '#815C25', fontWeight: '800', fontSize: 17 } });
