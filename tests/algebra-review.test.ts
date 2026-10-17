import assert from 'node:assert/strict';
import test from 'node:test';
import { checkAnswer, getProblemPool } from '../src/engine.ts';
import type { ModuleId } from '../src/content.ts';
import { functionFormula, functionValue } from '../src/function-graphs.ts';
import { solutionContains } from '../src/number-lines.ts';

// Evaluate the printed mathematics independently of the generator's numeric models.
// Input is limited to mathematical notation from the repository, never user input.
function printedValue(text: string, x: number): number {
  assert.match(text, /^[\dx\s.,+−*/()²√·-]+$/, text);
  const expression = text.replaceAll('−', '-').replaceAll(',', '.').replaceAll('·', '*')
    .replaceAll('²', '**2').replaceAll('√', 'sqrt')
    .replace(/(\d|x|\))(?=x|\(|sqrt)/g, '$1*').replaceAll('sqrt', 'Math.sqrt');
  return Function('x', `return ${expression};`)(x) as number;
}
const near = (a: number, b: number, label: string) => assert.ok(Math.abs(a - b) < 1e-7 * Math.max(1, Math.abs(a), Math.abs(b)), `${label}: ${a} != ${b}`);

test('all 200 printed equations match their polynomial models and select one root', () => {
  const probes = Array.from({ length: 41 }, (_, i) => (i - 20) / 4);
  for (const p of getProblemPool('oge-9')) {
    const equation = p.expression.split('\n')[0].replace('Решите уравнение: ', '').replace(/\.$/, '');
    const [left, right] = equation.split(' = '), model = p.rootTask!;
    for (const x of [...probes, Number(p.answer)]) {
      const polynomial = (coefficients: number[]) => coefficients.reduce((sum, c, i) => sum + c * x ** i, 0);
      near(printedValue(left, x), polynomial(model.left), p.id);
      near(printedValue(right, x), polynomial(model.right), p.id);
    }
    near(printedValue(left, Number(p.answer)), printedValue(right, Number(p.answer)), p.id);
    assert.match(p.expression, /Запишите (корень уравнения|наименьший корень|наибольший корень)\./);
    assert.doesNotMatch(p.expression, /все корни|разделител|\+\s*−/);
  }
});

test('all 200 printed inequalities agree with exactly one depicted solution set', () => {
  for (const p of getProblemPool('oge-13')) {
    const q = p.numberLines!;
    const lines = p.expression.split('\n').slice(1, -1).filter(line => line !== 'Система:');
    const relations = lines.map(line => {
      const match = /^(.*?)\s*(≤|≥|<|>)\s*(.*?)$/.exec(line.replace(/;$/, ''));
      assert.ok(match, line);
      return { left: match[1], op: match[2], right: match[3] };
    });
    const endpoints = q.choices.flatMap(set => set.flatMap(i => [i.lo, i.hi].filter((v): v is number => v !== null)));
    const probes = [...Array.from({ length: 121 }, (_, i) => (i - 60) / 2), ...endpoints.flatMap(n => [n - 0.001, n, n + 0.001])];
    const satisfies = (x: number) => relations.every(r => {
      const a = printedValue(r.left, x), b = printedValue(r.right, x);
      return r.op === '<' ? a < b : r.op === '>' ? a > b : r.op === '≤' ? a <= b : a >= b;
    });
    const matches = q.choices.flatMap((set, i) => probes.every(x => solutionContains(set, x) === satisfies(x)) ? [i + 1] : []);
    assert.deepEqual(matches, [Number(p.answer)], p.id);
  }
});

test('every displayed function formula describes the plotted function, including fractional slopes', () => {
  for (const p of getProblemPool('oge-11')) for (const option of p.graphs!.options) {
    if (!option.fn) continue;
    const formula = option.text.replace(/^y = /, '');
    for (const x of [-5, -2, -1, 0.5, 1, 2, 5]) {
      const actual = printedValue(formula, x), expected = functionValue(option.fn, x);
      if (Number.isNaN(expected)) assert.ok(Number.isNaN(actual));
      else near(actual, expected, p.id);
    }
    if (option.fn.kind === 'linear' && option.fn.coefficient) {
      assert.match(option.text, /\(1\/\d+\) · x$/);
      assert.ok(p.hint.includes(`наклон ${option.fn.coefficient},`), p.id);
    }
  }
  assert.equal(functionFormula({ kind: 'linear', a: 1 / 3, b: 0, c: 0, coefficient: '1/3' }), 'y = (1/3) · x');
});

test('displayed algebra answers use decimal commas and remain accepted by the real answer checker', () => {
  for (let n = 6; n <= 14; n++) for (const p of getProblemPool(`oge-${n}` as ModuleId)) {
    const shown = p.answerDisplay ?? p.answer;
    assert.doesNotMatch(shown, /\./, p.id);
    assert.ok(checkAnswer(shown, p), `${p.id}: ${shown}`);
  }
});

test('comparison wording does not imply the given coordinates are already matched to the letters', () => {
  for (const p of getProblemPool('oge-7').slice(0, 40)) assert.match(p.expression, /координаты перечислены в произвольном порядке/);
  for (const p of getProblemPool('oge-8').slice(40, 60).filter((_, j) => j % 2 === 0)) assert.doesNotMatch(p.hint, /b²/);
});
