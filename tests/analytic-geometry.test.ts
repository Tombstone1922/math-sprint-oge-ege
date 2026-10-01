import assert from 'node:assert/strict';
import test from 'node:test';
import { checkAnswer, getGroupProblems, getProblemPool } from '../src/engine.ts';
import type { GridPoint } from '../src/grid-geometry.ts';
import { circleGroups } from '../src/oge16-problems.ts';
import { quadrilateralGroups } from '../src/oge17-problems.ts';

const distance = (a: GridPoint, b: GridPoint) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const near = (a: number, b: number, message: string) => assert.ok(Math.abs(a - b) < 1e-7, `${message}: ${a} != ${b}`);

test('all 600 answers agree with independently measured Euclidean drawings', () => {
  for (const id of ['oge-15', 'oge-16', 'oge-17'] as const) for (const p of getProblemPool(id)) {
    const scene = p.figure!.scene!, unit = p.figure!.unit!, measure = p.geometryMeasure!;
    assert.equal(scene.grid, false);
    assert.ok(unit > 0 && Number.isFinite(unit));
    const points = measure.points.map(name => { assert.ok(scene.points[name], `${p.id}: ${name}`); return scene.points[name]; });
    let expected: number;
    if (measure.kind === 'length') expected = distance(points[0], points[1]) * unit;
    else if (measure.kind === 'area') expected = Math.abs(points.reduce((sum, a, i) => {
      const b = points[(i + 1) % points.length];
      return sum + a[0] * b[1] - a[1] * b[0];
    }, 0)) * unit ** 2 / 2;
    else {
      const [a, vertex, b] = points;
      const cosine = ((a[0] - vertex[0]) * (b[0] - vertex[0]) + (a[1] - vertex[1]) * (b[1] - vertex[1])) / (distance(a, vertex) * distance(b, vertex));
      expected = Math.acos(Math.min(1, Math.max(-1, cosine))) * 180 / Math.PI;
    }
    near(Number(p.answer), expected, p.expression);
    assert.ok(checkAnswer(p.answer.replace('.', ','), p));
    for (const point of [...Object.values(scene.points), ...scene.segments.flat(), ...scene.polygons.flatMap(polygon => polygon.vertices)]) {
      assert.ok(point.every(Number.isFinite), p.id);
      assert.ok(point[0] >= 0 && point[0] <= scene.columns && point[1] >= 0 && point[1] <= scene.rows, p.id);
    }
    const visible = Object.entries(scene.points).filter(([name]) => !scene.hiddenPoints?.includes(name));
    for (let i = 0; i < visible.length; i++) for (let j = i + 1; j < visible.length; j++) {
      assert.ok(distance(visible[i][1], visible[j][1]) > 1e-8, `${p.id}: duplicate labels at ${visible[i][0]}, ${visible[j][0]}`);
    }
    for (const circle of scene.circles) {
      assert.ok(circle.radius > 0);
      assert.ok(circle.center[0] >= circle.radius && circle.center[1] >= circle.radius, p.id);
      assert.ok(circle.center[0] + circle.radius <= scene.columns && circle.center[1] + circle.radius <= scene.rows, p.id);
    }
  }
});

test('the PDFs inform ten distinct named groups per number; colors and scenes persist into practice', () => {
  for (const [id, names] of [['oge-16', circleGroups], ['oge-17', quadrilateralGroups]] as const) {
    assert.equal(names.length, 10);
    assert.equal(new Set(names).size, 10);
    assert.equal(getProblemPool(id).length, 200);
    for (let group = 1; group <= 10; group++) {
      const tasks = getGroupProblems(id, group);
      assert.equal(tasks.length, 20);
      assert.ok(tasks.every(p => p.id.startsWith(`${id}-g${group}-`) && p.hint && p.figure?.scene));
      assert.equal(new Set(tasks.map(p => p.expression)).size, 20);
      assert.deepEqual(tasks.map(p => p.colorIndex), Array.from({ length: 20 }, (_, i) => i));
    }
    assert.ok(getProblemPool(id).some(p => p.answer.includes('.')), id);
  }
});

test('circle diagrams satisfy incidence, tangent and chord conditions stated in their questions', () => {
  for (const p of getProblemPool('oge-16')) {
    const s = p.figure!.scene!, points = s.points, c = s.circles[0];
    if (p.id.startsWith('oge-16-g3-')) {
      const O = points.O, A = points.A, P = points.P;
      near(distance(O, A), c.radius, p.id);
      near((A[0] - O[0]) * (P[0] - A[0]) + (A[1] - O[1]) * (P[1] - A[1]), 0, p.id);
      if (points.B && points.C) {
        near(distance(O, points.B), c.radius, p.id);
        near(distance(O, points.C), c.radius, p.id);
        near(distance(P, points.B) + distance(points.B, points.C), distance(P, points.C), p.id);
      }
    }
    if (p.id.startsWith('oge-16-g4-')) for (const name of ['A', 'B']) {
      const a = points[name], o = points.O, external = points.P;
      near(distance(o, a), c.radius, p.id);
      near((a[0] - o[0]) * (external[0] - a[0]) + (a[1] - o[1]) * (external[1] - a[1]), 0, p.id);
    }
    if (p.expression.includes('описан') && s.polygons.length && !p.expression.includes('описанной около треугольника')) {
      // Only circumscribed squares/trapezoids have tangent polygon edges here.
      if (p.expression.includes('Квадрат ABCD описан') || p.expression.includes('Трапеция ABCD')) {
        const vs = s.polygons[0].vertices;
        for (let i = 0; i < vs.length; i++) {
          const a = vs[i], b = vs[(i + 1) % vs.length];
          const d = Math.abs((b[0] - a[0]) * (a[1] - c.center[1]) - (a[0] - c.center[0]) * (b[1] - a[1])) / distance(a, b);
          near(d, c.radius, p.id);
        }
      }
    }
  }
});
