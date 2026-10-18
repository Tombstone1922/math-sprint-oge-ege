import test from 'node:test';
import assert from 'node:assert/strict';
import { allExtendedTasks, extendedModules } from '../src/extended/bank.ts';
import { graphMarkers, numericAnswer, type ExtendedTask, type GraphModel, type Interval } from '../src/extended/model.ts';
import { geometryLayout, labelsOverlap } from '../src/geometry-layout.ts';
import type { GridPoint } from '../src/grid-geometry.ts';

const close = (a: number, b: number, message = '') => assert.ok(Math.abs(a - b) < 1e-6 * Math.max(1, Math.abs(b)), `${message}: ${a} ≠ ${b}`);
const distance = (a: GridPoint, b: GridPoint) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const dot = (a: GridPoint, b: GridPoint, c: GridPoint) => (a[0] - b[0]) * (c[0] - b[0]) + (a[1] - b[1]) * (c[1] - b[1]);
const area = (...points: GridPoint[]) => Math.abs(points.reduce((s, p, i) => { const q = points[(i + 1) % points.length]; return s + p[0] * q[1] - p[1] * q[0]; }, 0)) / 2;
const onLine = (a: GridPoint, b: GridPoint, p: GridPoint) => close(area(a, b, p), 0);
const contains = (parts: Interval[], x: number) => parts.some(p => (p.lo === null || x > p.lo || p.left && x === p.lo) && (p.hi === null || x < p.hi || p.right && x === p.hi));
test('Six second-part banks: 200 authored conditions, ten groups, solutions and diagrams', () => {
  assert.equal(allExtendedTasks.length, 1200);
  assert.equal(new Set(allExtendedTasks.map(t => t.id)).size, 1200);
  for (const m of extendedModules) {
    assert.equal(m.tasks.length, 200); assert.equal(m.groups.length, 10);
    assert.equal(new Set(m.tasks.map(t => t.condition)).size, 200, `duplicate conditions: ${m.number}`);
    for (let g = 1; g <= 10; g++) {
      const group = m.tasks.filter(t => t.group === g);
      assert.equal(group.length, 20); assert.equal(new Set(group.map(t => t.colorIndex)).size, 20);
    }
    for (const t of m.tasks) {
      assert.ok(t.answer && t.clues.length === 2 && t.steps.length >= 3 && t.checklist.length >= 3, t.id);
      assert.ok(!/NaN|undefined|Infinity/.test(JSON.stringify(t)), t.id);
      if (m.number >= 23) assert.ok(t.scene, t.id);
      if (m.number === 22) assert.ok(t.graph, t.id);
    }
  }
});
test('№20: roots satisfy original equations, include all integer roots, respect domains', () => {
  for (const t of extendedModules[0].tasks) {
    const d = t.model.data, family = t.model.family;
    if (t.model.polynomials) {
      const p = t.model.polynomials[0];
      const evaluate = (x: number) => p.reduce((v, c) => v * x + c, 0);
      const expected: number[] = [];
      for (let x = -100; x <= 100; x++) if (evaluate(x) === 0 && !t.model.domains?.includes(x)) expected.push(x);
      const actual = t.answerSpec?.kind === 'numbers' ? [...t.answerSpec.values].sort((a, b) => a - b) : [];
      assert.deepEqual(actual, expected, t.id);
      for (const x of actual) {
        if (family === 'linear') close(d.a * (x - d.b) - d.c * (x + d.d), d.rhs, t.id);
        if (family === 'rational') close((x - d.a) * (x - d.b) / (x - d.a), d.c, t.id);
        if (family === 'factor') close((x - d.a) * (x - d.b), d.c * (x - d.a), t.id);
      }
    } else if (family === 'linear-system') {
      close(d.a * d.x + d.b * d.y, d.u); close(d.c * d.x + d.d * d.y, d.v);
    } else if (family === 'sum-product') { close(d.a + d.b, d.s); close(d.a * d.b, d.p); }
    else if (t.answerSpec?.kind === 'intervals') {
      for (let x = -25; x <= 30; x += .25) {
        let expected = false;
        if (family === 'quadratic-inequality') { const y = (x - d.a) * (x - d.b); expected = d.outside ? d.closed ? y >= 0 : y > 0 : d.closed ? y <= 0 : y < 0; }
        if (family === 'rational-inequality' && x !== d.c) { const y = (x - d.a) * (x - d.b) / (x - d.c); expected = d.positive ? d.closed ? y >= 0 : y > 0 : d.closed ? y <= 0 : y < 0; }
        if (family === 'linear-inequalities') expected = (d.left ? -d.a * x <= -d.a * d.lo : -d.a * x < -d.a * d.lo) && (d.right ? d.b * x <= d.b * d.hi : d.b * x < d.b * d.hi);
        assert.equal(contains(t.answerSpec.intervals, x), expected, `${t.id} at ${x}`);
      }
    }
  }
});
test('№21: answers satisfy time, work, mass, price and distance balances', () => {
  for (const t of extendedModules[1].tasks) {
    const d = t.model.data, spec = t.answerSpec;
    assert.equal(spec?.kind, 'numbers'); if (spec?.kind !== 'numbers') continue;
    const x = spec.values[0]; assert.ok(x > 0, t.id);
    switch (t.model.family) {
      case 'cyclists': close(d.distance / x - d.distance / (x + d.delta), d.lag); break;
      case 'boat': assert.ok(x > d.current); close(d.distance / (x + d.current) + d.distance / (x - d.current), d.total); break;
      case 'meeting': close(x * d.t + (x + d.delta) * (d.t - d.delay), d.distance); break;
      case 'work': close(1 / x + 1 / (x + d.second - d.first), 1 / d.together); break;
      case 'production': close(x * (d.days - 2), d.total); close((x - d.increase) * d.days, d.total); break;
      case 'mixture': close(d.low * d.initial + d.high * x, d.target * (d.initial + x)); break;
      case 'evaporation': close(d.concentration * d.initial, d.target * (d.initial - x)); assert.ok(x < d.initial); break;
      case 'price': close(x * (1 + d.percent / 100) * (1 - d.percent / 100), d.final); break;
      case 'purchase': close(d.cost / x - d.cost / (x + 2), d.difference); break;
      case 'average': close(2 * d.distance / (d.distance / x + d.distance / (x + d.fast - d.slow)), d.average); break;
      default: assert.fail(t.model.family);
    }
  }
});
function intersections(graph: GraphModel, m: number): number {
  const roots: number[] = [];
  for (const branch of graph.branches) {
    const [a, b, c0] = branch.coefficients, c = c0 - m;
    let candidates: number[] = [];
    if (a === 0 && b === 0) { if (Math.abs(c) < 1e-9) return Infinity; }
    else if (a === 0) candidates = [-c / b];
    else { const d = b * b - 4 * a * c; if (d >= -1e-8) candidates = [(-b - Math.sqrt(Math.max(0, d))) / (2 * a), (-b + Math.sqrt(Math.max(0, d))) / (2 * a)]; }
    for (const x of candidates) {
      const left = branch.from === null || x > branch.from + 1e-8 || branch.fromClosed && Math.abs(x - branch.from) < 1e-8;
      const right = branch.to === null || x < branch.to - 1e-8 || branch.toClosed && Math.abs(x - branch.to) < 1e-8;
      if (left && right && !graph.holes.some(h => Math.abs(h.x - x) < 1e-8 && Math.abs(h.y - m) < 1e-8) && !roots.some(r => Math.abs(r - x) < 1e-7)) roots.push(x);
    }
  }
  return roots.length;
}
test('№22: solve every branch independently and count intersections at boundaries and between', () => {
  for (const t of extendedModules[2].tasks) {
    assert.equal(t.answerSpec?.kind, 'intervals'); if (t.answerSpec?.kind !== 'intervals' || !t.graph) continue;
    const critical = new Set<number>([-100, 100]);
    for (const b of t.graph.branches) {
      const [a, c, d] = b.coefficients;
      if (a !== 0) critical.add(d - c * c / (4 * a));
      if (a === 0 && c === 0) critical.add(d);
      for (const x of [b.from, b.to]) if (x !== null) critical.add(a * x * x + c * x + d);
    }
    t.graph.holes.forEach(h => critical.add(h.y));
    const sorted = [...critical].sort((a, b) => a - b), samples = [...sorted, ...sorted.slice(1).map((x, i) => (x + sorted[i]) / 2), ...sorted.flatMap(x => [x - .001, x + .001])];
    for (const m of samples) assert.equal(contains(t.answerSpec.intervals, m), intersections(t.graph, m) === t.graph.target, `${t.id} m=${m}`);
  }
});
function numeric(t: ExtendedTask) { assert.equal(t.answerSpec?.kind, 'numbers', t.id); return t.answerSpec?.kind === 'numbers' ? t.answerSpec.values[0] : NaN; }
test('№23: diagram lengths, areas, circles and final answers agree with givens', () => {
  for (const t of extendedModules[3].tasks) {
    const p = t.scene!.points, d = t.model.data, x = numeric(t), k = d.k;
    switch (t.model.family) {
      case 'g23-bisectors': close(distance(p.A, p.F), d.p); close(distance(p.B, p.F), d.q); close(dot(p.A, p.F, p.B), 0); close(x, distance(p.A, p.B)); break;
      case 'g23-inradius': close(distance(p.A, p.B), d.side); close(distance(p.A, p.C), d.side); close(distance(p.B, p.C), d.base); close(x, area(p.A, p.B, p.C) / ((2 * d.side + d.base) / 2)); break;
      case 'g23-altitude': close(distance(p.A, p.B), d.hyp); close(distance(p.A, p.C), d.leg); close(dot(p.A, p.C, p.B), 0); close(x, distance(p.C, p.D)); break;
      case 'g23-trapezoid': close(distance(p.A, p.B), d.leg); close(distance(p.A, p.D), d.large); close(distance(p.B, p.C), d.small); close(x, area(p.A, p.B, p.C, p.D)); break;
      case 'g23-tangent': close(distance(p.O, p.P), d.distance); close(distance(p.O, p.A), d.radius); close(dot(p.O, p.A, p.P), 0); close(x, distance(p.O, p.A) + distance(p.A, p.P) + distance(p.P, p.O)); break;
      case 'g23-chord': close(distance(p.A, p.B), 2 * d.half); close(distance(p.O, p.M), d.distance); close(x, 2 * distance(p.O, p.A)); break;
      case 'g23-similar-area': close(distance(p.A, p.D), d.ad); close(distance(p.D, p.B), d.db); close(area(p.A, p.D, p.E), d.smallArea); close(x, area(p.A, p.B, p.C)); break;
      case 'g23-rhombus': for (const [a, b] of [['A', 'B'], ['B', 'C'], ['C', 'D'], ['D', 'A']]) close(distance(p[a], p[b]), d.side); close(distance(p.A, p.C), d.diagonal); close(x, area(p.A, p.B, p.C, p.D)); break;
      case 'g23-circumradius': close(distance(p.A, p.B), d.ab); close(distance(p.A, p.C), d.ac); close(distance(p.B, p.C), d.bc); for (const n of ['A', 'B', 'C']) close(distance(p.O, p[n]), x); break;
      case 'g23-parallelogram': close(distance(p.A, p.B), d.a); close(distance(p.E, p.C), d.ec); close(distance(p.A, p.B), distance(p.B, p.E)); close(x, 2 * (distance(p.A, p.B) + distance(p.B, p.C))); break;
      default: assert.fail(t.model.family);
    }
    assert.ok(k > 0);
  }
});
test('№24: each proof configuration satisfies its hypotheses and claimed relations', () => {
  for (const t of extendedModules[4].tasks) {
    const p = t.scene!.points, d = t.model.data;
    switch (t.model.family) {
      case 'proof-secants': onLine(p.M, p.B, p.A); onLine(p.M, p.C, p.D); close(distance(p.M, p.B), 2 * d.k); close(distance(p.M, p.A), 8 * d.k); close(distance(p.M, p.C) * distance(p.M, p.D), 16 * d.k ** 2); break;
      case 'proof-similar-area': close(distance(p.A, p.D) / distance(p.D, p.B), d.p / d.q); close(area(p.A, p.D, p.E) / area(p.A, p.B, p.C), d.p ** 2 / (d.p + d.q) ** 2); break;
      case 'proof-angle-bisector': close(distance(p.A, p.B) / distance(p.A, p.C), d.p / d.q); close(distance(p.B, p.D) / distance(p.D, p.C), d.p / d.q); break;
      case 'proof-parallelogram': onLine(p.A, p.C, p.K); onLine(p.B, p.P, p.K); close(distance(p.A, p.P) / distance(p.P, p.D), d.p / d.q); close(distance(p.A, p.K) / distance(p.K, p.C), d.p / (d.p + d.q)); break;
      case 'proof-altitude': close(dot(p.A, p.C, p.B), 0); close(distance(p.A, p.D), d.p); close(distance(p.D, p.B), d.q); close(distance(p.C, p.D) ** 2, d.p * d.q); break;
      case 'proof-chords': onLine(p.A, p.C, p.P); onLine(p.B, p.D, p.P); close(distance(p.P, p.A) * distance(p.P, p.C), distance(p.P, p.B) * distance(p.P, p.D)); break;
      case 'proof-tangents': close(dot(p.O, p.A, p.P), 0); close(dot(p.O, p.B, p.P), 0); close(distance(p.P, p.A), 4 * d.k); close(distance(p.P, p.A), distance(p.P, p.B)); break;
      case 'proof-trapezoid': onLine(p.A, p.C, p.O); onLine(p.B, p.D, p.O); close(distance(p.A, p.O) / distance(p.O, p.C), d.p / d.q); close(area(p.A, p.O, p.B), area(p.C, p.O, p.D)); break;
      case 'proof-projections': close(dot(p.P, p.E, p.B), 0); close(dot(p.P, p.F, p.D), 0); close(distance(p.A, p.E) / distance(p.A, p.B), d.p / (d.p + d.q)); close(distance(p.A, p.F) / distance(p.A, p.D), d.p / (d.p + d.q)); break;
      case 'proof-incenter-angle': { const angle = Math.acos(dot(p.B, p.I, p.C) / (distance(p.B, p.I) * distance(p.C, p.I))) * 180 / Math.PI; close(angle, 90 + d.angle / 2); break; }
      default: assert.fail(t.model.family);
    }
    if (t.scene!.circles.length) { const c = t.scene!.circles[0]; for (const n of ['A', 'B', 'C', 'D'].filter(n => p[n])) close(distance(p[n], c.center), c.radius); }
  }
});
test('№25: validate all supplied lengths and constructions, independently calculate the answer', () => {
  for (const t of extendedModules[5].tasks) {
    const p = t.scene!.points, d = t.model.data, x = t.answerSpec?.kind === 'numbers' ? numeric(t) : undefined;
    switch (t.model.family) {
      case 'g25-bisector-trapezoid': close(distance(p.A, p.B), d.ab); close(distance(p.C, p.D), d.cd); close(distance(p.B, p.C), d.bc); close(distance(p.A, p.M), distance(p.B, p.M)); close(x!, area(p.A, p.B, p.C, p.D)); break;
      case 'g25-right-inradius': close(distance(p.B, p.C) - distance(p.A, p.C), 2 * d.k); close(dot(p.A, p.C, p.B), 0); close(area(p.A, p.B, p.C) / ((d.ac + d.bc + d.ab) / 2), d.r); close(x!, area(p.A, p.B, p.C)); break;
      case 'g25-scalene-trapezoid': close(distance(p.A, p.B), d.ab); close(distance(p.C, p.D), d.cd); close(distance(p.A, p.D), d.ad); close(distance(p.B, p.C), d.bc); close(x!, area(p.A, p.B, p.C, p.D)); break;
      case 'g25-bisector-length': close(distance(p.A, p.B), d.ab); close(distance(p.A, p.C), d.ac); close(distance(p.B, p.D) / distance(p.D, p.C), d.ab / d.ac); close(distance(p.A, p.D) ** 2, d.squared); break;
      case 'g25-chords-radius': close(distance(p.P, p.A), d.pa); close(distance(p.P, p.B), d.pb); close(distance(p.P, p.C), d.pc); close(distance(p.O, p.H), d.distance); for (const n of ['A', 'B', 'C', 'D']) close(distance(p.O, p[n]), x! / 2); break;
      case 'g25-tangent-parts': close(distance(p.A, p.T), d.at); close(distance(p.B, p.T), d.bt); close(dot(p.I, p.T, p.A), 0); close(x!, area(p.A, p.B, p.C)); break;
      case 'g25-trapezoid-circle': close(distance(p.A, p.D), d.ad); close(distance(p.B, p.C), d.bc); close(distance(p.A, p.B), d.leg); for (const n of ['A', 'B', 'C', 'D']) close(distance(p.O, p[n]) ** 2, d.squared); break;
      case 'g25-tangential-trapezoid': close(distance(p.A, p.D), d.ad); close(distance(p.B, p.C), d.bc); close(distance(p.A, p.B) + distance(p.C, p.D), d.ad + d.bc); close(x!, area(p.A, p.B, p.C, p.D)); break;
      case 'g25-projections': close(distance(p.C, p.D), d.height); close(distance(p.D, p.B) - distance(p.A, p.D), 7 * d.k); close(dot(p.A, p.C, p.B), 0); close(x!, area(p.A, p.B, p.C)); break;
      case 'g25-cevians-area': onLine(p.B, p.D, p.P); onLine(p.A, p.M, p.P); close(distance(p.B, p.M), distance(p.M, p.C)); close(distance(p.A, p.D) / distance(p.D, p.C), d.p / d.q); close(area(p.A, p.B, p.C), d.total); close(x!, area(p.A, p.B, p.P)); break;
      default: assert.fail(t.model.family);
    }
  }
});
test('Numeric checker accepts decimal commas, unordered roots and fractions, rejects missing roots', () => {
  const spec = { kind: 'numbers' as const, values: [-2, .25] };
  assert.equal(numericAnswer('1/4; −2', spec), true);
  assert.equal(numericAnswer('-2;0,25', spec), true);
  assert.equal(numericAnswer('0,25', spec), false);
  assert.equal(numericAnswer('1/0; -2', spec), false);
  assert.equal(numericAnswer('NaN', spec), false);
});
test('Graph joins remain filled when either branch includes the point; explicit holes stay open', () => {
  const v = extendedModules[2].tasks.find(t => t.group === 3)!;
  assert.deepEqual(graphMarkers(v.graph!), [{ x: v.model.data.h, y: v.model.data.k, closed: true }]);
  const split = extendedModules[2].tasks.find(t => t.group === 10)!;
  assert.deepEqual(graphMarkers(split.graph!).map(p => p.closed), [true, false]);
  const hole = extendedModules[2].tasks.find(t => t.group === 5)!;
  assert.equal(graphMarkers(hole.graph!)[0].closed, false);
});
test('All 600 geometry drawings have separate labels at 320px, 390px and enlarged sizes', () => {
  for (const t of allExtendedTasks.filter(t => t.scene)) for (const [width, height, font] of [[224, 240, 14], [294, 240, 14], [620, 460, 20]]) {
    const { labels } = geometryLayout(t.scene!, width, height, font);
    for (let i = 0; i < labels.length; i++) {
      const a = labels[i]; assert.ok(a.x >= 0 && a.y >= 0 && a.x + a.width <= width && a.y + a.height <= height, t.id);
      for (const b of labels.slice(i + 1)) assert.equal(labelsOverlap(a, b, 1), false, `${t.id}: ${a.name}/${b.name}`);
    }
  }
});
