import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { colors } from './theme';

export function Screen({ children, scroll = true }: { children: React.ReactNode; scroll?: boolean }) {
  return <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
    {scroll ? <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>{children}</ScrollView> : <View style={styles.contentFill}>{children}</View>}
  </SafeAreaView>;
}

export function Back({ label = 'Назад' }: { label?: string }) {
  return <Pressable onPress={() => router.back()} accessibilityRole="button" accessibilityLabel={label} style={styles.back}><Text style={styles.backText}>‹  {label}</Text></Pressable>;
}

export function Pill({ children, tone = 'blue' }: { children: React.ReactNode; tone?: 'blue' | 'mint' | 'amber' }) {
  return <View style={[styles.pill, { backgroundColor: tone === 'mint' ? colors.mint : tone === 'amber' ? colors.amber : colors.bluePale }]}><Text style={styles.pillText}>{children}</Text></View>;
}

export function Button({ title, onPress, secondary = false, disabled = false }: { title: string; onPress: () => void; secondary?: boolean; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.button, secondary && styles.secondary, disabled && styles.disabled, pressed && !disabled && { opacity: .83 }]}>
    <Text style={[styles.buttonText, secondary && { color: colors.navy }]}>{title}</Text>
  </Pressable>;
}

export function ProgressBar({ current, total }: { current: number; total: number }) {
  return <View accessible accessibilityLabel={`Прогресс: ${current} из ${total}`} style={styles.track}><View style={[styles.fill, { width: `${Math.min(100, current / total * 100)}%` }]} /></View>;
}

export const type = StyleSheet.create({
  eyebrow: { fontSize: 12, fontWeight: '800', color: colors.blue, letterSpacing: 1.4 },
  title: { fontSize: 32, lineHeight: 38, fontWeight: '800', color: colors.ink, letterSpacing: -.7 },
  section: { fontSize: 23, fontWeight: '800', color: colors.ink, letterSpacing: -.4 },
  body: { fontSize: 16, lineHeight: 24, color: colors.muted },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { paddingHorizontal: 22, paddingTop: 14, paddingBottom: 32, flexGrow: 1 },
  contentFill: { paddingHorizontal: 22, paddingTop: 14, paddingBottom: 24, flex: 1 },
  back: { alignSelf: 'flex-start', paddingVertical: 10, paddingRight: 20, marginBottom: 10 },
  backText: { color: colors.navy, fontWeight: '700', fontSize: 16 },
  pill: { borderRadius: 50, paddingHorizontal: 12, paddingVertical: 7, alignSelf: 'flex-start' },
  pillText: { fontSize: 12, color: colors.navy, fontWeight: '800' },
  button: { minHeight: 56, backgroundColor: colors.blue, borderRadius: 18, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 18, marginTop: 12 },
  secondary: { backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border },
  disabled: { opacity: .45 },
  buttonText: { color: colors.white, fontSize: 16, fontWeight: '800' },
  track: { height: 8, backgroundColor: colors.border, borderRadius: 10, overflow: 'hidden' },
  fill: { height: 8, backgroundColor: colors.blue, borderRadius: 10 },
});
