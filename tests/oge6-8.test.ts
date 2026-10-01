import assert from 'node:assert/strict';
import test from 'node:test';
import { getProblemPool, checkAnswer, makeRound, restoreRound, shuffleForPractice } from '../src/engine.ts';
import type { MathExpr } from '../src/numeric-expressions.ts';
import { axisPosition } from '../src/order-models.ts';
import { topicGroupNames } from '../src/module-groups.ts';
// Exact fractions check arithmetic without the generator's answer helpers or floating-point division.
type Q = [bigint, bigint];
function reduce([a, b]: Q): Q {
  if (b < 0n) { a = -a; b = -b; }
  let x = a < 0n ? -a : a, y = b;
  while (y) [x, y] = [y, x % y];
  return [a / x, b / x];
}
function rational(e: MathExpr): Q {
  if (e.kind === 'mixed') return reduce([BigInt(e.whole * e.denominator + e.numerator), BigInt(e.denominator)]);
  if (e.kind === 'number') { const digits = String(e.value).split('.')[1]?.length ?? 0; const d = 10 ** digits; return reduce([BigInt(Math.round(e.value * d)), BigInt(d)]); }
  assert.ok('left' in e);
  const [a, b] = rational(e.left), [c, d] = rational(e.right);
  return reduce(e.kind === 'add' ? [a * d + c * b, b * d] : e.kind === 'subtract' ? [a * d - c * b, b * d] : e.kind === 'multiply' ? [a * c, b * d] : [a * d, b * c]);
}
const number = (s: string) => { const [a, b = 1] = s.split('/').map(Number); return a / b; };
// Convert the expression model to an independently evaluated JavaScript mathematical expression.
function js(e: MathExpr): string {
  if (e.kind === 'mixed') return `(${e.whole} + ${e.numerator}/${e.denominator})`;
  if (e.kind === 'number') return `(${e.value})`;
  if (e.kind === 'variable') return e.name;
  if (e.kind === 'sqrt') return `Math.sqrt(${js(e.arg)})`;
  if (e.kind === 'power') return `(${js(e.base)} ** ${e.exponent})`;
  return `(${js(e.left)} ${ { add: '+', subtract: '-', multiply: '*', divide: '/' }[e.kind]} ${js(e.right)})`;
}
const evalExpr = (expr: MathExpr, vars: Record<string, number> = {}) => Function(...Object.keys(vars), `return ${js(expr)}`)(...Object.values(vars)) as number;
test('all 200 arithmetic answers satisfy exact fraction arithmetic and the requested numerator format', () => {
  for (const p of getProblemPool('oge-6')) {
    const t = p.numericTask!, [n, d] = rational(t.formula);
    const expected = t.target === 'numerator' ? Number(n) : t.target === 'scaledNumerator' ? Number(n * BigInt(t.denominator!) / d) : Number(n) / Number(d);
    if (t.target === 'scaledNumerator') assert.equal(n * BigInt(t.denominator!) % d, 0n);
    assert.ok(Math.abs(number(p.answer) - expected) < 1e-10, p.id);
    assert.ok(checkAnswer(p.answer.replace('-', '−'), p));
    if (t.target) assert.ok(checkAnswer(String(expected), p));
    else { assert.ok(checkAnswer(`${n * 2n}/${d * 2n}`, p)); assert.ok(checkAnswer(String(expected).replace('.', ',').replace('-', '−'), p)); }
  }
  assert.ok(getProblemPool('oge-6').some(p => p.answer.startsWith('-')));
});
test('all 200 radical and power answers follow the displayed expression, including negative inputs and unique options', () => {
  for (const p of getProblemPool('oge-8')) {
    const t = p.numericTask!, expected = evalExpr(t.formula, t.variables);
    assert.ok(Number.isFinite(expected) && expected >= 0, p.id);
    if (t.choices) {
      const matches = t.choices.map((e, i) => Math.abs(evalExpr(e) - expected) < 1e-9 ? i + 1 : 0).filter(Boolean);
      assert.deepEqual(matches, [Number(p.answer)], p.id);
      assert.equal(checkAnswer('1/1', p), false);
    } else assert.ok(Math.abs(expected - number(p.answer)) < 1e-8 * Math.max(1, expected), p.id);
  }
  const negativeCases = getProblemPool('oge-8').filter(p => (p.numericTask?.variables?.a ?? 0) < 0);
  assert.ok(negativeCases.length >= 10);
});
test('all 200 comparisons have exactly one answer, with calibrated number-line points and sign statements', () => {
  for (const p of getProblemPool('oge-7')) {
    const t = p.orderTask!;
    const options = p.expression.split('\n').slice(1, 5).map(s => s.slice(3));
    let hits: number[];
    if (t.rule === 'true' || t.rule === 'false') {
      const vars = Object.fromEntries(p.axisScene!.points.map(a => [a.label, a.value]));
      hits = options.map(s => Function('a', 'b', `return ${s.replaceAll('−', '-').replaceAll('²', '**2').replace('ab', 'a*b')}`)(vars.a, vars.b)).map((b, i) => Boolean(b) === (t.rule === 'true') ? i + 1 : 0).filter(Boolean);
    } else hits = t.values.map((x, i) => {
      const hit = t.rule === 'equals' ? Math.abs(x - t.target!) < 1e-9 : t.rule === 'between' ? t.target !== undefined ? x < t.target && t.target < x + 1 : t.closed ? x >= t.lo! && x <= t.hi! : x > t.lo! && x < t.hi! : t.rule === 'positive' ? x > 0 : t.rule === 'negative' ? x < 0 : t.values.every(y => x >= y);
      return hit ? i + 1 : 0;
    }).filter(Boolean);
    assert.deepEqual(hits, [Number(p.answer)], p.id);
    const scene = p.axisScene;
    if (scene) {
      assert.ok(scene.lo < scene.hi);
      for (const a of [...scene.points, ...scene.ticks]) assert.ok(axisPosition(scene, a.value) > 0 && axisPosition(scene, a.value) < 1, p.id);
      assert.equal(new Set(scene.points.map(a => a.value)).size, scene.points.length);
      if (scene.points.length === 4) {
        const target = scene.points.find(a => Math.abs(a.value - t.target!) < 1e-9)!;
        assert.ok(target, p.id);
        if (/Какая точка/.test(p.expression)) assert.equal(options[Number(p.answer) - 1], target.label, p.id);
      }
    }
  }
  for (const group of [5, 6]) assert.equal(new Set(getProblemPool('oge-7').slice((group - 1) * 20, group * 20).map(p => p.answer)).size, 4);
});
test('new banks keep ten distinct groups, identical math and drawings, and stable colors across shuffled rounds', () => {
  for (const id of ['oge-6', 'oge-7', 'oge-8'] as const) {
    assert.equal(new Set(topicGroupNames[id]).size, 10);
    const round = makeRound(id, 7, () => .31), practice = shuffleForPractice(restoreRound(round.map(p => p.id).join(','), id, 7), () => .43);
    for (const p of practice) assert.strictEqual(p, round.find(a => a.id === p.id));
    assert.notDeepEqual(round.map(p => p.id), practice.map(p => p.id));
  }
});
