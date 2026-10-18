import React, { useMemo } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import { geometryLayout } from './geometry-layout';
import { polygonSlice, type GridPoint, type GridScene } from './grid-geometry';
import { rightAngleStrokes } from './analytic-geometry';
import { colors } from './theme';

function stroke(a: GridPoint, b: GridPoint, key: string, color = colors.navy, weight = 1.8) {
  const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
  return <View key={key} style={{ position: 'absolute', left: (a[0] + b[0] - length) / 2, top: (a[1] + b[1]) / 2 - weight / 2, width: length, height: weight, backgroundColor: color, transform: [{ rotate: `${Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI}deg` }] }} />;
}

export function GridFigure({ scene, enlarged = false }: { scene: GridScene; enlarged?: boolean }) {
  const { width: screenWidth } = useWindowDimensions();
  const width = enlarged ? scene.grid === false ? 620 : Math.max(620, scene.columns * 40) : Math.min(300, screenWidth - 96), height = enlarged ? scene.grid === false ? 460 : Math.max(460, scene.rows * 40) : 240;
  const layout = useMemo(() => geometryLayout(scene, width, height, enlarged ? 20 : 14), [scene, width, height, enlarged]);
  const { cell, pixel } = layout;
  const circleStyle = (center: GridPoint, radius: number) => {
    const [cx, cy] = pixel(center), r = radius * cell;
    return { position: 'absolute' as const, left: cx - r, top: cy - r, width: r * 2, height: r * 2, borderRadius: r };
  };
  const gridAccessibility = `Клетчатая сетка ${scene.columns} на ${scene.rows}, клетка 1 на 1. `
    + Object.entries(scene.points).map(([name, p]) => `${name}: ${p[0]} вправо, ${p[1]} вверх от левого нижнего угла.`).join(' ')
    + scene.polygons.map(p => `Вершины фигуры: ${p.vertices.map(v => v.join(', ')).join('; ')}.`).join(' ')
    + scene.circles.map(c => `Круг: центр ${c.center.join(', ')}, радиус ${c.radius}.`).join(' ');
  const accessibility = scene.grid === false ? `Геометрический рисунок. Точки: ${Object.keys(scene.points).join(', ')}. ` + scene.polygons.map(p => `Контур: ${p.vertices.map(v => Object.entries(scene.points).find(([, q]) => q[0] === v[0] && q[1] === v[1])?.[0] ?? '').join(', ')}.`).join(' ') + ' Числовые данные приведены в условии.' : gridAccessibility;
  return <View accessible accessibilityLabel={accessibility} style={[styles.canvas, { width, height }]}>
    {scene.polygons.flatMap((polygon, index) => {
      if (!polygon.shaded) return [];
      const minY = Math.min(...polygon.vertices.map(p => p[1]));
      const maxY = Math.max(...polygon.vertices.map(p => p[1]));
      return Array.from({ length: Math.ceil((maxY - minY) * cell) }, (_, row) => {
        const y = minY + (row + 0.5) / cell;
        return polygonSlice(polygon.vertices, y).map(([a, b], span) => {
          const [x, py] = pixel([a, y]);
          return <View key={`shade-${index}-${row}-${span}`} style={{ position: 'absolute', left: x, top: py - 0.6, width: (b - a) * cell, height: 1.2, backgroundColor: '#DEE8F5' }} />;
        });
      });
    })}
    {scene.grid !== false && scene.circles.map((circle, i) => <View key={`fill-circle-${i}`} style={[circleStyle(circle.center, circle.radius), { backgroundColor: '#E6EDF7' }]} />)}
    {scene.grid !== false && Array.from({ length: scene.columns + 1 }, (_, i) => stroke(pixel([i, 0]), pixel([i, scene.rows]), `col${i}`, '#BCC8D8', 0.7))}
    {scene.grid !== false && Array.from({ length: scene.rows + 1 }, (_, i) => stroke(pixel([0, i]), pixel([scene.columns, i]), `row${i}`, '#BCC8D8', 0.7))}
    {scene.polygons.flatMap((polygon, index) => polygon.vertices.map((p, i) => stroke(pixel(p), pixel(polygon.vertices[(i + 1) % polygon.vertices.length]), `edge${index}-${i}`)))}
    {scene.segments.map(([a, b], i) => stroke(pixel(a), pixel(b), `segment${i}`))}
    {scene.circles.map((circle, i) => <View key={`outline-circle-${i}`} style={[circleStyle(circle.center, circle.radius), { borderWidth: 1.8, borderColor: colors.navy }]} />)}
    {scene.grid === false && rightAngleStrokes(scene).map(([a, b], i) => stroke(pixel(a), pixel(b), `right-angle${i}`, '#637892', 1))}
    {layout.labels.map(label => {
      const [x, y] = label.point;
      return <React.Fragment key={label.name}>
        <View style={{ position: 'absolute', left: x - 2.5, top: y - 2.5, width: 5, height: 5, borderRadius: 3, backgroundColor: colors.navy }} />
        <Text allowFontScaling={false} style={[styles.label, { left: label.x, top: label.y, width: label.width, height: label.height, fontSize: layout.fontSize, lineHeight: label.height }]}>{label.name}</Text>
      </React.Fragment>;
    })}
  </View>;
}
const styles = StyleSheet.create({ canvas: { alignSelf: 'center', backgroundColor: '#FCFDFE', marginTop: 14, marginBottom: 8, borderRadius: 8 }, label: { position: 'absolute', fontSize: 14, lineHeight: 18, fontWeight: '800', color: colors.navy, backgroundColor: '#FCFDFE' } });
