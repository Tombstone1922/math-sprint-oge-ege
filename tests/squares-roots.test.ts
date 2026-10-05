import assert from 'node:assert/strict';
import test from 'node:test';
import { squareRootPool, squareRootGroups } from '../src/squares-roots.ts';

test('squares and inverse roots cover every integer from 11 through 99', () => {
  assert.equal(squareRootGroups.length, 10);
  assert.equal(squareRootPool.length, 200);
  const squares = squareRootPool.filter(p => /^\d+²$/.test(p.expression));
  const roots = squareRootPool.filter(p => p.expression.startsWith('√'));
  assert.deepEqual(squares.map(p => Number(p.expression.slice(0, -1))), Array.from({ length: 89 }, (_, i) => i + 11));
  assert.equal(roots.length, 89);
  for (const p of squareRootPool) {
    if (p.expression.endsWith('²')) assert.equal(Number(p.answer), Number(p.expression.slice(0, -1)) ** 2);
    else if (p.expression.startsWith('√')) assert.equal(Number(p.answer) ** 2, Number(p.expression.slice(1)));
    else if (p.expression.includes('×')) assert.equal(Number(p.answer), Number(p.expression.split(' × ')[0]) ** 2);
    else assert.equal(Number(p.answer) ** 2, Number(p.expression.match(/\d+/)![0]));
  }
});
