import React from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import type { ChanceModel, VennModel, TreeModel } from './chance-models';
import { vennAtoms, vennEllipses, vennLabels, treeEdges, treeNodes } from './chance-layout';
import { displayNumber as f } from './function-graphs';
import { colors } from './theme';
export const hasChanceFigure = (model?: ChanceModel) => model?.kind === 'venn' || model?.kind === 'tree' || model?.kind === 'frequency';
function line(a: readonly number[], b: readonly number[], key: string) {
  const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
  return <View key={key} style={{ position: 'absolute', left: (a[0] + b[0] - length) / 2, top: (a[1] + b[1]) / 2 - 0.7, width: length, height: 1.4, backgroundColor: '#71849E', transform: [{ rotate: `${Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI}deg` }] }} />;
}
function Venn({ model, width }: { model: VennModel; width: number }) {
  const height = 190, points = model.display === 'points' || model.display === 'weighted-points';
  const description = ['Только A', 'A и B', 'Только B', 'Вне A и B'].map((region, i) => `${region}: ${model.display === 'points' ? `${model.regions[i].length} точек` : model.regions[i].map(f).join(', ')}.`).join(' ');
  return <View accessible accessibilityLabel={`Диаграмма Эйлера. ${description}`} style={[styles.canvas, { width, height }]}>
    <Text style={[styles.label, { left: 7, top: 5 }]}>Ω</Text>
    {vennEllipses.flatMap((e, i) => {
      const rows = Math.ceil(e.radii[1] * 2 * height);
      const fill = Array.from({ length: rows }, (_, row) => {
        const y = e.center[1] - e.radii[1] + (row + 0.5) / rows * e.radii[1] * 2;
        const half = e.radii[0] * Math.sqrt(1 - ((y - e.center[1]) / e.radii[1]) ** 2);
        return <View key={`fill${i}-${row}`} style={{ position: 'absolute', left: (e.center[0] - half) * width, top: y * height - 0.5, width: half * 2 * width, height: 1, backgroundColor: i ? 'rgba(156,191,220,0.35)' : 'rgba(166,202,181,0.35)' }} />;
      });
      const ring = Array.from({ length: 81 }, (_, n) => [width * (e.center[0] + e.radii[0] * Math.cos(n * Math.PI / 40)), height * (e.center[1] + e.radii[1] * Math.sin(n * Math.PI / 40))]);
      return [...fill, ...ring.slice(1).map((p, n) => line(ring[n], p, `ellipse${i}-${n}`))];
    })}
    <Text style={[styles.label, { left: 5, top: height * 0.55 - 9 }]}>A</Text><Text style={[styles.label, { right: 5, top: height * 0.55 - 9 }]}>B</Text>
    {points ? vennAtoms(model).map(({ point, weight }, i) => <React.Fragment key={i}><View style={{ position: 'absolute', left: point[0] * width - 2.5, top: point[1] * height - 2.5, width: 5, height: 5, borderRadius: 3, backgroundColor: colors.navy }} />{model.display === 'weighted-points' && <Text style={[styles.weight, { left: point[0] * width + 5, top: point[1] * height - 7 }]}>{f(weight)}</Text>}</React.Fragment>) : model.regions.map((values, i) => <Text key={i} style={[styles.region, { left: vennLabels[i][0] * width - 23, top: vennLabels[i][1] * height - 9 }]}>{f(values[0])}</Text>)}
  </View>;
}
function Tree({ model, width }: { model: TreeModel; width: number }) {
  const height = 210, edges = treeEdges(model);
  const description = `Дерево опыта: P(A)=${f(model.first)}, P(не A)=${f(1 - model.first)}. После A: P(B)=${f(model.afterA)}, P(не B)=${f(1 - model.afterA)}. После не A: P(B)=${f(model.afterNotA)}, P(не B)=${f(1 - model.afterNotA)}.`;
  return <View accessible accessibilityLabel={description} style={[styles.canvas, { width, height }]}>
    {edges.map((e, i) => line([e.a[0] * width, e.a[1] * height], [e.b[0] * width, e.b[1] * height], `edge${i}`))}
    {edges.map((e, i) => <Text key={i} style={[styles.branch, { left: (e.a[0] + e.b[0]) / 2 * width - 22, top: (e.a[1] + e.b[1]) / 2 * height - 8 }]}>{f(e.probability)}</Text>)}
    {treeNodes.map((node, i) => <React.Fragment key={i}><View style={{ position: 'absolute', left: node.point[0] * width - 2.5, top: node.point[1] * height - 2.5, width: 5, height: 5, borderRadius: 3, backgroundColor: colors.navy }} /><Text style={[styles.node, { left: node.point[0] * width - 22, top: node.point[1] * height + 5 }]}>{node.label}</Text></React.Fragment>)}
  </View>;
}
export function ChanceFigure({ model }: { model: ChanceModel }) {
  const { width: screenWidth } = useWindowDimensions();
  const width = Math.min(300, screenWidth - 96);
  if (model.kind === 'venn') return <Venn model={model} width={width} />;
  if (model.kind === 'tree') return <Tree model={model} width={width} />;
  if (model.kind !== 'frequency') return null;
  return <View style={[styles.table, { width }]}>
    {[['№', 'Выстрелы', 'Попадания'], ...model.rows.map((r, i) => [String(i + 1), String(r[0]), String(r[1])])].map((row, i) => <View key={i} style={[styles.tableRow, i === 0 && { backgroundColor: '#EAF0F6' }]}>{row.map((text, j) => <Text key={j} style={[styles.cell, j === 0 && { flex: 0.45 }]}>{text}</Text>)}</View>)}
  </View>;
}
const styles = StyleSheet.create({ canvas: { alignSelf: 'center', backgroundColor: '#FCFDFE', borderWidth: 1, borderColor: '#D8E1EB', borderRadius: 8, marginVertical: 12, position: 'relative' }, label: { position: 'absolute', fontSize: 14, fontWeight: '700', color: colors.navy }, region: { position: 'absolute', width: 46, textAlign: 'center', fontSize: 14, color: colors.navy }, weight: { position: 'absolute', fontSize: 11, color: colors.navy }, branch: { position: 'absolute', width: 44, textAlign: 'center', fontSize: 11, lineHeight: 16, color: colors.navy, backgroundColor: '#FCFDFE' }, node: { position: 'absolute', width: 44, textAlign: 'center', fontSize: 12, color: colors.navy }, table: { alignSelf: 'center', marginVertical: 12, borderWidth: 1, borderColor: '#C9D5E3', backgroundColor: '#FCFDFE' }, tableRow: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#D8E1EB', paddingVertical: 9 }, cell: { flex: 1, fontSize: 12, textAlign: 'center', color: colors.navy, fontWeight: '600' } });
