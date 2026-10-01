import { displayNumber } from './function-graphs.ts';
export type Interval = { lo: number | null; hi: number | null; loClosed: boolean; hiClosed: boolean };
export type SolutionSet = Interval[];
export type Inequality = { a: number; b: number; c: number; op: '<' | '≤' | '>' | '≥' };
export type NumberLineQuestion = { choices: SolutionSet[]; constraints: Inequality[] };
export const interval = (lo: number | null, hi: number | null, loClosed = false, hiClosed = false): Interval => ({ lo, hi, loClosed: lo !== null && loClosed, hiClosed: hi !== null && hiClosed });
export function solutionText(set: SolutionSet): string {
  return set.length ? set.map(i => `${i.loClosed ? '[' : '('}${i.lo === null ? '−∞' : displayNumber(i.lo)}; ${i.hi === null ? '+∞' : displayNumber(i.hi)}${i.hiClosed ? ']' : ')'}`).join(' ∪ ') : 'Нет решений';
}
export function solutionContains(set: SolutionSet, x: number): boolean {
  return set.some(i => (i.lo === null || (i.loClosed ? x >= i.lo : x > i.lo)) && (i.hi === null || (i.hiClosed ? x <= i.hi : x < i.hi)));
}
