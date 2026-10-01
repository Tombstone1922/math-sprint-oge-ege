import React from 'react';
import { Text, View, StyleSheet, useWindowDimensions } from 'react-native';
import { mathText, type MathExpr, type NumericTask } from './numeric-expressions';
import { axisPosition, type AxisScene } from './order-models';
import { colors } from './theme';
const compound = (e: MathExpr) => e.kind === 'add' || e.kind === 'subtract';
export function formulaUnits(e: MathExpr): number {
  if (e.kind === 'mixed') return String(e.whole).length * 0.62 + Math.max(String(e.numerator).length, String(e.denominator).length) * 0.62 + 1;
  if (e.kind === 'number') return Math.max(1, String(e.value).length * 0.62);
  if (e.kind === 'variable') return 0.7;
  if (e.kind === 'sqrt') return formulaUnits(e.arg) + 1;
  if (e.kind === 'power') return formulaUnits(e.base) + String(e.exponent).length * 0.43 + (e.base.kind === 'number' && e.base.value >= 0 || e.base.kind === 'variable' ? 0 : 0.8);
  if (e.kind === 'divide') return Math.max(formulaUnits(e.left), formulaUnits(e.right)) + 0.8;
  return formulaUnits(e.left) + formulaUnits(e.right) + 1.15 + (e.kind === 'multiply' ? (compound(e.left) ? 0.8 : 0) + (compound(e.right) ? 0.8 : 0) : e.kind === 'subtract' && compound(e.right) ? 0.8 : 0);
}
function Formula({ expr, size, wrap = false }: { expr: MathExpr; size: number; wrap?: boolean }) {
  const text = (s: string, small = false) => <Text style={{ color: colors.ink, fontSize: size * (small ? 0.68 : 1), lineHeight: size * (small ? 0.88 : 1.35), fontWeight: '600' }}>{s}</Text>;
  let body: React.ReactNode;
  if (expr.kind === 'mixed') body = <View style={styles.inline}>{text(String(expr.whole) + ' ')}<Formula expr={{ kind: 'divide', left: { kind: 'number', value: expr.numerator }, right: { kind: 'number', value: expr.denominator } }} size={size} /></View>;
  else if (expr.kind === 'number' || expr.kind === 'variable') body = text(mathText(expr));
  else if (expr.kind === 'sqrt') body = <View style={styles.inline}>{text('√')}<View style={{ borderTopWidth: 1, borderTopColor: colors.ink, paddingHorizontal: 2 }}><Formula expr={expr.arg} size={size} /></View></View>;
  else if (expr.kind === 'power') body = <View style={styles.inline}><Formula expr={expr.base} size={size} wrap={expr.base.kind !== 'variable' && !(expr.base.kind === 'number' && expr.base.value >= 0)} /><View style={{ alignSelf: 'flex-start', marginTop: -size * 0.2 }}>{text(String(expr.exponent).replace('-', '−'), true)}</View></View>;
  else if (expr.kind === 'divide') body = <View style={{ alignItems: 'center', paddingHorizontal: size * 0.2 }}><View style={{ paddingHorizontal: 3, paddingBottom: 2 }}><Formula expr={expr.left} size={size * 0.9} /></View><View style={{ width: '100%', borderTopWidth: 1, borderTopColor: colors.ink }} /><View style={{ paddingHorizontal: 3, paddingTop: 2 }}><Formula expr={expr.right} size={size * 0.9} /></View></View>;
  else body = <View style={styles.inline}><Formula expr={expr.left} size={size} wrap={expr.kind === 'multiply' && compound(expr.left)} />{text(expr.kind === 'add' ? ' + ' : expr.kind === 'subtract' ? ' − ' : ' · ')}<Formula expr={expr.right} size={size} wrap={(expr.kind === 'multiply' || expr.kind === 'subtract') && compound(expr.right)} /></View>;
  return wrap ? <View style={styles.inline}>{text('(')}{body}{text(')')}</View> : <>{body}</>;
}
export function NumericFigure({ task }: { task: NumericTask }) {
  const { width } = useWindowDimensions(), available = Math.min(300, width - 100);
  const size = Math.min(22, available / formulaUnits(task.formula));
  return <View style={{ alignSelf: 'stretch', alignItems: 'center', marginVertical: 18 }}>
    <View accessible accessibilityLabel={mathText(task.formula)} style={styles.inline}><Formula expr={task.formula} size={size} /></View>
    {task.choices && <View style={styles.choices}>{task.choices.map((expr, i) => <View key={i} accessible accessibilityLabel={`Вариант ${i + 1}: ${mathText(expr)}`} style={styles.option}><Text style={styles.optionNumber}>{i + 1}) </Text><Formula expr={expr} size={16} /></View>)}</View>}
  </View>;
}
export function AxisFigure({ scene }: { scene: AxisScene }) {
  const { width } = useWindowDimensions(), w = Math.min(300, width - 96), y = 50;
  const description = `Координатная прямая. Деления: ${scene.ticks.map(t => t.label).join(', ')}. Точки слева направо: ${[...scene.points].sort((a, b) => a.value - b.value).map(p => p.label).join(', ')}.`;
  return <View accessible accessibilityLabel={description} style={[styles.axis, { width: w }]}>
    <View style={{ position: 'absolute', left: 8, right: 9, top: y, height: 1.5, backgroundColor: colors.navy }} /><Text style={{ position: 'absolute', right: 1, top: y - 11, fontSize: 18, color: colors.navy }}>›</Text>
    {scene.ticks.map((tick, i) => <React.Fragment key={i}><View style={{ position: 'absolute', left: axisPosition(scene, tick.value) * w, top: y - 4, height: 9, width: 1, backgroundColor: colors.navy }} /><Text style={[styles.tick, { left: axisPosition(scene, tick.value) * w - 18, top: y + 10 }]}>{tick.label}</Text></React.Fragment>)}
    {scene.points.map((point, i) => <React.Fragment key={i}><View style={{ position: 'absolute', left: axisPosition(scene, point.value) * w - 3, top: y - 3, height: 6, width: 6, borderRadius: 3, backgroundColor: '#A16C38' }} /><Text style={[styles.point, { left: axisPosition(scene, point.value) * w - 15, top: i % 2 ? 27 : 9 }]}>{point.label}</Text><View style={{ position: 'absolute', left: axisPosition(scene, point.value) * w - 0.5, top: i % 2 ? 44 : 26, height: i % 2 ? 3 : 21, width: 1, backgroundColor: '#C8AD8B' }} /></React.Fragment>)}
  </View>;
}
const styles = StyleSheet.create({ inline: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }, choices: { flexDirection: 'row', flexWrap: 'wrap', width: '100%', marginTop: 16, rowGap: 12 }, option: { width: '50%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }, optionNumber: { fontSize: 15, color: colors.muted }, axis: { height: 100, alignSelf: 'center', marginVertical: 10, borderWidth: 1, borderColor: colors.border, borderRadius: 8, backgroundColor: '#FCFDFE' }, tick: { position: 'absolute', width: 36, textAlign: 'center', fontSize: 11, color: colors.navy }, point: { position: 'absolute', width: 30, textAlign: 'center', fontSize: 14, fontWeight: '700', color: colors.navy } });
