export type FunctionSpec = { kind: 'linear' | 'quadratic' | 'reciprocal' | 'sqrt'; a: number; b: number; c: number; coefficient?: string };
export type GraphPanel = { label: string; fn: FunctionSpec };
export type GraphQuestion = { panels: GraphPanel[]; options: { text: string; fn?: FunctionSpec; signs?: [number, number] }[]; direction: 'graphs-to-options' | 'options-to-graphs'; signs?: 'linear' | 'quadratic' };
export type PlotPoint = readonly [number, number];
export const GRAPH_BOUNDS = { min: -6, max: 6 } as const;
export const displayNumber = (value: number) => String(Number(value.toFixed(8))).replace('-', '−').replace('.', ',');
export function functionValue(fn: FunctionSpec, x: number): number {
  if (fn.kind === 'linear') return fn.a * x + fn.c;
  if (fn.kind === 'quadratic') return fn.a * x * x + fn.b * x + fn.c;
  if (fn.kind === 'reciprocal') return fn.a / x;
  return x >= fn.b ? fn.a * Math.sqrt(x - fn.b) + fn.c : NaN;
}
const term = (n: number, suffix = '') => `${n < 0 ? ' − ' : ' + '}${displayNumber(Math.abs(n))}${suffix}`;
export function functionFormula(fn: FunctionSpec): string {
  const a = fn.coefficient ?? displayNumber(fn.a);
  if (fn.kind === 'reciprocal') return `y = (${a})/x`;
  if (fn.kind === 'sqrt') return `y = ${a}√(x${fn.b ? term(-fn.b) : ''})${fn.c ? term(fn.c) : ''}`;
  return `y = ${a}x${fn.kind === 'quadratic' ? '²' : ''}${fn.kind === 'quadratic' && fn.b ? term(fn.b, 'x') : ''}${fn.c ? term(fn.c) : ''}`;
}
// Clip each segment to the viewport; never connect opposite branches of a hyperbola.
export function curveSegments(fn: FunctionSpec): [PlotPoint, PlotPoint][] {
  const segments: [PlotPoint, PlotPoint][] = [], { min, max } = GRAPH_BOUNDS;
  for (let i = 0; i < 240; i++) {
    const x1 = min + (max - min) * i / 240, x2 = min + (max - min) * (i + 1) / 240;
    if (fn.kind === 'reciprocal' && x1 * x2 <= 0) continue;
    const y1 = functionValue(fn, x1), y2 = functionValue(fn, x2);
    if (!Number.isFinite(y1) || !Number.isFinite(y2)) continue;
    const dx = x2 - x1, dy = y2 - y1;
    let lo = 0, hi = 1, outside = false;
    const p = [-dx, dx, -dy, dy], q = [x1 - min, max - x1, y1 - min, max - y1];
    for (let k = 0; k < 4; k++) {
      if (Math.abs(p[k]) < 1e-12) { if (q[k] < 0) outside = true; }
      else if (p[k] < 0) lo = Math.max(lo, q[k] / p[k]);
      else hi = Math.min(hi, q[k] / p[k]);
    }
    if (!outside && lo <= hi) segments.push([[x1 + lo * dx, y1 + lo * dy], [x1 + hi * dx, y1 + hi * dy]]);
  }
  return segments;
}
