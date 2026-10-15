import React, { useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, Pill, Screen, type } from './components';
import { colors } from './theme';
import { decimalExpansion, fractionDenominators, type FractionConversion } from './fraction-decimals';

export function WrittenFraction({ n, d, size = 25 }: { n: number; d: number; size?: number }) {
  return <View accessible accessibilityLabel={`${n} делить на ${d}`} style={{ alignItems: 'center', minWidth: size * 1.1, paddingHorizontal: 5 }}>
    <Text style={{ color: colors.ink, fontSize: size, fontWeight: '700' }}>{n}</Text>
    <View style={{ alignSelf: 'stretch', height: 2, backgroundColor: colors.ink, marginVertical: 3 }} />
    <Text style={{ color: colors.ink, fontSize: size, fontWeight: '700' }}>{d}</Text>
  </View>;
}
export function FractionConversionFigure({ value }: { value: FractionConversion }) {
  const { numerator: n, denominator: d } = value;
  const wholes = Math.floor(n / d), remainder = n % d;
  return <View style={{ alignItems: 'center', width: '100%', marginVertical: 20 }}>
    <View style={styles.equation}><WrittenFraction n={n} d={d} size={38} /><Text style={{ fontSize: 32, color: colors.muted }}> = ?</Text></View>
    <View accessible accessibilityLabel={`${wholes} целых и ${remainder} долей из ${d}`} style={{ width: '100%', marginTop: 20, gap: 5 }}>
      {Array.from({ length: wholes + (remainder ? 1 : 0) }, (_, row) => <View key={row} style={styles.strip}>{Array.from({ length: d }, (_, cell) => <View key={cell} style={{ flex: 1, height: 16, backgroundColor: row < wholes || cell < remainder ? '#7595DB' : '#E9EEF7', borderRightWidth: cell < d - 1 ? 1 : 0, borderColor: '#FFFFFF' }} />)}</View>)}
    </View>
  </View>;
}
export function FractionReference() {
  const [open, setOpen] = useState(false);
  const [denominator, setDenominator] = useState<number>(8);
  return <>
    <Pressable accessibilityRole="button" accessibilityLabel="Открыть общую памятку дробей" onPress={() => setOpen(true)} style={styles.launch}>
      <View><Text style={styles.launchTitle}>Дроби → десятичные</Text><Text style={styles.launchText}>Общая памятка · знаменатели 2–16</Text></View><Text style={{ color: colors.blue, fontSize: 24 }}>↗</Text>
    </Pressable>
    <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}><Screen>
      <Button secondary title="Закрыть памятку" onPress={() => setOpen(false)} />
      <View style={{ marginTop: 22 }}><Pill>ПОД РУКОЙ</Pill></View><Text style={[type.title, { marginTop: 12 }]}>Узнавай дробь{ '\n' }с первого взгляда</Text>
      <Text style={[type.body, { marginVertical: 12 }]}>Дели числитель на знаменатель. Восьмые меняются с шагом 0,125, четверти — с шагом 0,25. Цифры в скобках повторяются бесконечно: 0,(3) = 0,333…</Text>
      <View style={styles.anchors}>{[[1, 8], [3, 8], [1, 4], [1, 2]].map(([n, d]) => <View key={`${n}-${d}`} style={styles.anchor}><WrittenFraction n={n} d={d} size={20} /><Text style={styles.anchorValue}>= {decimalExpansion(n, d)}</Text></View>)}</View>
      <Text style={[type.section, { marginTop: 22, marginBottom: 12 }]}>Выбери знаменатель</Text>
      <View style={styles.chips}>{fractionDenominators.map(d => <Pressable key={d} accessibilityRole="button" accessibilityLabel={`Знаменатель ${d}`} accessibilityState={{ selected: d === denominator }} onPress={() => setDenominator(d)} style={[styles.chip, d === denominator && { backgroundColor: colors.blue }]}><Text style={{ color: d === denominator ? colors.white : colors.navy, fontWeight: '800', fontSize: 17 }}>{d}</Text></Pressable>)}</View>
      <View style={styles.table}>{Array.from({ length: denominator - 1 }, (_, i) => i + 1).map(n => <View key={n} style={styles.tableRow}><WrittenFraction n={n} d={denominator} size={21} /><Text style={{ color: colors.muted, fontSize: 22 }}>=</Text><Text style={styles.decimal}>{decimalExpansion(n, denominator)}</Text></View>)}</View>
      <View style={styles.note}><Text style={styles.launchTitle}>Больше единицы</Text><View style={[styles.equation, { marginTop: 12 }]}><WrittenFraction n={17} d={8} size={22} /><Text style={styles.decimal}>= 2,125</Text></View><Text style={[type.body, { fontSize: 14, marginTop: 8 }]}>17 ÷ 8: две целые и ещё одна восьмая. Поэтому 2 + 0,125 = 2,125.</Text></View>
      <Button title="Вернуться к заданию" onPress={() => setOpen(false)} />
    </Screen></Modal>
  </>;
}
const styles = StyleSheet.create({ equation: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 }, strip: { flexDirection: 'row', overflow: 'hidden', borderRadius: 5 }, launch: { marginTop: 16, padding: 16, borderRadius: 18, borderWidth: 1, borderColor: '#D9E4FA', backgroundColor: '#EDF3FF', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }, launchTitle: { fontSize: 16, color: colors.navy, fontWeight: '800' }, launchText: { color: colors.muted, fontSize: 12, marginTop: 4 }, anchors: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 }, anchor: { width: '47%', minHeight: 90, padding: 10, borderRadius: 18, backgroundColor: '#F0F6F3', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5 }, anchorValue: { fontSize: 17, fontWeight: '800', color: colors.green }, chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 }, chip: { minWidth: 44, minHeight: 44, padding: 10, borderRadius: 14, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }, table: { marginTop: 16, borderRadius: 20, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', backgroundColor: colors.white }, tableRow: { flexDirection: 'row', alignItems: 'center', gap: 18, padding: 14, borderBottomWidth: 1, borderColor: colors.border }, decimal: { fontSize: 23, fontWeight: '800', color: colors.navy }, note: { marginTop: 18, padding: 18, borderRadius: 20, backgroundColor: colors.amber } });
