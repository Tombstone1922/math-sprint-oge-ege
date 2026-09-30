import assert from 'node:assert/strict';
import test from 'node:test';
import { getProblemPool } from '../src/engine.ts';
import type { OgeGeometryId } from '../src/oge-geometry.ts';

const ids: OgeGeometryId[] = ['oge-15', 'oge-16', 'oge-17', 'oge-19'];
const numbers = (s: string) => (s.match(/\d+/g) ?? []).map(Number);

test('all geometry sections have 200 original illustrated tasks and coherent answers', () => {
  for (const id of ids) {
    const pool = getProblemPool(id);
    assert.equal(pool.length, 200, id);
    assert.ok(pool.every(p => p.figure), id);
    assert.ok(new Set(pool.map(p => p.figure!.kind)).size >= (id === 'oge-19' ? 1 : 2), id);
    for (const p of pool) {
      const n = numbers(p.expression);
      let answer: number;
      if (id === 'oge-15') {
        answer = p.expression.startsWith('В равнобедренном') ? (180 - n[0]) / 2
          : p.expression.startsWith('В прямоугольном') ? Math.hypot(n[0], n[1]) : 180 - n[0] - n[1];
      } else if (id === 'oge-16') {
        answer = p.expression.startsWith('Центральный') ? n[0] / 2
          : p.expression.startsWith('Вписанный') ? n[0] * 2
          : p.expression.startsWith('Радиус окружности с центром') ? n[0] * 2
          : p.expression.startsWith('Радиус окружности равен') ? 2 * Math.sqrt(n[0] ** 2 - n[1] ** 2)
          : p.expression.startsWith('Из точки') ? Math.sqrt(n[0] * n[1]) : Math.sqrt(n[1] ** 2 - n[0] ** 2);
      } else if (id === 'oge-17') {
        answer = p.expression.startsWith('Прямоугольник')
          ? p.expression.includes('периметр') ? 2 * (n[0] + n[1]) : n[0] * n[1]
          : p.expression.startsWith('Основания') ? (n[0] + n[1]) / 2 : n[0] * n[1] / 2;
      } else {
        const match = /1\) Площадь прямоугольника (\d+)×(\d+) равна (\d+)\.\n2\) Диаметр окружности радиуса (\d+) равен (\d+)\.\n3\) Если углы треугольника (\d+)° и (\d+)°, то третий равен (\d+)°/.exec(p.expression);
        assert.ok(match, p.expression);
        const [, a, b, area, radius, diameter, angleA, angleB, angleC] = match.map(Number);
        const truth = [area === a * b, diameter === 2 * radius, angleC === 180 - angleA - angleB];
        assert.equal(truth.filter(Boolean).length, 1, p.expression);
        answer = truth.findIndex(Boolean) + 1;
      }
      assert.equal(Number(p.answer), answer, p.expression);
    }
  }
  assert.ok(getProblemPool('oge-18').some(p => p.answer.endsWith('.5')), 'decimal grid answers must be enterable');
  assert.deepEqual(new Set(getProblemPool('oge-19').map(p => p.answer)), new Set(['1', '2', '3']));
});
