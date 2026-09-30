import assert from 'node:assert/strict';
import test from 'node:test';
import { lessons, modules } from '../src/content.ts';
import { checkAnswer, getGroupProblems, getProblemPool, GROUP_COUNT, GROUP_SIZE, makeRound, restoreRound, shuffleForPractice } from '../src/engine.ts';
import { cardPalette } from '../src/theme.ts';

const numeric = (answer: string) => {
  const [top, bottom] = answer.split('/').map(Number);
  return bottom === undefined ? top : top / bottom;
};

test('every module has a lesson, 200 problems in ten groups of twenty, and 20 quiet colors', () => {
  assert.equal(cardPalette.length, 20);
  assert.equal(new Set(cardPalette).size, 20);
  assert.ok(cardPalette.every(hex => /^#[A-F0-9]{6}$/.test(hex)));
  for (const module of modules) {
    assert.equal(lessons[module.id].length, 3, module.id);
    const pool = getProblemPool(module.id);
    assert.equal(pool.length, GROUP_COUNT * GROUP_SIZE, module.id);
    assert.equal(new Set(pool.map(problem => problem.id)).size, pool.length, module.id);
    assert.equal(new Set(pool.map(problem => JSON.stringify([problem.expression, problem.figure?.scene]))).size, pool.length, module.id);
    for (const problem of pool) {
      assert.ok(problem.expression && problem.hint && Number.isFinite(numeric(problem.answer)), problem.id);
      assert.ok(checkAnswer(problem.answer, problem), problem.id);
      assert.ok(problem.colorIndex >= 0 && problem.colorIndex < cardPalette.length, problem.id);
    }
    const grouped = Array.from({ length: GROUP_COUNT }, (_, i) => getGroupProblems(module.id, i + 1));
    assert.deepEqual(grouped.flat().map(problem => problem.id), pool.map(problem => problem.id));
    for (const [index, group] of grouped.entries()) {
      assert.equal(group.length, GROUP_SIZE);
      assert.equal(new Set(group.map(problem => problem.colorIndex)).size, 20);
      const guided = makeRound(module.id, index + 1, () => 0.37);
      const practice = shuffleForPractice(restoreRound(guided.map(problem => problem.id).join(','), module.id, index + 1), () => 0.37);
      assert.equal(guided.length, 10);
      assert.ok(guided.every(problem => group.includes(problem)));
      assert.deepEqual(new Set(guided.map(problem => problem.id)), new Set(practice.map(problem => problem.id)));
      assert.notDeepEqual(guided.map(problem => problem.id), practice.map(problem => problem.id));
    }
  }
  assert.throws(() => getGroupProblems('percent', 0));
  assert.throws(() => getGroupProblems('percent', 11));
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
      : card.expression.endsWith('³') ? n ** 3 : card.expression.includes(' + ') ? n ** 2 + Number(card.expression.split(' + ')[1]) : n ** 2;
    assert.equal(numeric(card.answer), expected, card.expression);
  }
  for (const card of getProblemPool('probability')) {
    const [red, blue] = (card.expression.match(/\d+/g) ?? []).map(Number);
    const favorable = card.expression.includes('P(красный)') ? red : blue;
    assert.ok(Math.abs(numeric(card.answer) - favorable / (red + blue)) < 1e-10, card.expression);
  }
});

test('equivalent fractions work, malformed answers do not', () => {
  const card = { id: 'test', expression: '1/2', answer: '1/2', hint: 'Сократи', colorIndex: 0 };
  assert.equal(checkAnswer('2/4', card), true);
  assert.equal(checkAnswer('0,5', card), true);
  assert.equal(checkAnswer('1/0', card), false);
  assert.equal(checkAnswer('1/2abc', card), false);
  assert.equal(checkAnswer('3/4', card), false);
  const foreign = makeRound('percent').map(problem => problem.id).join(',');
  assert.throws(() => restoreRound(foreign, 'fractions'));
});
