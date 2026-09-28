import assert from 'node:assert/strict';
import test from 'node:test';
import { checkAnswer, guided, makeRound } from '../src/engine.ts';

test('guided cards expose the answer and a useful calculation path', () => {
  assert.equal(guided.length, 6);
  for (const card of guided) {
    assert.ok(card.expression);
    assert.ok(card.hint);
    assert.ok(Number.isFinite(card.answer));
  }
});

test('a round contains ten distinct problems and stays within the available pool', () => {
  const round = makeRound(() => 0.25);
  assert.equal(round.length, 10);
  assert.equal(new Set(round.map(card => card.id)).size, 10);
  assert.ok(round.every(card => checkAnswer(String(card.answer), card)));
});

test('answer validation rejects blanks and partial strings', () => {
  const card = guided[0];
  assert.equal(checkAnswer(' 75 ', card), true);
  assert.equal(checkAnswer('', card), false);
  assert.equal(checkAnswer('75abc', card), false);
  assert.equal(checkAnswer('74', card), false);
});
