import { fmt, type PhysicsPlot } from './physics-model.ts';
import type { PhysicsInk } from './physics-drawing.ts';
const ink = '#20334B', blue = '#3565E8', orange = '#A54E12', grid = '#D7DFE8';
export function physicsPlotLayout(f: PhysicsPlot) {
  const left = 68, right = 360, top = 35, bottom = 222;
  const xmin = Math.min(...f.xTicks), xmax = Math.max(...f.xTicks), ymin = Math.min(...f.yTicks), ymax = Math.max(...f.yTicks);
  const X = (x: number) => left + (x - xmin) / (xmax - xmin) * (right - left), Y = (y: number) => bottom - (y - ymin) / (ymax - ymin) * (bottom - top);
  return { left, right, top, bottom, xmin, xmax, ymin, ymax, X, Y, axisX: X(Math.max(xmin, Math.min(0, xmax))), axisY: Y(Math.max(ymin, Math.min(0, ymax))) };
}
export function plotDrawing(f: PhysicsPlot): PhysicsInk[] {
  const items: PhysicsInk[] = [], { left, right, top, bottom, xmin, xmax, ymin, ymax, X, Y, axisX, axisY } = physicsPlotLayout(f);
  const line = (x1: number, y1: number, x2: number, y2: number, weight = 1, stroke = ink) => items.push({ kind: 'line', x1, y1, x2, y2, weight, stroke });
  const text = (x: number, y: number, value: string, size = 13, width = 60, bold = false, color = ink) => items.push({ kind: 'text', x, y, value, size, width, bold, color });
  const arrow = (x1: number, y1: number, x2: number, y2: number) => { line(x1, y1, x2, y2, 1.6); const a = Math.atan2(y2 - y1, x2 - x1); for (const s of [-1, 1]) line(x2, y2, x2 - 7 * Math.cos(a + s * .45), y2 - 7 * Math.sin(a + s * .45), 1.6); };
  const minorStep = (ticks: number[]) => {
    const sorted = [...ticks].sort((a, b) => a - b), range = sorted.at(-1)! - sorted[0];
    let step = Math.min(...sorted.slice(1).map((v, i) => v - sorted[i])) / 2;
    while (range / step < 6) step /= 2;
    if (range / step > 32) step = range / 8;
    return step;
  };
  const gridValues = (min: number, max: number, step: number, ticks: number[]) => [...Array.from({ length: Math.min(65, Math.floor((max - min) / step + 1e-7) + 1) }, (_, i) => min + i * step), ...ticks].sort((a, b) => a - b).filter((v, i, all) => i === 0 || Math.abs(v - all[i - 1]) > 1e-7);
  for (const x of gridValues(xmin, xmax, f.xGridStep ?? minorStep(f.xTicks), f.xTicks)) line(X(x), top, X(x), bottom, .8, grid);
  for (const y of gridValues(ymin, ymax, f.yGridStep ?? minorStep(f.yTicks), f.yTicks)) line(left, Y(y), right, Y(y), .8, grid);
  arrow(left, axisY, right + 9, axisY); arrow(axisX, bottom, axisX, top - 12);
  for (const x of f.xTicks) { line(X(x), axisY - 4, X(x), axisY + 4, 1.3); text(X(x), axisY + 18, fmt(x)); }
  for (const y of f.yTicks) { line(axisX - 4, Y(y), axisX + 4, Y(y), 1.3); text(axisX - 31, Y(y) + 3, fmt(y), 13, 58); }
  text(319, f.curves ? 242 : axisY + 41, f.xLabel, 16, 130, true); text(143, 14, f.yLabel, 16, 220, true);
  const curves = f.curves ?? [{ label: '', points: f.points }];
  for (const [index, curve] of curves.entries()) {
    const color = index ? blue : f.curves ? orange : blue; let distance = 0;
    for (let j = 1; j < curve.points.length; j++) {
      const p = curve.points[j - 1], q = curve.points[j], x1 = X(p[0]), y1 = Y(p[1]), dx = X(q[0]) - x1, dy = Y(q[1]) - y1, length = Math.hypot(dx, dy);
      if (!curve.dashed) line(x1, y1, x1 + dx, y1 + dy, 2.4, color);
      else { let offset = 0; while (offset < length - 1e-8) { const phase = (distance + offset) % 10, span = Math.min(length - offset, (phase < 6 ? 6 : 10) - phase); if (phase < 6) line(x1 + dx * offset / length, y1 + dy * offset / length, x1 + dx * (offset + span) / length, y1 + dy * (offset + span) / length, 2.4, color); offset += Math.max(span, 1e-7); } }
      distance += length;
    }
    if (curve.label) { const last = curve.points.at(-1)!; text(376, Math.max(top + 8, Math.min(bottom - 8, Y(last[1]) + 4)), curve.label, 16, 24, true, color); }
  }
  if (f.curves) text(211, 267, '1 — сплошная; 2 — штриховая', 13, 340);
  return items;
}
