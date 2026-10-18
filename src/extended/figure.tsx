import React from 'react';
import { Text, useWindowDimensions, View } from 'react-native';
import { fmt, graphMarkers, type GraphModel } from './model';
import { colors } from '../theme';

type Point = [number, number];
function line(a: Point, b: Point, key: string, color: string, weight = 1) {
  const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
  return <View key={key} style={{ position: 'absolute', left: (a[0] + b[0] - length) / 2, top: (a[1] + b[1]) / 2 - weight / 2, width: length, height: weight, backgroundColor: color, transform: [{ rotate: `${Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI}deg` }] }} />;
}
export function GraphFigure({ graph }: { graph: GraphModel }) {
  const { width: screen } = useWindowDimensions(), width = Math.max(180, Math.min(380, screen - 92)), height = 264, margin = 28;
  const [xmin, xmax, ymin, ymax] = graph.range;
  const pixel = (x: number, y: number): Point => [margin + (x - xmin) / (xmax - xmin) * (width - margin * 2), height - margin - (y - ymin) / (ymax - ymin) * (height - margin * 2)];
  const visible = (x: number, y: number) => x >= xmin && x <= xmax && y >= ymin && y <= ymax;
  const marker = (x: number, y: number, closed: boolean, key: string) => {
    if (!visible(x, y)) return null;
    const [left, top] = pixel(x, y);
    return <View key={key} style={{ position: 'absolute', left: left - 4, top: top - 4, width: 8, height: 8, borderRadius: 4, borderWidth: 1.8, borderColor: colors.blue, backgroundColor: closed ? colors.blue : '#FFFFFF' }} />;
  };
  const clip = (a: Point, b: Point): [Point, Point] | null => {
    let low = 0, high = 1;
    const dx = b[0] - a[0], dy = b[1] - a[1];
    for (const [p, q] of [[-dx, a[0] - xmin], [dx, xmax - a[0]], [-dy, a[1] - ymin], [dy, ymax - a[1]]]) {
      if (p === 0) { if (q < 0) return null; continue; }
      const t = q / p;
      if (p < 0) low = Math.max(low, t); else high = Math.min(high, t);
      if (low > high) return null;
    }
    return [[a[0] + low * dx, a[1] + low * dy], [a[0] + high * dx, a[1] + high * dy]];
  };
  return <View accessible accessibilityLabel="Образец построения графика. Координаты вершин и выколотых точек указаны в разборе." style={{ width, height, alignSelf: 'center', backgroundColor: '#FFFFFF', marginTop: 14, borderRadius: 12 }}>
    {Array.from({ length: 7 }, (_, i) => {
      const x = xmin + (xmax - xmin) * i / 6;
      return <React.Fragment key={`x${i}`}>{line(pixel(x, ymin), pixel(x, ymax), `vx${i}`, '#E6EAF1')}<Text allowFontScaling={false} style={{ position: 'absolute', left: pixel(x, ymin)[0] - 14, top: height - margin + 4, width: 28, fontSize: 9, textAlign: 'center', color: colors.muted }}>{fmt(x)}</Text></React.Fragment>;
    })}
    {Array.from({ length: 6 }, (_, i) => {
      const y = ymin + (ymax - ymin) * i / 5;
      return <React.Fragment key={`y${i}`}>{line(pixel(xmin, y), pixel(xmax, y), `hy${i}`, '#E6EAF1')}<Text allowFontScaling={false} style={{ position: 'absolute', left: 0, top: pixel(xmin, y)[1] - 5, width: 24, fontSize: 9, textAlign: 'right', color: colors.muted }}>{fmt(y)}</Text></React.Fragment>;
    })}
    {visible(0, ymin) && line(pixel(0, ymin), pixel(0, ymax), 'y-axis', colors.muted)}
    {visible(xmin, 0) && line(pixel(xmin, 0), pixel(xmax, 0), 'x-axis', colors.muted)}
    {graph.branches.flatMap((b, index) => {
      const lo = Math.max(xmin, b.from ?? xmin), hi = Math.min(xmax, b.to ?? xmax), [a, c, d] = b.coefficients, f = (x: number) => a * x * x + c * x + d;
      if (hi <= lo) return [];
      return Array.from({ length: 100 }, (_, i) => {
        const x1 = lo + (hi - lo) * i / 100, x2 = lo + (hi - lo) * (i + 1) / 100, segment = clip([x1, f(x1)], [x2, f(x2)]);
        return segment ? line(pixel(...segment[0]), pixel(...segment[1]), `b${index}-${i}`, colors.blue, 2) : null;
      });
    })}
    {graphMarkers(graph).map((p, i) => marker(p.x, p.y, p.closed, `point${i}`))}
    <Text style={{ position: 'absolute', right: 6, bottom: 6, color: colors.muted, fontSize: 10 }}>x</Text><Text style={{ position: 'absolute', left: 8, top: 5, color: colors.muted, fontSize: 10 }}>y</Text>
  </View>;
}
