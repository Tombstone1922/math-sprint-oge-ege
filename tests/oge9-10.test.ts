import assert from 'node:assert/strict';
import test from 'node:test';
import { checkAnswer, getProblemPool, makeRound, restoreRound, shuffleForPractice } from '../src/engine.ts';
import { topicGroupNames } from '../src/module-groups.ts';
import { vennAtoms, vennEllipses, treeEdges } from '../src/chance-layout.ts';
const numeric = (s: string) => s.includes('/') ? Number(s.split('/')[0]) / Number(s.split('/')[1]) : Number(s);
const near = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-9, `${a} != ${b}`);

test('all 200 equations have the complete independently found root set and required answer', () => {
  const evaluate = (coefficients: number[], x: number) => coefficients.reduce((sum, c, power) => sum + c * x ** power, 0);
  for (const p of getProblemPool('oge-9')) {
    const m = p.rootTask!, coefficients = Array.from({ length: Math.max(m.left.length, m.right.length) }, (_, i) => (m.left[i] ?? 0) - (m.right[i] ?? 0));
    while (coefficients[coefficients.length - 1] === 0) coefficients.pop();
    const roots: number[] = [];
    // Every generated root lies on this rational lattice; root count must equal degree.
    for (let i = -2000; i <= 2000; i++) if (Math.abs(evaluate(coefficients, i / 20)) < 1e-7) roots.push(i / 20);
    assert.equal(roots.length, coefficients.length - 1, p.expression);
    assert.ok(roots.length > 0 && roots.length <= 3);
    const expected = m.required === 'all' ? roots.map(String).join('') : String(m.required === 'smallest' ? roots[0] : roots[roots.length - 1]);
    assert.equal(p.answer, expected, p.expression);
    assert.ok(checkAnswer(expected.replaceAll('-', '−'), p));
    if (m.required === 'all') {
      assert.equal(p.answerMode, 'roots');
      assert.equal(p.answerDisplay, roots.map(x => String(x).replace('-', '−').replace('.', ',')).join('; '));
      assert.equal(checkAnswer(roots.map(String).join(' '), p), false);
      assert.equal(checkAnswer([...roots].reverse().map(String).join(''), p), false);
    }
  }
  const twoNegative = getProblemPool('oge-9').find(p => p.answerMode === 'roots' && p.answer.includes('-', 1));
  assert.ok(twoNegative, 'multiple minus signs are needed for the supplied types');
  assert.ok(checkAnswer(twoNegative.answer.replaceAll('-', '−'), twoNegative));
});

