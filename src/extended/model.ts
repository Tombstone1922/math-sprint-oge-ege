import type { GridScene } from '../grid-geometry.ts';

export type ExtendedNumber = 20 | 21 | 22 | 23 | 24 | 25;
export const extendedNumbers: readonly ExtendedNumber[] = [20, 21, 22, 23, 24, 25];
export type SolutionStep = { title: string; text: string };
export type Interval = { lo: number | null; hi: number | null; left: boolean; right: boolean };
export type AnswerSpec = { kind: 'numbers'; values: number[] } | { kind: 'intervals'; intervals: Interval[] };
export type GraphBranch = { coefficients: [number, number, number]; from: number | null; to: number | null; fromClosed: boolean; toClosed: boolean };
export type GraphModel = { branches: GraphBranch[]; holes: { x: number; y: number }[]; target: number; range: [number, number, number, number] };
export function graphMarkers(graph: GraphModel): { x: number; y: number; closed: boolean }[] {
  const points: { x: number; y: number; closed: boolean }[] = [];
  for (const b of graph.branches) for (const [x, closed] of [[b.from, b.fromClosed], [b.to, b.toClosed]] as const) {
    if (x === null) continue;
    const y = b.coefficients[0] * x * x + b.coefficients[1] * x + b.coefficients[2];
    const same = points.find(p => p.x === x && p.y === y);
    if (same) same.closed ||= closed; else points.push({ x, y, closed });
  }
  for (const hole of graph.holes) {
    const same = points.find(p => p.x === hole.x && p.y === hole.y);
    if (same) same.closed = false; else points.push({ ...hole, closed: false });
  }
  return points;
}
export type ExtendedTask = {
  id: string; number: ExtendedNumber; group: number; index: number; colorIndex: number;
  condition: string; answer: string; answerSpec?: AnswerSpec;
  fractionDisplay?: { top: string; bottom: string; tail: string; inequality?: boolean };
  clues: [string, string]; steps: SolutionStep[]; checklist: string[]; pitfall: string;
  scene?: GridScene; graph?: GraphModel;
  // Input data for independent mathematical validation; never rendered as hints.
  model: { family: string; data: Record<string, number>; polynomials?: number[][]; domains?: number[] };
};
export type TaskBody = Omit<ExtendedTask, 'id' | 'number' | 'group' | 'index' | 'colorIndex'>;
export const fmt = (n: number) => Number(n.toFixed(8)).toString().replace('.', ',').replace('-', '−');
export const fraction = (n: number, d: number) => d === 1 ? fmt(n) : `${fmt(n)}/${fmt(d)}`;
export const sq = (n: number) => `${n < 0 ? `(${fmt(n)})` : fmt(n)}²`;
export const sub = (name: string, n: number) => n === 0 ? name : `${name} ${n < 0 ? '+' : '−'} ${fmt(Math.abs(n))}`;
export const sum = (a: string, n: number) => n === 0 ? a : `${a} ${n < 0 ? '−' : '+'} ${fmt(Math.abs(n))}`;
export const interval = (lo: number | null, hi: number | null, left = false, right = false): Interval => ({ lo, hi, left: lo !== null && left, right: hi !== null && right });
export const intervalText = (parts: Interval[]) => parts.map(p => p.lo === p.hi && p.lo !== null ? `{${fmt(p.lo)}}` : `${p.left ? '[' : '('}${p.lo === null ? '−∞' : fmt(p.lo)}; ${p.hi === null ? '+∞' : fmt(p.hi)}${p.right ? ']' : ')'}`).join(' ∪ ');
export function taskBank(number: ExtendedNumber, factories: ((i: number) => TaskBody)[]): ExtendedTask[] {
  if (factories.length !== 10) throw new Error('A module requires ten groups');
  return factories.flatMap((create, g) => Array.from({ length: 20 }, (_, i) => ({ ...create(i), id: `oge${number}-g${g + 1}-${i + 1}`, number, group: g + 1, index: i, colorIndex: i })));
}
export function numericAnswer(input: string, spec: AnswerSpec): boolean | null {
  if (spec.kind !== 'numbers') return null;
  const parts = input.trim().replaceAll('−', '-').replaceAll(',', '.').split(/[;\s]+/).filter(Boolean);
  const values = parts.map(p => {
    if (/^-?\d+(?:\.\d+)?$/.test(p)) return Number(p);
    const m = /^(-?\d+(?:\.\d+)?)\/(\d+(?:\.\d+)?)$/.exec(p);
    return m && Number(m[2]) !== 0 ? Number(m[1]) / Number(m[2]) : NaN;
  });
  if (!values.length || values.some(v => !Number.isFinite(v))) return false;
  const unique = [...new Set(values)].sort((a, b) => a - b), expected = [...new Set(spec.values)].sort((a, b) => a - b);
  return unique.length === expected.length && unique.every((v, i) => Math.abs(v - expected[i]) < 1e-7);
}
