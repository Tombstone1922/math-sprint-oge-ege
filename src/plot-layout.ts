export type PlotPoint = readonly [number, number];
export type PlotRange = readonly [number, number, number, number];

const niceStep = (minimum: number) => {
  const power = 10 ** Math.floor(Math.log10(Math.max(1, minimum)));
  return [1, 2, 5, 10].map(n => n * power).find(n => n >= minimum - 1e-9)!;
};
const multiples = (min: number, max: number, step: number) => Array.from(
  { length: Math.max(0, Math.floor(max / step) - Math.ceil(min / step) + 1) },
  (_, i) => (Math.ceil(min / step) + i) * step,
);
export const plotNumber = (value: number) => String(Number(value.toFixed(8))).replace('-', '−').replace('.', ',');

// Keep the origin visible, square cells, and whole-number divisions anchored at zero.
export function plotLayout(requested: PlotRange, width: number, height: number, enlarged = false) {
  const range: PlotRange = [Math.min(-1, requested[0]), Math.max(1, requested[1]), Math.min(-1, requested[2]), Math.max(1, requested[3])];
  const [xmin, xmax, ymin, ymax] = range;
  const margins = { left: enlarged ? 44 : 34, right: 24, top: 26, bottom: 32 };
  const availableWidth = width - margins.left - margins.right, availableHeight = height - margins.top - margins.bottom;
  const scale = Math.min(availableWidth / (xmax - xmin), availableHeight / (ymax - ymin));
  const left = margins.left + (availableWidth - (xmax - xmin) * scale) / 2;
  const top = margins.top + (availableHeight - (ymax - ymin) * scale) / 2;
  const pixel = (x: number, y: number): PlotPoint => [left + (x - xmin) * scale, top + (ymax - y) * scale];
  const gridStep = niceStep(12 / scale);
  const labelStep = gridStep * niceStep((enlarged ? 34 : 26) / (scale * gridStep));
  const fontSize = enlarged ? 13 : 11, labelHeight = enlarged ? 18 : 14;
  const origin = pixel(0, 0);
  const labels = (axis: 'x' | 'y') => multiples(axis === 'x' ? xmin : ymin, axis === 'x' ? xmax : ymax, labelStep).filter(n => n !== 0).map(value => {
    const text = plotNumber(value), w = Math.max(14, text.length * fontSize * .65 + 4);
    const [x, y] = axis === 'x' ? pixel(value, 0) : pixel(0, value);
    return { value, text, width: w, height: labelHeight, x: axis === 'x' ? x - w / 2 : x - w - 7, y: axis === 'x' ? y + (enlarged ? 6 : 5) : y - labelHeight / 2 };
  });
  return { width, height, range, scale, pixel, origin, gridStep, labelStep, fontSize, labelHeight,
    originLabel: { x: origin[0] - (enlarged ? 18 : 14), y: origin[1] + (enlarged ? 6 : 4), width: enlarged ? 14 : 10, height: enlarged ? 16 : 12, fontSize: enlarged ? 12 : 10 },
    xTicks: multiples(xmin, xmax, gridStep), yTicks: multiples(ymin, ymax, gridStep), xLabels: labels('x'), yLabels: labels('y') };
}
export type PlotLayout = ReturnType<typeof plotLayout>;

// Clip in mathematical coordinates; never draw a diagonal across a discontinuity.
export function clipPlotSegment(a: PlotPoint, b: PlotPoint, [xmin, xmax, ymin, ymax]: PlotRange): [PlotPoint, PlotPoint] | null {
  if (![...a, ...b].every(Number.isFinite)) return null;
  let lo = 0, hi = 1;
  const dx = b[0] - a[0], dy = b[1] - a[1];
  for (const [p, q] of [[-dx, a[0] - xmin], [dx, xmax - a[0]], [-dy, a[1] - ymin], [dy, ymax - a[1]]]) {
    if (Math.abs(p) < 1e-12) { if (q < 0) return null; continue; }
    const t = q / p;
    if (p < 0) lo = Math.max(lo, t); else hi = Math.min(hi, t);
    if (lo > hi) return null;
  }
  return [[a[0] + lo * dx, a[1] + lo * dy], [a[0] + hi * dx, a[1] + hi * dy]];
}
