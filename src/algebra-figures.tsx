import React from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { curveSegments, functionValue, GRAPH_BOUNDS, displayNumber, type GraphQuestion, type PlotPoint } from './function-graphs';
import { solutionText, type NumberLineQuestion } from './number-lines';
import { colors } from './theme';

function stroke(a: PlotPoint, b: PlotPoint, key: string, color = colors.navy, weight = 1.5) {
  const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
  return <View key={key} style={{ position: 'absolute', left: (a[0] + b[0] - length) / 2, top: (a[1] + b[1]) / 2 - weight / 2, width: length, height: weight, backgroundColor: color, transform: [{ rotate: `${Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI}deg` }] }} />;
}
export function FunctionFigure({ question }: { question: GraphQuestion }) {
  const { width: screenWidth } = useWindowDimensions();
  const width = Math.min(300, screenWidth - 96), size = Math.min(190, width - 36), padding = 14;
  const span = GRAPH_BOUNDS.max - GRAPH_BOUNDS.min, cell = (size - 2 * padding) / span;
  const pixel = ([x, y]: PlotPoint): PlotPoint => [padding + (x - GRAPH_BOUNDS.min) * cell, padding + (GRAPH_BOUNDS.max - y) * cell];
  return <View style={{ width, marginTop: 12, marginBottom: 8 }}>
    {question.panels.map(panel => {
      const description = `График ${panel.label}, шаг сетки 1 по обеим осям. ` + [-4, -2, -1, 0, 1, 2, 4].map(x => {
        const y = functionValue(panel.fn, x);
        return Number.isFinite(y) && y >= -6 && y <= 6 ? `При x=${displayNumber(x)}, y≈${displayNumber(y)}.` : '';
      }).filter(Boolean).join(' ');
      return <View key={panel.label} style={styles.graphRow}>
        <Text style={styles.panelLabel}>{panel.label})</Text>
        <View accessible accessibilityLabel={description} style={[styles.canvas, { width: size, height: size }]}>
          {Array.from({ length: 13 }, (_, i) => i - 6).flatMap(i => [stroke(pixel([i, -6]), pixel([i, 6]), `xgrid${i}`, '#D1DBE7', 0.6), stroke(pixel([-6, i]), pixel([6, i]), `ygrid${i}`, '#D1DBE7', 0.6)])}
          {stroke(pixel([-6, 0]), pixel([6, 0]), 'xaxis', '#637892', 1.2)}
          {stroke(pixel([0, -6]), pixel([0, 6]), 'yaxis', '#637892', 1.2)}
          {stroke(pixel([5.6, 0.25]), pixel([6, 0]), 'xarrow1', '#637892', 1.2)}
          {stroke(pixel([5.6, -0.25]), pixel([6, 0]), 'xarrow2', '#637892', 1.2)}
          {stroke(pixel([-0.25, 5.6]), pixel([0, 6]), 'yarrow1', '#637892', 1.2)}
          {stroke(pixel([0.25, 5.6]), pixel([0, 6]), 'yarrow2', '#637892', 1.2)}
          {curveSegments(panel.fn).map(([a, b], i) => stroke(pixel(a), pixel(b), `curve${i}`, '#234E7F', 1.8))}
          {[-4, -2, 1, 2, 4].flatMap(n => {
            const [x, y] = pixel([n, 0]), [yx, yy] = pixel([0, n]);
            return [<Text key={`x${n}`} style={[styles.tick, { left: x - 5, top: y + 4 }]}>{n}</Text>, <Text key={`y${n}`} style={[styles.tick, { left: yx - 14, top: yy - 6 }]}>{n}</Text>];
          })}
          <Text style={[styles.tick, { left: pixel([0, 0])[0] - 13, top: pixel([0, 0])[1] + 4 }]}>0</Text>
          <Text style={[styles.axisLabel, { left: size - 12, top: pixel([0, 0])[1] - 14 }]}>x</Text>
          <Text style={[styles.axisLabel, { left: pixel([0, 0])[0] + 5, top: 0 }]}>y</Text>
        </View>
      </View>;
    })}
  </View>;
}
export function NumberLineFigure({ question }: { question: NumberLineQuestion }) {
  const { width: screenWidth } = useWindowDimensions();
  const width = Math.min(300, screenWidth - 96);
  const endpoints = question.choices.flatMap(set => set.flatMap(i => [i.lo, i.hi].filter((n): n is number => n !== null)));
  const min = Math.min(0, ...endpoints) - 2, max = Math.max(0, ...endpoints) + 2;
  const x = (n: number) => 18 + (n - min) * (width - 40) / (max - min), y = 25;
  return <View style={{ width, marginTop: 12, marginBottom: 8 }}>
    {question.choices.map((set, index) => <View key={index} accessible accessibilityLabel={`Вариант ${index + 1}: ${solutionText(set)}`} style={{ marginBottom: 10 }}>
      <Text style={styles.optionLabel}>{index + 1}) {solutionText(set)}</Text>
      <View style={[styles.canvas, { width, height: 55 }]}>
        {stroke([12, y], [width - 12, y], 'axis', '#637892', 1)}
        {stroke([width - 18, y - 3], [width - 12, y], 'arrow1', '#637892', 1)}
        {stroke([width - 18, y + 3], [width - 12, y], 'arrow2', '#637892', 1)}
        {set.map((i, idx) => stroke([i.lo === null ? 12 : x(i.lo), y], [i.hi === null ? width - 19 : x(i.hi), y], `range${idx}`, '#345A85', 3))}
        {set.flatMap((i, idx) => [[i.lo, i.loClosed], [i.hi, i.hiClosed]].map(([value, closed], side) => value === null ? null : <React.Fragment key={`${idx}-${side}`}>
          <View style={{ position: 'absolute', left: x(value as number) - 3.5, top: y - 3.5, width: 7, height: 7, borderRadius: 4, borderWidth: 1.3, borderColor: '#345A85', backgroundColor: closed ? '#345A85' : '#FCFDFE' }} />
          <Text style={[styles.tick, { left: x(value as number) - 18, top: y + 7, width: 36, textAlign: 'center', backgroundColor: 'transparent' }]}>{displayNumber(value as number)}</Text>
        </React.Fragment>))}
        <Text style={[styles.axisLabel, { left: width - 13, top: y + 7 }]}>x</Text>
      </View>
    </View>)}
  </View>;
}
const styles = StyleSheet.create({ graphRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'flex-start', gap: 8, marginBottom: 12 }, panelLabel: { fontSize: 15, fontWeight: '800', color: colors.navy, paddingTop: 7, width: 25 }, canvas: { position: 'relative', backgroundColor: '#FCFDFE', borderRadius: 8 }, tick: { position: 'absolute', fontSize: 10, lineHeight: 12, color: '#4E647E', backgroundColor: '#FCFDFE' }, axisLabel: { position: 'absolute', fontSize: 12, lineHeight: 14, fontWeight: '700', color: colors.navy }, optionLabel: { fontSize: 13, lineHeight: 19, color: colors.navy, fontWeight: '700', marginBottom: 2 } });
