import React, { useState } from 'react';
import { Animated, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View, useWindowDimensions, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { cardPalette, colors, layout, radius, surface } from './theme';
import { useBottomNavigation } from './app-navigation';
import { MotionIn, useAnimatedProgress } from './motion';

export function Screen({ children, scroll = true, footer, modal = false }: { children: React.ReactNode; scroll?: boolean; footer?: React.ReactNode; modal?: boolean }) {
  const bar = useBottomNavigation();
  const { width } = useWindowDimensions();
  const gutters = { paddingHorizontal: width < 360 ? layout.compactGutter : layout.gutter };
  return <SafeAreaView style={styles.safe} edges={bar && !modal ? ['top', 'left', 'right'] : ['top', 'bottom', 'left', 'right']}>
    <KeyboardAvoidingView style={{ flex: 1 }} enabled={Boolean(footer)} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {scroll ? <ScrollView contentContainerStyle={[styles.content, gutters]} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>{children}</ScrollView> : <View style={[styles.contentFill, gutters]}>{children}</View>}
      {footer && <View testID="task-footer" style={styles.footer}><View style={[styles.frame, gutters]}>{footer}</View></View>}
    </KeyboardAvoidingView>
  </SafeAreaView>;
}

export function PageHeader({ label, title, description, mark, style }: { label: string; title: string; description?: string; mark?: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.heading, style]}>
    <View style={styles.headingRow}>
      <View style={{ flex: 1 }}>
        <Text style={type.eyebrow}>{label}</Text>
        <Text accessibilityRole="header" style={[type.title, { marginTop: 7 }]}>{title}</Text>
      </View>
      {mark}
    </View>
    {description && <Text style={[type.body, { marginTop: 7 }]}>{description}</Text>}
  </View>;
}

export function SearchField({ label, placeholder, value, onChange, style }: { label: string; placeholder: string; value: string; onChange: (value: string) => void; style?: StyleProp<ViewStyle> }) {
  const [focused, setFocused] = useState(false);
  return <View style={[styles.search, style, focused && { borderColor: colors.blue }]}>
    <View accessible={false} style={styles.searchIcon}><View style={styles.searchLens} /><View style={styles.searchHandle} /></View>
    <TextInput accessibilityLabel={label} returnKeyType="search" value={value} onChangeText={onChange} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} autoCorrect={false} maxLength={100} placeholder={placeholder} placeholderTextColor={colors.muted} style={styles.searchInput} />
    {Boolean(value) && <Pressable accessibilityRole="button" accessibilityLabel="Очистить поиск" onPress={() => onChange('')} style={styles.clear}><Text style={styles.clearText}>×</Text></Pressable>}
  </View>;
}

export function Choice({ title, selected, onPress, role = 'button', label, style, disabled = false }: { title: string; selected: boolean; onPress: () => void; role?: 'button' | 'tab' | 'checkbox'; label?: string; disabled?: boolean; style?: StyleProp<ViewStyle> }) {
  return <Pressable accessibilityRole={role} accessibilityLabel={label} disabled={disabled} aria-selected={role==='checkbox'?undefined:selected} aria-checked={role==='checkbox'?selected:undefined} accessibilityState={role==='checkbox'?{checked:selected,disabled}:{selected,disabled}} onPress={onPress} style={({ pressed }) => [styles.choice, selected && styles.selected, style, pressed && surface.pressed]}>
    <Text style={[styles.choiceText, selected && { color: colors.blue }]}>{title}</Text>
  </Pressable>;
}

export function Back({ label = 'Назад' }: { label?: string }) {
  return <Pressable onPress={() => router.canGoBack() ? router.back() : router.replace('/topics')} accessibilityRole="button" accessibilityLabel={label} style={({ pressed }) => [styles.back, pressed && surface.pressed]}><Text style={styles.backText}>‹  {label}</Text></Pressable>;
}

export function Disclosure({ title, children, initialOpen = false }: { title: string; children: React.ReactNode; initialOpen?: boolean }) {
  const [open, setOpen] = useState(initialOpen);
  const [openedByPress, setOpenedByPress] = useState(false);
  return <View style={styles.disclosure}>
    <Pressable accessibilityRole="button" accessibilityLabel={title} aria-expanded={open} accessibilityState={{ expanded: open }} onPress={() => { setOpenedByPress(true); setOpen(v => !v); }} style={({ pressed }) => [styles.disclosureTitle, pressed && surface.pressed]}>
      <Text style={styles.disclosureText}>{title}</Text><View style={styles.disclosureMark}><Text style={styles.disclosureSymbol}>{open ? '−' : '+'}</Text></View>
    </Pressable>
    {open && (openedByPress ? <MotionIn style={styles.disclosureContent}>{children}</MotionIn> : <View style={styles.disclosureContent}>{children}</View>)}
  </View>;
}

export function Pill({ children, tone = 'blue' }: { children: React.ReactNode; tone?: 'blue' | 'mint' | 'amber' }) {
  return <View style={[styles.pill, { backgroundColor: tone === 'mint' ? colors.mint : tone === 'amber' ? colors.amber : colors.bluePale }]}><Text style={styles.pillText}>{children}</Text></View>;
}

