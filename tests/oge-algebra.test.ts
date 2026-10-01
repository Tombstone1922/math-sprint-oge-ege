import assert from 'node:assert/strict';
import test from 'node:test';
import { checkAnswer, getProblemPool, makeRound, restoreRound } from '../src/engine.ts';
import { curveSegments, functionValue } from '../src/function-graphs.ts';
import { solutionContains, solutionText } from '../src/number-lines.ts';
import { topicGroupNames } from '../src/module-groups.ts';
const near = (a: number, b: number, message: string) => assert.ok(Math.abs(a - b) < 1e-7, `${message}: ${a} != ${b}`);

test('all 200 graphical correspondences identify exactly one option per letter', () => {
  for (const p of getProblemPool('oge-11')) {
    const q = p.graphs!;
    assert.equal(p.answerMode, 'sequence');
    assert.equal(q.panels.length, 3);
    assert.equal(q.options.length, 3);
    assert.match(p.answer, /^[123]{3}$/);
    assert.equal(new Set(p.answer).size, 3);
    const matches = q.panels.map(panel => {
      const choices = q.options.flatMap((o, i) => {
        if (o.signs) return o.signs[0] === Math.sign(panel.fn.a) && o.signs[1] === Math.sign(panel.fn.c) ? [i] : [];
        const fn = o.fn!;
        const same = [-5, -2, -1, 0, 0.5, 1, 2, 5].every(x => {
          const a = functionValue(fn, x), b = functionValue(panel.fn, x);
          return !Number.isFinite(a) && !Number.isFinite(b) || Math.abs(a - b) < 1e-10;
        });
        return same ? [i] : [];
      });
      assert.equal(choices.length, 1, p.id);
      return choices[0];
    });
    const expected = q.direction === 'graphs-to-options' ? matches : matches.map((_, i) => matches.indexOf(i));
    assert.equal(p.answer, expected.map(i => i + 1).join(''), p.id);
    for (const panel of q.panels) {
      const segments = curveSegments(panel.fn);
      assert.ok(segments.length > 15, p.id);
      for (const [a, b] of segments) {
        assert.ok([...a, ...b].every(n => Number.isFinite(n) && n >= -6 - 1e-8 && n <= 6 + 1e-8), p.id);
        if (panel.fn.kind === 'reciprocal') assert.ok(a[0] * b[0] > 0, p.id);
      }
    }
  }
});

test('all 200 formula answers satisfy the original physical or algebraic relation by substitution', () => {
  for (const p of getProblemPool('oge-12')) {
    const model = p.formulaTask!, v = { ...model.known, [model.unknown]: Number(p.answer) };
    let left: number, right: number;
    switch (model.relation) {
      case 'power': left = v.P; right = v.I * v.I * v.R; break;
      case 'heat': left = v.Q; right = v.I * v.I * v.R * v.t; break;
      case 'kinetic': left = v.E; right = v.m * v.v * v.v / 2; break;
      case 'potential': left = v.E; right = v.m * v.g * v.h; break;
      case 'buoyancy': left = v.F; right = v.rho * v.g * v.V; break;
      case 'centripetal': left = v.a; right = v.omega * v.omega * v.R; break;
      case 'temperature': left = v.F; right = 1.8 * v.C + 32; break;
      case 'cost': left = v.C; right = v.A + v.B * v.n; break;
      case 'diagonal-area': left = v.S; right = v.d1 * v.d2 * v.sine / 2; break;
    }
    near(left, right, p.id);
    if (model.relation !== 'temperature') assert.ok(Number(p.answer) > 0, p.id);
  }
});

test('all 200 inequality choices match the full set of solutions, including exact boundary points', () => {
  for (const p of getProblemPool('oge-13')) {
    const q = p.numberLines!;
    assert.equal(q.choices.length, 4);
    assert.equal(new Set(q.choices.map(solutionText)).size, 4, p.id);
    const boundaries = q.choices.flatMap(set => set.flatMap(i => [i.lo, i.hi].filter((n): n is number => n !== null)));
    const probes = [...Array.from({ length: 241 }, (_, i) => (i - 120) / 4), ...boundaries.flatMap(x => [x - 0.0001, x, x + 0.0001])];
    const correct = q.choices.flatMap((set, i) => probes.every(x => {
      const satisfies = q.constraints.every(c => {
        const value = c.a * x * x + c.b * x + c.c;
        return c.op === '<' ? value < 0 : c.op === '≤' ? value <= 0 : c.op === '>' ? value > 0 : value >= 0;
      });
      return solutionContains(set, x) === satisfies;
    }) ? [i + 1] : []);
    assert.deepEqual(correct, [Number(p.answer)], p.expression);
    assert.equal(checkAnswer(p.answer + '.0', p), false, p.id);
  }
});

test('all 200 sequence answers agree with stepwise simulation, without closed-form formulas', () => {
  for (const p of getProblemPool('oge-14')) {
    const m = p.sequenceTask!;
    let term = m.first, sum = 0;
    for (let i = 0; i < m.count; i++) {
      sum += term;
      if (i + 1 < m.count) term = m.kind === 'geometric' ? term * m.change : term + m.change;
    }
    let expected = m.target === 'sum' ? sum : m.target === 'first' ? m.first : m.target === 'count' ? m.count : m.target === 'converted' ? m.first - term : term;
    if (m.target === 'threshold') {
      term = m.first; expected = 1;
      while (term >= m.threshold! - 1e-8) { term *= m.change; expected++; assert.ok(expected < 20); }
      const previous = term / m.change;
      assert.ok(previous >= m.threshold! - 1e-8 && term < m.threshold! - 1e-8, p.id);
    }
    near(Number(p.answer), expected, p.expression);
    if (p.id.startsWith('oge-14-g6-')) assert.ok(term > 0, 'braking distances must remain positive');
  }
});

test('new topics retain ten named groups, round identities, signed input and strict correspondence answers', () => {
  for (const id of ['oge-11', 'oge-12', 'oge-13', 'oge-14', 'oge-15'] as const) {
    assert.equal(topicGroupNames[id]!.length, 10);
    assert.equal(new Set(topicGroupNames[id]).size, 10);
    for (let group = 1; group <= 10; group++) {
      const round = makeRound(id, group, () => 0.71);
      assert.ok(round.every(p => p.id.startsWith(`${id}-g${group}-`)));
      const restored = restoreRound(round.map(p => p.id).join(','), id, group);
      assert.deepEqual(restored.map(p => [p.id, p.figure, p.graphs, p.numberLines, p.colorIndex]), round.map(p => [p.id, p.figure, p.graphs, p.numberLines, p.colorIndex]));
    }
  }
  const negative = getProblemPool('oge-14').find(p => Number(p.answer) < 0)!;
  assert.ok(negative);
  assert.ok(checkAnswer(negative.answer.replace('-', '−'), negative));
  assert.equal(checkAnswer('−', negative), false);
  assert.equal(checkAnswer('--1', negative), false);
  const match = getProblemPool('oge-11')[0];
  for (const input of ['0' + match.answer, match.answer + ',0', match.answer.split('').join(' '), '1/2']) assert.equal(checkAnswer(input, match), false);
});
