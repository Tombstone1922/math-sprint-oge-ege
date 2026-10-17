import assert from 'node:assert/strict';
import test from 'node:test';
import { getProblemPool } from '../src/engine.ts';
import { geometryLayout, labelsOverlap } from '../src/geometry-layout.ts';
import type { GridPoint } from '../src/grid-geometry.ts';
const distance = (a: GridPoint, b: GridPoint) => Math.hypot(a[0] - b[0], a[1] - b[1]);
const near = (a: number, b: number, context: string) => assert.ok(Math.abs(a - b) < 1e-7, `${context}: ${a} != ${b}`);
const angle = (a: GridPoint, v: GridPoint, b: GridPoint) => Math.acos(Math.max(-1, Math.min(1, ((a[0] - v[0]) * (b[0] - v[0]) + (a[1] - v[1]) * (b[1] - v[1])) / (distance(a, v) * distance(b, v))))) * 180 / Math.PI;

test('all 200 basic geometry tasks have accurate diagrams, areas, perimeters and heights', () => {
  for (const p of getProblemPool('geometry')) {
    const s = p.figure!.scene!, unit = p.figure!.unit!, v = s.polygons[0].vertices, points = s.points;
    const area = Math.abs(v.reduce((sum, a, j) => sum + a[0] * v[(j + 1) % v.length][1] - a[1] * v[(j + 1) % v.length][0], 0)) / 2 * unit ** 2;
    const perimeter = v.reduce((sum, a, j) => sum + distance(a, v[(j + 1) % v.length]), 0) * unit;
    near(Number(p.answer), p.expression.includes('Периметр') ? perimeter : area, p.id);
    if (p.expression.startsWith('Треугольник')) {
      near(angle(points.B, points.H, points.C), 90, p.id);
      assert.ok(s.segments.some(([a, b]) => distance(a, points.B) < 1e-8 && distance(b, points.H) < 1e-8));
    }
  }
});

test('numerical side and angle givens agree with the figures, independently of the requested answer', () => {
  for (const id of ['oge-15', 'oge-16', 'oge-17'] as const) for (const p of getProblemPool(id)) {
    const s = p.figure!.scene!, points = s.points, unit = p.figure!.unit!;
    for (const m of p.expression.matchAll(/\b([A-Z]{2})=(\d+(?:[,.]\d+)?)(?:√([235]))?/g)) {
      const [a, b] = m[1], value = Number(m[2].replace(',', '.')) * (m[3] ? Math.sqrt(Number(m[3])) : 1);
      near(distance(points[a], points[b]) * unit, value, `${p.id}: ${m[0]}`);
    }
    for (const m of p.expression.matchAll(/∠([A-Z]{1,3})=(\d+(?:[,.]\d+)?)°/g)) {
      let names = [...m[1]];
      if (names.length === 1) {
        const polygon = s.polygons[0].vertices, at = polygon.findIndex(v => distance(v, points[names[0]]) < 1e-8);
        assert.ok(at >= 0, p.id);
        near(angle(polygon[(at + polygon.length - 1) % polygon.length], polygon[at], polygon[(at + 1) % polygon.length]), Number(m[2].replace(',', '.')), `${p.id}: ${m[0]}`);
      } else near(angle(points[names[0]], points[names[1]], points[names[2]]), Number(m[2].replace(',', '.')), `${p.id}: ${m[0]}`);
    }
    if (p.expression.includes('параллелограмм')) for (const axis of [0, 1]) near(points.A[axis] + points.C[axis], points.B[axis] + points.D[axis], p.id);
    if (p.expression.includes('ромб')) {
      const sides = ['AB', 'BC', 'CD', 'DA'].map(([a, b]) => distance(points[a], points[b]));
      sides.forEach(side => near(side, sides[0], p.id));
    }
  }
});

test('all inscribed/circumscribed triangle and quadrilateral diagrams satisfy the circle conditions', () => {
  for (const p of getProblemPool('oge-16')) {
    const s = p.figure!.scene!, c = s.circles[0], v = s.polygons[0]?.vertices;
    if (!v) continue;
    const circum = /описанн[а-яё]* около/.test(p.expression) || p.expression.startsWith('Четырёхугольник ABCD вписан');
    const incircle = /вписанн[а-яё]* (в|окружности)/.test(p.expression) || p.expression.includes('вписана окружность') || p.expression.includes('описан около') || p.expression.includes('описана около');
    if (circum) v.forEach(a => near(distance(a, c.center), c.radius, p.id));
    if (incircle) for (let j = 0; j < v.length; j++) {
      const a = v[j], b = v[(j + 1) % v.length], lineDistance = Math.abs((b[0] - a[0]) * (a[1] - c.center[1]) - (a[0] - c.center[0]) * (b[1] - a[1])) / distance(a, b);
      near(lineDistance, c.radius, p.id);
    }
  }
});

test('geometry labels remain separate and in bounds at compact and enlarged viewport sizes', () => {
  for (const id of ['geometry', 'oge-15', 'oge-16', 'oge-17', 'oge-18', 'oge-19'] as const) for (const p of getProblemPool(id)) {
    const s = p.figure!.scene!;
    for (const [width, height, font] of [[224, 240, 14], [264, 240, 14], [300, 240, 14], [Math.max(620, s.columns * 40), Math.max(460, s.rows * 40), 20]]) {
      const { labels } = geometryLayout(s, width, height, font);
      assert.equal(labels.length, Object.keys(s.points).filter(n => !s.hiddenPoints?.includes(n)).length);
      for (let a = 0; a < labels.length; a++) {
        const label = labels[a];
        assert.ok(label.x >= 0 && label.y >= 0 && label.x + label.width <= width && label.y + label.height <= height, p.id);
        for (let b = a + 1; b < labels.length; b++) assert.ok(!labelsOverlap(label, labels[b]), `${p.id}: labels ${label.name}/${labels[b].name}, width ${width}`);
        for (const point of labels.map(v => v.point)) assert.ok(!(point[0] >= label.x && point[0] <= label.x + label.width && point[1] >= label.y && point[1] <= label.y + label.height), `${p.id}: label covers a point`);
      }
    }
  }
});

test('point-to-line tasks actually draw BC and decimal geometry answers use commas', () => {
  for (const p of getProblemPool('oge-18').filter(p => p.gridTask === 'point-line')) {
    const s = p.figure!.scene!, { B, C } = s.points;
    assert.ok(s.segments.some(([a, b]) => distance(a, B) < 1e-8 && distance(b, C) < 1e-8 || distance(a, C) < 1e-8 && distance(b, B) < 1e-8), p.id);
  }
  for (const id of ['geometry', 'oge-15', 'oge-16', 'oge-17', 'oge-18'] as const) for (const p of getProblemPool(id)) assert.equal(p.answerDisplay, p.answer.replace('.', ','), p.id);
});

// These tasks previously became almost vertical slivers at large k.
test('parallelogram area-part questions retain readable proportions for every size', () => {
  for (const p of getProblemPool('oge-17').filter(p => p.expression.includes('площадь трапеции EBCD'))) {
    const s = p.figure!.scene!, { A, B, C, D, E } = s.points, xs = [A[0], B[0], C[0], D[0]], ys = [A[1], B[1], C[1], D[1]];
    near((Math.max(...xs) - Math.min(...xs)) / (Math.max(...ys) - Math.min(...ys)), 1.5, p.id);
    near(distance(A, E), distance(E, B), p.id);
  }
});
