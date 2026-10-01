export type SetEvent = 'A' | 'B' | 'union' | 'intersection' | 'notUnion' | 'notAorB' | 'Aonly' | 'notIntersection';
export type DiceEvent = { kind: 'sum'; values: number[] } | { kind: 'max' | 'min'; value: number } | { kind: 'bothBelow' | 'anyBelow' | 'bothAbove'; value: number } | { kind: 'parity'; even: boolean };
export type VennModel = { kind: 'venn'; display: 'counts' | 'points' | 'probabilities' | 'weighted-points'; regions: [number[], number[], number[], number[]]; event: SetEvent };
export type TreeModel = { kind: 'tree'; first: number; afterA: number; afterNotA: number; event: 'B' | 'notB' | 'AandB' | 'notAandB' | 'AgivenB' | 'AgivenNotB' };
export type ChanceModel = { kind: 'finite'; weights: number[]; selected: number[] }
  | { kind: 'urn'; counts: [number, number]; first: 0 | 1; target: 0 | 1 }
  | { kind: 'dice'; event: DiceEvent }
  | { kind: 'coins'; n: number; heads: number; atLeast: boolean }
  | { kind: 'frequency'; rows: [number, number][] }
  | VennModel | TreeModel;
export const setEventText: Record<SetEvent, string> = { A: 'A', B: 'B', union: 'A ∪ B (A или B)', intersection: 'A ∩ B (A и B)', notUnion: 'ни A, ни B', notAorB: 'не A или B', Aonly: 'A и не B', notIntersection: 'не (A и B)' };
export function setEventIncludes(event: SetEvent, a: boolean, b: boolean): boolean {
  switch (event) {
    case 'A': return a;
    case 'B': return b;
    case 'union': return a || b;
    case 'intersection': return a && b;
    case 'notUnion': return !a && !b;
    case 'notAorB': return !a || b;
    case 'Aonly': return a && !b;
    case 'notIntersection': return !a || !b;
  }
}
export function diceMatches(event: DiceEvent, a: number, b: number): boolean {
  if (event.kind === 'sum') return event.values.includes(a + b);
  if (event.kind === 'max') return Math.max(a, b) === event.value;
  if (event.kind === 'min') return Math.min(a, b) === event.value;
  if (event.kind === 'bothBelow') return a < event.value && b < event.value;
  if (event.kind === 'anyBelow') return a < event.value || b < event.value;
  if (event.kind === 'bothAbove') return a > event.value && b > event.value;
  return event.kind === 'parity' && (a + b) % 2 === (event.even ? 0 : 1);
}
export function chanceRatio(model: Exclude<ChanceModel, { kind: 'frequency' }>): [number, number] {
  if (model.kind === 'finite') return [model.selected.reduce((s, i) => s + model.weights[i], 0), model.weights.reduce((s, n) => s + n, 0)];
  if (model.kind === 'urn') return [model.counts[model.target] - (model.first === model.target ? 1 : 0), model.counts[0] + model.counts[1] - 1];
  if (model.kind === 'dice') {
    let count = 0;
    for (let a = 1; a <= 6; a++) for (let b = 1; b <= 6; b++) if (diceMatches(model.event, a, b)) count++;
    return [count, 36];
  }
  if (model.kind === 'coins') {
    let count = 0;
    for (let mask = 0; mask < 2 ** model.n; mask++) {
      const heads = mask.toString(2).replaceAll('0', '').length;
      if (model.atLeast ? heads >= model.heads : heads === model.heads) count++;
    }
    return [count, 2 ** model.n];
  }
  if (model.kind === 'venn') {
    const flags = [[true, false], [true, true], [false, true], [false, false]];
    const sums = model.regions.map(r => r.reduce((s, n) => s + n, 0));
    return [sums.reduce((s, n, i) => s + (setEventIncludes(model.event, flags[i][0], flags[i][1]) ? n : 0), 0), sums.reduce((s, n) => s + n, 0)];
  }
  const ab = model.first * model.afterA, notAb = (1 - model.first) * model.afterNotA, probB = ab + notAb;
  switch (model.event) {
    case 'B': return [probB, 1];
    case 'notB': return [1 - probB, 1];
    case 'AandB': return [ab, 1];
    case 'notAandB': return [notAb, 1];
    case 'AgivenB': return [ab, probB];
    case 'AgivenNotB': return [model.first * (1 - model.afterA), 1 - probB];
  }
}
export function ratioAnswer(numerator: number, denominator: number): string {
  const gcd = (a: number, b: number): number => b ? gcd(b, a % b) : a;
  const n = Math.round(numerator * 1e6), d = Math.round(denominator * 1e6), g = gcd(n, d);
  const top = n / g, bottom = d / g;
  let reduced = bottom;
  while (reduced % 2 === 0) reduced /= 2;
  while (reduced % 5 === 0) reduced /= 5;
  return reduced === 1 ? String(Number((top / bottom).toFixed(10))) : `${top}/${bottom}`;
}
