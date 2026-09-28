import assert from 'node:assert/strict';
import test from 'node:test';
import { lessons, modules } from '../src/content.ts';
import { checkAnswer, getProblemPool, makeRound, restoreRound, shuffleForPractice } from '../src/engine.ts';

const numeric = (answer: string) => {
  const [top, bottom] = answer.split('/').map(Number);
  return bottom === undefined ? top : top / bottom;
};

test('every visible module has a complete lesson and at least ten answerable problems', () => {
  for (const module of modules) {
    assert.equal(lessons[module.id].length, 3, module.id);
    const pool = getProblemPool(module.id);
    assert.ok(pool.length >= 10, module.id);
    assert.equal(new Set(pool.map(problem => problem.id)).size, pool.length, module.id);
    assert.equal(new Set(pool.map(problem => problem.expression)).size, pool.length, module.id);
    for (const problem of pool) {
      assert.ok(problem.expression && problem.hint && Number.isFinite(numeric(problem.answer)), problem.id);
      assert.ok(checkAnswer(problem.answer, problem), problem.id);
    }
    const guided = makeRound(module.id, () => 0.37);
    const practice = shuffleForPractice(restoreRound(guided.map(problem => problem.id).join(','), module.id), () => 0.37);
    assert.equal(guided.length, 10);
    assert.deepEqual(new Set(guided.map(problem => problem.id)), new Set(practice.map(problem => problem.id)));
    assert.notDeepEqual(guided.map(problem => problem.id), practice.map(problem => problem.id));
  }
});

test('answers are mathematically correct across the generated topic banks', () => {
  for (const card of getProblemPool('percent')) {
    const [base, rate] = (card.expression.match(/\d+/g) ?? []).map(Number);
    const expected = card.expression.includes('скидка') ? base * (100 - rate) / 100
      : card.expression.includes('выросла') ? base * (100 + rate) / 100
      : rate * base / 100;
    assert.equal(numeric(card.answer), expected, card.expression);
  }
  for (const card of getProblemPool('fractions')) {
    const [a, d, b, secondD] = (card.expression.match(/\d+/g) ?? []).map(Number);
    const expected = card.expression.includes(' от ') ? a / d * b
      : card.expression.includes(' + ') ? a / d + b / secondD : a / d - b / secondD;
    assert.ok(Math.abs(numeric(card.answer) - expected) < 1e-10, card.expression);
  }
  for (const card of getProblemPool('equations')) {
    const x = numeric(card.answer);
    const expression = card.expression.replaceAll('x', String(x)).replaceAll('−', '-');
    const [left, right] = expression.split(' = ');
    const match = /^(\d+)\((\d+) \+ (\d+)\)$/.exec(left);
    const value = match ? Number(match[1]) * (Number(match[2]) + Number(match[3]))
      : card.expression.startsWith('2x') ? 2 * x + Number(left.split(' + ')[1])
      : left.includes(' + ') ? x + Number(left.split(' + ')[1])
      : x - Number(left.split(' - ')[1]);
    assert.equal(value, Number(right), card.expression);
  }
  for (const card of getProblemPool('geometry')) {
    const [a, b] = (card.expression.match(/\d+/g) ?? []).map(Number);
    const expected = card.expression.includes('Треугольник') ? a * b / 2
      : card.expression.includes('Периметр') ? 2 * (a + b) : a * b;
    assert.equal(numeric(card.answer), expected, card.expression);
  }
  for (const card of getProblemPool('powers')) {
    const n = Number((card.expression.match(/\d+/) ?? [])[0]);
    const expected = card.expression.startsWith('√') ? Math.sqrt(n)
      : card.expression.endsWith('³') ? n ** 3 : n ** 2;
    assert.equal(numeric(card.answer), expected, card.expression);
  }
  for (const card of getProblemPool('probability')) {
    const [red, blue] = (card.expression.match(/\d+/g) ?? []).map(Number);
    const favorable = card.expression.includes('P(красный)') ? red : blue;
    assert.ok(Math.abs(numeric(card.answer) - favorable / (red + blue)) < 1e-10, card.expression);
  }
});

test('equivalent fractions work, malformed answers do not', () => {
  const card = { id: 'test', expression: '1/2', answer: '1/2', hint: 'Сократи' };
  assert.equal(checkAnswer('2/4', card), true);
  assert.equal(checkAnswer('0,5', card), true);
  assert.equal(checkAnswer('1/0', card), false);
  assert.equal(checkAnswer('1/2abc', card), false);
  assert.equal(checkAnswer('3/4', card), false);
  const foreign = makeRound('percent').map(problem => problem.id).join(',');
  assert.throws(() => restoreRound(foreign, 'fractions'));
});
