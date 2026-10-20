import React from 'react';
import { View } from 'react-native';
import { graphMarkers, type GraphModel } from './model';
import { PlotStroke, ResponsivePlot } from '../coordinate-plot';
import { clipPlotSegment } from '../plot-layout';
import { colors } from '../theme';

export function GraphFigure({ graph }: { graph: GraphModel }) {
  return <ResponsivePlot range={graph.range} description="Образец построения графика. Координаты вершин и выколотых точек указаны в разборе.">
    {p => <>
      {graph.branches.flatMap((b, index) => {
        const [xmin, xmax] = p.range, lo = Math.max(xmin, b.from ?? xmin), hi = Math.min(xmax, b.to ?? xmax);
        const [a, c, d] = b.coefficients, f = (x: number) => a * x * x + c * x + d;
        if (hi <= lo) return [];
        const samples = Math.max(120, Math.ceil((hi - lo) * p.scale / 2));
        return Array.from({ length: samples }, (_, i) => {
          const x1 = lo + (hi - lo) * i / samples, x2 = lo + (hi - lo) * (i + 1) / samples;
          const segment = clipPlotSegment([x1, f(x1)], [x2, f(x2)], p.range);
          return segment ? <PlotStroke key={`b${index}-${i}`} a={p.pixel(...segment[0])} b={p.pixel(...segment[1])} color={colors.blue} weight={2} /> : null;
        });
      })}
      {graphMarkers(graph).map((point, i) => {
        if (point.x < p.range[0] || point.x > p.range[1] || point.y < p.range[2] || point.y > p.range[3]) return null;
        const [x, y] = p.pixel(point.x, point.y);
        return <View key={`point${i}`} testID={point.closed ? 'plot-closed-point' : 'plot-open-point'} style={{ position: 'absolute', left: x - 4, top: y - 4, width: 8, height: 8, borderRadius: 4, borderWidth: 1.8, borderColor: colors.blue, backgroundColor: point.closed ? colors.blue : '#FCFDFE' }} />;
      })}
    </>}
  </ResponsivePlot>;
}
