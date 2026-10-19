import React, { createContext, useContext, useEffect, useState } from 'react';
import { router, usePathname, useRootNavigationState } from 'expo-router';
import { Keyboard, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from './theme';
import { focusRoutes, hasFocusedRoute, mainTabs, selectedTab, type MainTab } from './navigation-model';

const NavigationSurface = createContext(false);
export const useBottomNavigation = () => useContext(NavigationSurface);
export function NavigationFrame({ children }: { children: React.ReactNode }) {
  const path = usePathname(), state = useRootNavigationState(), [keyboard, setKeyboard] = useState(false);
  useEffect(() => {
    const show = Keyboard.addListener('keyboardDidShow', () => setKeyboard(true)), hide = Keyboard.addListener('keyboardDidHide', () => setKeyboard(false));
    return () => { show.remove(); hide.remove(); };
  }, []);
  // A formula or explanation opened over a task must not offer accidental task abandonment.
  const focused = hasFocusedRoute(state) || focusRoutes.has(path.slice(1));
  const visible = !focused && !keyboard;
  return <NavigationSurface.Provider value={visible}><View style={{ flex: 1 }}>{children}{visible && <SafeAreaView edges={['bottom']} style={styles.safe}><View accessibilityRole="tablist" style={styles.bar}>{mainTabs.map(tab => {
    const selected = selectedTab(path) === tab.id;
    return <Pressable accessibilityRole="tab" accessibilityLabel={tab.title} aria-selected={selected} accessibilityState={{ selected }} key={tab.id} onPress={() => router.dismissTo(tab.path)} style={styles.tab}>
      <View style={[styles.iconBox, selected && { backgroundColor: colors.bluePale }]}><NavIcon name={tab.id} color={selected ? colors.blue : colors.muted} /></View>
      <Text maxFontSizeMultiplier={1.2} style={[styles.label, selected && { color: colors.blue, fontWeight: '800' }]}>{tab.title}</Text>
    </Pressable>;
  })}</View></SafeAreaView>}</View></NavigationSurface.Provider>;
}
function NavIcon({ name, color }: { name: MainTab; color: string }) {
  const line = { borderColor: color, borderWidth: 1.7 };
  if (name === 'topics') return <View style={{ width: 22, height: 22, flexWrap: 'wrap', flexDirection: 'row', gap: 4 }}>{[0, 1, 2, 3].map(i => <View key={i} style={[line, { width: 9, height: 9, borderRadius: 2 }]} />)}</View>;
  if (name === 'progress') return <View style={{ width: 23, height: 22, flexDirection: 'row', alignItems: 'flex-end', gap: 4, paddingBottom: 1 }}>{[9, 15, 21].map(h => <View key={h} style={{ height: h, width: 4, borderRadius: 2, backgroundColor: color }} />)}</View>;
  if (name === 'workbook') return <View style={{ width: 25, height: 21, flexDirection: 'row' }}><View style={[line, { width: 12, height: 20, borderTopLeftRadius: 4, borderBottomLeftRadius: 2, borderRightWidth: .8 }]} /><View style={[line, { width: 12, height: 20, borderTopRightRadius: 4, borderBottomRightRadius: 2, borderLeftWidth: .8 }]} /></View>;
  return <View style={[line, { width: 21, height: 23, borderRadius: 4, paddingTop: 6, paddingHorizontal: 3 }]}>{name === 'today' ? <><View style={{ height: 1.5, backgroundColor: color, marginHorizontal: -3 }} /><View style={{ width: 5, height: 5, backgroundColor: color, borderRadius: 2, marginTop: 4, marginLeft: 2 }} /></> : <>{[0, 1, 2].map(i => <View key={i} style={{ height: 1.5, backgroundColor: color, marginBottom: 3, width: i === 2 ? 8 : 12 }} />)}</>}</View>;
}
const styles = StyleSheet.create({ safe: { backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border }, bar: { flexDirection: 'row', minHeight: 68, paddingHorizontal: 3, paddingTop: 5, paddingBottom: 4 }, tab: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 58, gap: 3 }, iconBox: { width: 46, height: 31, alignItems: 'center', justifyContent: 'center', borderRadius: 12 }, label: { color: colors.muted, fontSize: 11, lineHeight: 16, fontWeight: '600' } });
