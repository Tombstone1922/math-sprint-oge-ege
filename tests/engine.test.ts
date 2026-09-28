import assert from 'node:assert/strict';
import test from 'node:test';
import { checkAnswer, getGroupProblems, makeRound, problemPool, restoreRound, shuffleForPractice } from '../src/engine.ts';

test('pool contains 200 unique addition and subtraction problems with all values in 0..200', () => {
  assert.equal(problemPool.length, 200);
  assert.equal(new Set(problemPool.map(card => card.expression)).size, 200);
  assert.equal(problemPool.filter(card => card.expression.includes(' + ')).length, 100);
  assert.equal(problemPool.filter(card => card.expression.includes(' − ')).length, 100);
  for (const card of problemPool) {
    const match = /^(\d+) ([+−]) (\d+)$/.exec(card.expression);
    assert.ok(match, card.expression);
    const left = Number(match[1]), right = Number(match[3]);
    assert.ok(left <= 200 && right <= 200 && Number(card.answer) >= 0 && Number(card.answer) <= 200);
    assert.equal(Number(card.answer), match[2] === '+' ? left + right : left - right);
  }
  assert.ok(problemPool.some(card => card.expression === '15 + 11'));
  assert.ok(problemPool.some(card => card.expression === '19 + 22'));
});
test('the same 10 unique cards appear with and without answers in different order', () => {
  const guided = makeRound('mental-math', 4, () => 0.25);
  assert.ok(guided.every(card => getGroupProblems('mental-math', 4).includes(card)));
  const practice = shuffleForPractice(restoreRound(guided.map(card => card.id).join(','), 'mental-math', 4), () => 0.25);
  assert.equal(guided.length, 10);
  assert.equal(new Set(guided.map(card => card.id)).size, 10);
  assert.deepEqual(new Set(practice.map(card => card.id)), new Set(guided.map(card => card.id)));
  assert.notDeepEqual(practice.map(card => card.id), guided.map(card => card.id));
  assert.ok(practice.every(card => checkAnswer(String(card.answer), card)));
  assert.ok(practice.every(card => guided.find(item => item.id === card.id)?.colorIndex === card.colorIndex));
  assert.throws(() => restoreRound(guided.map(card => card.id).join(','), 'mental-math', 5));
  assert.throws(() => restoreRound('problem-1,problem-1'));
});
test('answer validation rejects blanks and partial strings', () => {
  const card = problemPool[0];
  assert.equal(checkAnswer(String(card.answer), card), true);
  assert.equal(checkAnswer('', card), false);
  assert.equal(checkAnswer(`${card.answer}abc`, card), false);
  assert.equal(checkAnswer(String(Number(card.answer) + 1), card), false);
});