test('all 200 chance answers agree with independent counting, binomial or joint-event calculations', () => {
  const combinations = (n: number, k: number) => {
    let c = 1;
    for (let i = 1; i <= k; i++) c = c * (n - i + 1) / i;
    return c;
  };
  for (const p of getProblemPool('oge-10')) {
    const m = p.chance!;
    let expected = 0;
    if (m.kind === 'finite') {
      const outcomes = m.weights.flatMap((weight, category) => Array.from({ length: weight }, () => category));
      expected = outcomes.filter(c => m.selected.includes(c)).length / outcomes.length;
    } else if (m.kind === 'urn') {
      const objects = m.counts.flatMap((count, color) => Array.from({ length: count }, (_, i) => ({ color, id: `${color}-${i}` })));
      let condition = 0, good = 0;
      for (const a of objects) for (const b of objects) if (a.id !== b.id && a.color === m.first) { condition++; if (b.color === m.target) good++; }
      expected = good / condition;
    } else if (m.kind === 'dice') {
      const known = [3 / 36, 9 / 36, 9 / 36, 9 / 36, 9 / 36, 27 / 36, 0.5, 0.5, 5 / 36, 4 / 36];
      expected = known[Number(p.id.split('-').pop()) - 1];
    } else if (m.kind === 'coins') {
      expected = (m.atLeast ? Array.from({ length: m.n - m.heads + 1 }, (_, i) => combinations(m.n, m.heads + i)).reduce((s, v) => s + v, 0) : combinations(m.n, m.heads)) / 2 ** m.n;
    } else if (m.kind === 'frequency') {
      const winner = m.rows.map((row, i) => i).filter(i => m.rows.every((r, j) => j === i || m.rows[i][1] * r[0] > r[1] * m.rows[i][0]));
      assert.equal(winner.length, 1);
      expected = winner[0] + 1;
    } else if (m.kind === 'venn') {
      const selected = { A: [0, 1], B: [1, 2], union: [0, 1, 2], intersection: [1], notUnion: [3], notAorB: [1, 2, 3], Aonly: [0], notIntersection: [0, 2, 3] }[m.event];
      const sums = m.regions.map(r => r.reduce((s, n) => s + n, 0));
      assert.ok(m.regions.flat().every(n => n > 0));
      if (m.display === 'probabilities' || m.display === 'weighted-points') near(sums.reduce((s, n) => s + n, 0), 1);
      expected = selected.reduce((s, i) => s + sums[i], 0) / sums.reduce((s, n) => s + n, 0);
    } else {
      const outcomes = [
        { a: true, b: true, weight: m.first * m.afterA }, { a: true, b: false, weight: m.first * (1 - m.afterA) },
        { a: false, b: true, weight: (1 - m.first) * m.afterNotA }, { a: false, b: false, weight: (1 - m.first) * (1 - m.afterNotA) },
      ];
      near(outcomes.reduce((s, o) => s + o.weight, 0), 1);
      const condition = outcomes.filter(o => m.event === 'AgivenB' ? o.b : m.event === 'AgivenNotB' ? !o.b : true);
      const good = condition.filter(o => m.event === 'B' ? o.b : m.event === 'notB' ? !o.b : m.event === 'notAandB' ? !o.a && o.b : m.event === 'AandB' ? o.a && o.b : o.a);
      expected = good.reduce((s, o) => s + o.weight, 0) / condition.reduce((s, o) => s + o.weight, 0);
    }
    near(numeric(p.answer), expected);
    if (m.kind !== 'frequency') assert.ok(expected > 0 && expected <= 1, p.id);
    assert.ok(checkAnswer(p.answer.replace('.', ','), p));
  }
});

test('diagram points belong to their depicted regions and tree branches form complete distributions', () => {
  for (const p of getProblemPool('oge-10')) {
    const m = p.chance!;
    if (m.kind === 'venn' && (m.display === 'points' || m.display === 'weighted-points')) {
      const atoms = vennAtoms(m);
      assert.equal(atoms.length, m.regions.flat().length);
      assert.equal(new Set(atoms.map(a => a.point.join(','))).size, atoms.length);
      for (const atom of atoms) {
        const flags = vennEllipses.map(e => ((atom.point[0] - e.center[0]) / e.radii[0]) ** 2 + ((atom.point[1] - e.center[1]) / e.radii[1]) ** 2 < 1);
        assert.equal(atom.region, flags[0] ? flags[1] ? 1 : 0 : flags[1] ? 2 : 3);
        assert.ok(atom.point.every(v => v > 0 && v < 1));
      }
    }
    if (m.kind === 'tree') {
      const edges = treeEdges(m);
      for (let i = 0; i < 6; i += 2) { near(edges[i].probability + edges[i + 1].probability, 1); assert.ok(edges[i].probability > 0 && edges[i].probability < 1); }
    }
  }
});

test('new modules keep named groups, stable diagrams and colors when the same ten cards are shuffled', () => {
  for (const id of ['oge-9', 'oge-10'] as const) {
    assert.equal(topicGroupNames[id]!.length, 10);
    assert.equal(new Set(topicGroupNames[id]).size, 10);
    for (let group = 1; group <= 10; group++) {
      const round = makeRound(id, group), restored = restoreRound(round.map(p => p.id).join(','), id, group);
      assert.deepEqual(restored, round);
      const practice = shuffleForPractice(restored);
      assert.deepEqual(new Set(practice.map(p => p.id)), new Set(round.map(p => p.id)));
      for (const p of practice) assert.strictEqual(p, round.find(q => q.id === p.id));
    }
  }
});
