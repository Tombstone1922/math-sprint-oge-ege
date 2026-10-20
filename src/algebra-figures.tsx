import React from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { curveSegments, functionValue, GRAPH_BOUNDS, displayNumber, type GraphQuestion, type PlotPoint } from './function-graphs';
import { solutionText, type NumberLineQuestion } from './number-lines';
import { colors } from './theme';
import { PlotStroke, ResponsivePlot } from './coordinate-plot';

function stroke(a: PlotPoint, b: PlotPoint, key: string, color = colors.navy, weight = 1.5) {
  const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
  return <View key={key} style={{ position: 'absolute', left: (a[0] + b[0] - length) / 2, top: (a[1] + b[1]) / 2 - weight / 2, width: length, height: weight, backgroundColor: color, transform: [{ rotate: `${Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI}deg` }] }} />;
}
export function FunctionFigure({ question }: { question: GraphQuestion }) {
  return <View style={{ alignSelf: 'stretch', marginTop: 12, marginBottom: 8 }}>
    {question.panels.map(panel => {
      const description = `График ${panel.label}. ` + [-4, -2, -1, 0, 1, 2, 4].map(x => {
        const y = functionValue(panel.fn, x);
        return Number.isFinite(y) && y >= -6 && y <= 6 ? `При x=${displayNumber(x)}, y≈${displayNumber(y)}.` : '';
      }).filter(Boolean).join(' ');
      return <View key={panel.label} style={{ alignSelf: 'stretch', marginBottom: 12 }}>
        <Text style={styles.panelLabel}>{panel.label})</Text>
        <ResponsivePlot compact range={[GRAPH_BOUNDS.min, GRAPH_BOUNDS.max, GRAPH_BOUNDS.min, GRAPH_BOUNDS.max]} description={description} title={`График ${panel.label}`}>
          {p => curveSegments(panel.fn).map(([a, b], i) => <PlotStroke key={i} a={p.pixel(...a)} b={p.pixel(...b)} color="#234E7F" weight={2} />)}
        </ResponsivePlot>
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
const styles = StyleSheet.create({ panelLabel: { fontSize: 15, fontWeight: '800', color: colors.navy, paddingTop: 7 }, canvas: { position: 'relative', backgroundColor: '#FCFDFE', borderRadius: 8 }, tick: { position: 'absolute', fontSize: 10, lineHeight: 12, color: '#4E647E', backgroundColor: '#FCFDFE' }, axisLabel: { position: 'absolute', fontSize: 12, lineHeight: 14, fontWeight: '700', color: colors.navy }, optionLabel: { fontSize: 13, lineHeight: 19, color: colors.navy, fontWeight: '700', marginBottom: 2 } });
