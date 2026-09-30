import React from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import type { FigureSpec } from './engine';
import { colors } from './theme';
import { GridFigure } from './grid-figure';

type Point = [number, number];
const line = (a: Point, b: Point, key: string, faint = false) => {
  const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const angle = Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI;
  return <View key={key} style={{ position: 'absolute', left: (a[0] + b[0] - length) / 2, top: (a[1] + b[1]) / 2 - 1, width: length, height: faint ? 1 : 2, backgroundColor: faint ? '#DDE5F0' : colors.navy, transform: [{ rotate: `${angle}deg` }] }} />;
};
const point = (name: string, x: number, y: number) => <Text key={name} style={[styles.label, { left: x, top: y }]}>{name}</Text>;

export function GeometryFigure({ figure }: { figure: FigureSpec }) {
  return figure.scene ? <GridFigure scene={figure.scene} /> : <LegacyFigure figure={figure} />;
}

function LegacyFigure({ figure }: { figure: FigureSpec }) {
  const { width } = useWindowDimensions();
  const scale = Math.min(1, (width - 100) / 260);
  const { kind } = figure;
  const grid = kind.startsWith('grid-');
  const dx = Math.max(1, Math.min(8, figure.dx ?? 3));
  const dy = Math.max(0, Math.min(6, figure.dy ?? 4));
  let drawing: React.ReactNode;

  if (grid) {
    const a: Point = [40, 158], b: Point = [40 + dx * 20, 158 - dy * 20];
    const origin: Point = [40, 158 - dy * 20], end: Point = [40 + dx * 20, 158];
    drawing = <>
      {Array.from({ length: 11 }, (_, i) => line([20 + 20 * i, 12], [20 + 20 * i, 178], `v${i}`, true))}
      {Array.from({ length: 9 }, (_, i) => line([20, 18 + 20 * i], [220, 18 + 20 * i], `h${i}`, true))}
      {kind === 'grid-rectangle' && <>{line(a, origin, 'a')}{line(origin, b, 'b')}{line(b, end, 'c')}{line(end, a, 'd')}</>}
      {kind === 'grid-triangle' && <>{line(a, origin, 'a')}{line(origin, end, 'b')}{line(end, a, 'c')}</>}
      {kind === 'grid-parallelogram' && <>{line(a, end, 'a')}{line(end, [b[0] + 20, b[1]], 'b')}{line([b[0] + 20, b[1]], [origin[0] + 20, origin[1]], 'c')}{line([origin[0] + 20, origin[1]], a, 'd')}</>}
      {kind === 'grid-segment' && line(a, b, 'ab')}
      {kind === 'grid-segment' && <>{point('A', a[0] - 20, a[1] - 4)}{point('B', b[0] + 3, b[1] - 16)}</>}
    </>;
  } else if (kind === 'claims') {
    drawing = <>
      {line([17, 81], [72, 81], 'r1')}{line([72, 81], [72, 130], 'r2')}{line([72, 130], [17, 130], 'r3')}{line([17, 130], [17, 81], 'r4')}
      <View style={{ position: 'absolute', left: 105, top: 79, width: 52, height: 52, borderRadius: 26, borderColor: colors.navy, borderWidth: 2 }} />
      {line([131, 105], [157, 105], 'rad')}
      {line([181, 130], [246, 130], 't1')}{line([246, 130], [211, 75], 't2')}{line([211, 75], [181, 130], 't3')}
      {point('1', 40, 42)}{point('2', 125, 42)}{point('3', 205, 42)}
    </>;
  } else if (kind === 'circle' || kind === 'circle-diameter' || kind === 'tangent' || kind === 'chord' || kind === 'secant') {
    drawing = <>
      <View style={styles.circle} />
      {kind === 'circle' ? <>
        {line([130, 97], [77, 44], 'oa')}{line([130, 97], [183, 44], 'ob')}
        {line([130, 172], [77, 44], 'ca')}{line([130, 172], [183, 44], 'cb')}
        {point('A', 54, 29)}{point('B', 187, 29)}{point('C', 124, 173)}{point('O', 133, 88)}
      </> : kind === 'circle-diameter' ? <>
        {line([55, 97], [205, 97], 'diameter')}
        {point('A', 36, 92)}{point('O', 119, 76)}{point('B', 209, 92)}
      </> : kind === 'chord' ? <>
        {line([70, 52], [190, 52], 'ab')}{line([130, 97], [130, 52], 'om')}{line([130, 97], [70, 52], 'oa')}
        <View style={[styles.rightAngle, { left: 130, top: 52 }]} />
        {point('A', 53, 37)}{point('B', 191, 37)}{point('O', 126, 99)}{point('M', 133, 53)}
      </> : kind === 'secant' ? <>
        {line([250, 97], [55, 97], 'secant')}{line([250, 97], [177, 38], 'tangent')}{line([130, 97], [177, 38], 'radius')}
        {point('P', 243, 102)}{point('B', 197, 102)}{point('C', 38, 102)}{point('A', 171, 20)}
      </> : <>
        {line([130, 97], [205, 97], 'oa')}{line([205, 15], [205, 177], 'pa')}{line([130, 97], [205, 15], 'op')}
        <View style={[styles.rightAngle, { left: 195, top: 87 }]} />
        {point('O', 116, 89)}{point('A', 207, 95)}{point('P', 207, 1)}
      </>}
    </>;
  } else {
    const vertices: Record<string, Point[]> = {
      triangle: [[36, 161], [215, 161], [125, 20]],
      isosceles: [[36, 161], [125, 20], [215, 161]],
      'right-triangle': [[43, 157], [215, 157], [43, 27]],
      rectangle: [[44, 30], [209, 30], [209, 157], [44, 157]],
      trapezoid: [[43, 157], [215, 157], [176, 35], [87, 35]],
      rhombus: [[130, 16], [219, 95], [130, 174], [41, 95]],
    };
    const verticesForKind = vertices[kind];
    drawing = <>
      {verticesForKind.map((p, i) => line(p, verticesForKind[(i + 1) % verticesForKind.length], String(i)))}
      {kind === 'right-triangle' && <View style={[styles.rightAngle, { left: 43, top: 146 }]} />}
      {kind === 'rhombus' && <>{line(verticesForKind[0], verticesForKind[2], 'diag1')}{line(verticesForKind[1], verticesForKind[3], 'diag2')}</>}
      {verticesForKind.map(([x, y], i) => point('ABCD'[i], x + (x > 180 ? 4 : -18), y + (y > 140 ? 1 : -18)))}
    </>;
  }
  return <View accessible accessibilityLabel={`Чертёж: ${grid ? `фигура на сетке, ${dx} по горизонтали и ${dy} по вертикали` : kind === 'claims' ? 'три рисунка: прямоугольник, окружность и треугольник' : kind.startsWith('circle') ? 'окружность с центром O и точками A, B, C' : kind === 'tangent' ? 'окружность, радиус OA и касательная PA' : 'фигура с обозначенными вершинами'}`} style={{ width: 260 * scale, height: 190 * scale, alignSelf: 'center', marginTop: 16, marginBottom: 2 }}>
    <View style={[styles.canvas, { position: 'absolute', left: -(260 - 260 * scale) / 2, top: -(190 - 190 * scale) / 2, transform: [{ scale }] }]}>{drawing}</View>
  </View>;
}

const styles = StyleSheet.create({ canvas: { width: 260, height: 190, marginTop: 16, marginBottom: 2, alignSelf: 'center' }, label: { position: 'absolute', fontSize: 14, fontWeight: '800', color: colors.navy }, circle: { position: 'absolute', left: 55, top: 22, width: 150, height: 150, borderRadius: 75, borderWidth: 2, borderColor: colors.navy }, rightAngle: { position: 'absolute', width: 11, height: 11, borderLeftWidth: 1.5, borderTopWidth: 1.5, borderColor: colors.navy } });
