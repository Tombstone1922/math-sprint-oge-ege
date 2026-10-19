import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { cardPalette, colors } from './theme';
import { useBottomNavigation } from './app-navigation';

export function Screen({ children, scroll = true, footer, modal = false }: { children: React.ReactNode; scroll?: boolean; footer?: React.ReactNode; modal?: boolean }) {
  const bar = useBottomNavigation();
  return <SafeAreaView style={styles.safe} edges={bar && !modal ? ['top'] : ['top', 'bottom']}>
    <KeyboardAvoidingView style={{ flex: 1 }} enabled={Boolean(footer)} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {scroll ? <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>{children}</ScrollView> : <View style={styles.contentFill}>{children}</View>}
      {footer && <View testID="task-footer" style={styles.footer}>{footer}</View>}
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

export function Back({ label = 'Назад' }: { label?: string }) {
  return <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/topics')} accessibilityRole="button" accessibilityLabel={label} style={styles.back}><Text style={styles.backText}>‹  {label}</Text></Pressable>;
}

export function Disclosure({ title, children, initialOpen = false }: { title: string; children: React.ReactNode; initialOpen?: boolean }) {
  const [open, setOpen] = useState(initialOpen);
  return <View style={styles.disclosure}><Pressable accessibilityRole="button" accessibilityLabel={title} aria-expanded={open} accessibilityState={{ expanded: open }} onPress={() => setOpen(v => !v)} style={styles.disclosureTitle}><Text style={{ color: colors.navy, fontSize: 14, lineHeight: 21, fontWeight: '700', flex: 1 }}>{title}</Text><Text style={{ color: colors.blue, fontSize: 20 }}>{open ? '−' : '+'}</Text></Pressable>{open && <View style={{ paddingBottom: 14 }}>{children}</View>}</View>;
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

// Shared surface keeps guided and practice examples visually identical.
export const problemCard = {
  marginTop: 24,
  backgroundColor: colors.white,
  borderRadius: 28,
  borderWidth: 1,
  borderColor: colors.border,
  padding: 26,
  minHeight: 240,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};
export function problemCardStyle(colorIndex: number) {
  return [problemCard, { backgroundColor: cardPalette[colorIndex] ?? cardPalette[0] }];
}
export const type = StyleSheet.create({
  eyebrow: { fontSize: 12, fontWeight: '800', color: colors.blue, letterSpacing: 1.4 },
  title: { fontSize: 29, lineHeight: 36, fontWeight: '800', color: colors.ink, letterSpacing: -.6 },
  section: { fontSize: 21, lineHeight: 28, fontWeight: '800', color: colors.ink, letterSpacing: -.3 },
  body: { fontSize: 16, lineHeight: 24, color: colors.muted },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  footer: { backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: 22, paddingBottom: 12, paddingTop: 2 },
  disclosure: { borderTopWidth: 1, borderTopColor: colors.border, marginTop: 16 },
  disclosureTitle: { minHeight: 50, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
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
