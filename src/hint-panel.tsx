import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { HintSteps } from './hints';
import { colors } from './theme';

export function HintPanel({ steps, level, onReveal }: { steps: HintSteps; level: number; onReveal: (level: number) => void }) {
  const nextTitle = level === 0 ? 'Нужна небольшая подсказка?' : level === 1 ? 'Показать первый шаг' : 'Показать полное решение';
  return <View style={styles.panel}>
    {level > 0 && <View accessibilityLiveRegion="polite">
      <Text style={styles.eyebrow}>ПОМОЩЬ · ШАГ {level} ИЗ 3</Text>
      {level >= 1 && <View style={styles.step}><Text style={styles.label}>1. Идея</Text><Text style={styles.body}>{steps.clue}</Text></View>}
      {level >= 2 && <View style={styles.step}><Text style={styles.label}>2. Первый шаг</Text><Text style={styles.body}>{steps.firstStep}</Text></View>}
      {level >= 3 && <View style={[styles.step, styles.solution]}><Text style={styles.label}>3. Полное решение</Text><Text selectable style={styles.body}>{steps.solution}</Text></View>}
    </View>}
    {level < 3 && <Pressable accessibilityRole="button" accessibilityLabel={nextTitle} onPress={() => onReveal(level + 1)} style={({ pressed }) => [styles.button, pressed && { opacity: .7 }]}><Text style={styles.buttonText}>{nextTitle}</Text><Text style={styles.arrow}>›</Text></Pressable>}
    {level > 0 && <Text style={styles.note}>Ответ с подсказкой учитывается отдельно от самостоятельного решения.</Text>}
  </View>;
}
const styles = StyleSheet.create({ panel: { marginTop: 14 }, eyebrow: { color: colors.blue, fontSize: 11, fontWeight: '800', letterSpacing: 1 }, step: { backgroundColor: colors.bluePale, padding: 15, borderRadius: 16, marginTop: 9 }, solution: { backgroundColor: colors.mint }, label: { fontSize: 13, color: colors.navy, fontWeight: '800', marginBottom: 6 }, body: { color: colors.ink, fontSize: 15, lineHeight: 23 }, button: { minHeight: 48, paddingVertical: 12, paddingHorizontal: 15, borderWidth: 1, borderColor: colors.border, borderRadius: 15, backgroundColor: colors.white, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, gap: 12 }, buttonText: { color: colors.blue, fontWeight: '700', fontSize: 14, flex: 1 }, arrow: { color: colors.blue, fontSize: 22 }, note: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 8 } });
