import assert from 'node:assert/strict';
import test from 'node:test';
import { checkAnswer, getGroupProblems, makeRound, restoreRound } from '../src/engine.ts';
import { gridGroups, gridProblemPool } from '../src/oge18-problems.ts';
import { polygonSlice, type GridPoint } from '../src/grid-geometry.ts';

const length = (a: GridPoint, b: GridPoint) => Math.sqrt((a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2);
const close = (a: number, b: number, message: string) => assert.ok(Math.abs(a - b) < 1e-8, `${message}: ${a} != ${b}`);

test('200 grid tasks are answerable from their diagrams alone', () => {
  for (const task of gridProblemPool) {
    const scene = task.figure?.scene;
    assert.ok(scene, task.id);
    const { A, B, C, D, M } = scene.points;
    let expected: number;
    switch (task.gridTask) {
      case 'distance': expected = length(A, B); break;
      case 'point-line': expected = Math.abs((C[0] - B[0]) * (A[1] - B[1]) - (C[1] - B[1]) * (A[0] - B[0])) / length(B, C); break;
      case 'height': expected = Math.abs((C[0] - A[0]) * (B[1] - A[1]) - (C[1] - A[1]) * (B[0] - A[0])) / length(A, C); break;
      case 'midpoint': case 'median': expected = length(A, [(B[0] + C[0]) / 2, (B[1] + C[1]) / 2]); break;
      case 'triangle-midline': expected = length(A, C) / 2; break;
      case 'trapezoid-midline': expected = (length(A, B) + length(C, D)) / 2; break;
      case 'diagonal': expected = Math.max(length(A, C), length(B, D)); break;
      case 'larger-leg': expected = Math.max(length(A, B), length(A, C)); break;
      case 'hypotenuse': expected = length(B, C); break;
      case 'circle-ratio': {
        const radii = scene.circles.map(c => c.radius);
        expected = (Math.max(...radii) / Math.min(...radii)) ** 2;
        break;
      }
      case 'segment-ratio':
        close((M[0] - A[0]) * (B[1] - A[1]) - (M[1] - A[1]) * (B[0] - A[0]), 0, 'M must lie on AB');
        expected = length(B, M) / length(A, M); break;
      case 'area': {
        // Signed triangles also handle the notch of a concave polygon.
        const v = scene.polygons[0].vertices, p = v[0];
        expected = Math.abs(v.slice(1, -1).reduce((sum, a, i) => {
          const b = v[i + 2];
          return sum + ((a[0] - p[0]) * (b[1] - p[1]) - (a[1] - p[1]) * (b[0] - p[0])) / 2;
        }, 0));
        break;
      }
      default: throw new Error(`Missing grid measurement: ${task.id}`);
    }
    close(Number(task.answer), expected, task.id);
    assert.deepEqual(task.expression.match(/\d+/g), ['1', '1'], 'lengths must be read from the figure');
    const checkPoint = (p: GridPoint) => {
      assert.ok(Number.isInteger(p[0]) && Number.isInteger(p[1]), task.id);
      assert.ok(p[0] > 0 && p[0] < scene.columns && p[1] > 0 && p[1] < scene.rows, `${task.id}: drawing is clipped`);
    };
    Object.values(scene.points).forEach(checkPoint);
    scene.polygons.flatMap(p => p.vertices).forEach(checkPoint);
    for (const circle of scene.circles) {
      assert.ok(circle.center[0] - circle.radius > 0 && circle.center[0] + circle.radius < scene.columns);
      assert.ok(circle.center[1] - circle.radius > 0 && circle.center[1] + circle.radius < scene.rows);
    }
    if (task.gridTask === 'median' || task.gridTask === 'larger-leg' || task.gridTask === 'hypotenuse') {
      close((B[0] - A[0]) * (C[0] - A[0]) + (B[1] - A[1]) * (C[1] - A[1]), 0, 'A is the right angle');
    }
  }
});

test('grid groups stay distinct and the same figure survives the practice stage', () => {
  assert.equal(gridGroups.length, 10);
  assert.equal(gridProblemPool.length, 200);
  assert.equal(new Set(gridProblemPool.map(p => JSON.stringify([p.expression, p.figure]))).size, 200);
  for (let group = 1; group <= 10; group++) {
    const pool = getGroupProblems('oge-18', group);
    assert.equal(pool.length, 20);
    assert.ok(pool.every(p => p.id.startsWith(`oge-18-g${group}-`)));
    const round = makeRound('oge-18', group, () => 0.31);
    const restored = restoreRound(round.map(p => p.id).join(','), 'oge-18', group);
    assert.deepEqual(restored.map(p => p.figure), round.map(p => p.figure));
    assert.ok(restored.every(p => checkAnswer(p.answer.replace('.', ','), p)));
  }
});

test('shading respects the cutout of a composite figure', () => {
  const vertices: GridPoint[] = [[0, 0], [6, 0], [6, 3], [4, 3], [4, 5], [0, 5]];
  assert.deepEqual(polygonSlice(vertices, 1), [[0, 6]]);
  assert.deepEqual(polygonSlice(vertices, 4), [[0, 4]]);
  assert.deepEqual(polygonSlice(vertices, 6), []);
});