export function Button({ title, onPress, secondary = false, disabled = false, style }: { title: string; onPress: () => void; secondary?: boolean; disabled?: boolean; style?: StyleProp<ViewStyle> }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress} style={({ pressed }) => [styles.button, secondary && styles.secondary, disabled && styles.disabled, style, pressed && !disabled && surface.pressed]}>
    <Text style={[styles.buttonText, secondary && { color: colors.navy }, disabled && { color: colors.muted }]}>{title}</Text>
  </Pressable>;
}

export function ProgressBar({ current, total, previous }: { current: number; total: number; previous?: number }) {
  const ratio = (value: number) => total > 0 ? Math.max(0, Math.min(1, value / total)) : 0;
  const fraction = ratio(current);
  const scaleX = useAnimatedProgress(fraction, ratio(previous ?? current));
  return <View accessible accessibilityRole="progressbar" accessibilityLabel={`Прогресс: ${current} из ${total}`} accessibilityValue={{ min: 0, max: 100, now: Math.round(fraction * 100) }} style={styles.track}>
    <Animated.View style={[styles.fill, { transform: [{ scaleX }] }]} />
  </View>;
}

// Shared surface keeps guided and practice examples visually identical.
export const problemCard = {
  ...surface.panel,
  marginTop: 22,
  borderRadius: radius.feature,
  padding: 20,
  minHeight: 232,
  alignItems: 'center' as const,
  justifyContent: 'center' as const,
};
export function problemCardStyle(colorIndex: number) {
  return [problemCard, { backgroundColor: cardPalette[colorIndex] ?? cardPalette[0] }];
}

export const type = StyleSheet.create({
  eyebrow: { fontSize: 11, lineHeight: 16, fontWeight: '800', color: colors.blue, letterSpacing: 1.3 },
  title: { fontSize: 31, lineHeight: 38, fontWeight: '800', color: colors.ink, letterSpacing: -.8 },
  section: { fontSize: 21, lineHeight: 28, fontWeight: '800', color: colors.ink, letterSpacing: -.35 },
  body: { fontSize: 16, lineHeight: 24, color: colors.muted },
});

const frame = { width: '100%' as const, alignSelf: 'center' as const, maxWidth: layout.maxWidth };

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  frame,
  footer: { backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border, paddingBottom: 12, paddingTop: 2 },
  heading: { marginTop: 8, marginBottom: 2 },
  headingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  search: { ...surface.field, flexDirection: 'row', alignItems: 'center', paddingLeft: 14, marginTop: 16, minHeight: 54, gap: 10 },
  searchIcon: { width: 20, height: 20 },
  searchLens: { width: 14, height: 14, borderWidth: 1.8, borderRadius: 7, borderColor: colors.blue, marginTop: 1 },
  searchHandle: { position: 'absolute', left: 11, top: 14, width: 8, height: 2, borderRadius: 1, backgroundColor: colors.blue, transform: [{ rotate: '45deg' }] },
  searchInput: { flex: 1, minWidth: 0, minHeight: 52, color: colors.ink, fontSize: 15, paddingRight: 12, paddingVertical: 10 },
  clear: { width: layout.hitTarget, minHeight: layout.hitTarget, alignItems: 'center', justifyContent: 'center' },
  clearText: { color: colors.muted, fontSize: 23 },
  choice: { ...surface.field, paddingHorizontal: 13, paddingVertical: 10, minHeight: layout.hitTarget, justifyContent: 'center', alignItems: 'center' },
  selected: { backgroundColor: colors.bluePale, borderColor: colors.blue },
  choiceText: { color: colors.navy, fontSize: 14, lineHeight: 20, fontWeight: '700', textAlign: 'center' },
  disclosure: { borderTopWidth: 1, borderTopColor: colors.border, marginTop: 16 },
  disclosureTitle: { minHeight: 52, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  disclosureText: { color: colors.navy, fontSize: 15, lineHeight: 22, fontWeight: '700', flex: 1 },
  disclosureMark: { width: 30, height: 30, borderRadius: 10, backgroundColor: colors.bluePale, alignItems: 'center', justifyContent: 'center' },
  disclosureSymbol: { color: colors.blue, fontSize: 18, lineHeight: 22, fontWeight: '700' },
  disclosureContent: { paddingBottom: 14 },
  content: { ...frame, paddingTop: 16, paddingBottom: 32, flexGrow: 1 },
  contentFill: { ...frame, paddingTop: 16, paddingBottom: 24, flex: 1 },
  back: { minHeight: layout.hitTarget, alignSelf: 'flex-start', justifyContent: 'center', paddingVertical: 10, paddingRight: 20, marginBottom: 8 },
  backText: { color: colors.blue, fontWeight: '700', fontSize: 15 },
  pill: { borderRadius: radius.pill, paddingHorizontal: 11, paddingVertical: 6, alignSelf: 'flex-start' },
  pillText: { fontSize: 11, lineHeight: 16, color: colors.navy, fontWeight: '800', letterSpacing: .3 },
  button: { minHeight: 54, backgroundColor: colors.blue, borderRadius: radius.field, justifyContent: 'center', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, marginTop: 12 },
  secondary: { ...surface.field },
  disabled: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  buttonText: { color: colors.white, fontSize: 16, lineHeight: 22, fontWeight: '800', textAlign: 'center' },
  track: { height: 7, backgroundColor: colors.border, borderRadius: radius.pill, overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: colors.blue, borderRadius: radius.pill, transformOrigin: 'left center' },
});
