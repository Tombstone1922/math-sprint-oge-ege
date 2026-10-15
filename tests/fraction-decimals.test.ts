import assert from 'node:assert/strict';
import test from 'node:test';
import { decimalExpansion, fractionDecimalPool, matchesDecimal } from '../src/fraction-decimals.ts';
import { checkAnswer, getGroupCount, getGroupProblems, makeRound, parseGroup, restoreRound } from '../src/engine.ts';

test('all fractions with denominators 2–16 up to 17/8 are present, including every fraction through 1/2', () => {
  const keys = new Set(fractionDecimalPool.map(p => `${p.conversion!.numerator}/${p.conversion!.denominator}`));
  assert.equal(keys.size, 280);
  for (let d = 2; d <= 16; d++) for (let n = 1; n * 8 <= 17 * d; n++) assert.ok(keys.has(`${n}/${d}`), `${n}/${d}`);
  assert.equal(getGroupCount('fraction-decimals'), 14);
  assert.equal(getGroupCount('mental-math'), 10);
  assert.equal(parseGroup('14', 'fraction-decimals'), 14);
  assert.equal(parseGroup('14', 'fractions'), 1);
  assert.equal(parseGroup('15', 'fraction-decimals'), 1);
  assert.equal(getGroupProblems('fraction-decimals', 14).length, 20);
  const round = makeRound('fraction-decimals', 14);
  assert.deepEqual(restoreRound(round.map(p => p.id).join(','), 'fraction-decimals', 14), round);
  for (const p of fractionDecimalPool) {
    const [n, d] = p.answer.split('/').map(Number);
    const decimal = p.answerDisplay!;
    assert.equal(checkAnswer(decimal, p), true);
    const m = /^(\d+)(?:,(\d*)(?:\((\d+)\))?)?$/.exec(decimal)!;
    // Independently approximate repeated notation using twelve repeated cycles.
    const approx = Number(m[1] + '.' + (m[2] ?? '') + (m[3] ?? '').repeat(12));
    assert.ok(Math.abs(approx - n / d) < 1e-10, p.id);
  }
});

test('exact decimal conversion handles finite, mixed and recurring decimals without rounding', () => {
  for (const [n, d, expected] of [[1,16,'0,0625'],[1,8,'0,125'],[3,8,'0,375'],[1,4,'0,25'],[1,2,'0,5'],[17,8,'2,125'],[1,3,'0,(3)'],[1,6,'0,1(6)'],[1,7,'0,(142857)'],[1,11,'0,(09)'],[1,12,'0,08(3)'],[1,13,'0,(076923)'],[1,14,'0,0(714285)'],[8,8,'1']] as const) assert.equal(decimalExpansion(n,d), expected);
  assert.equal(matchesDecimal('0.2500',1,4),true);
  assert.equal(matchesDecimal('0,(333)',1,3),true);
  assert.equal(matchesDecimal('0,(9)',1,1),true);
  for (const bad of ['0,333', '0,33(4)', '0,', '0,()', '0,(3', '0,3)', '1/3', '', 'Infinity', '0,3abc', '0,(3)(3)']) assert.equal(matchesDecimal(bad,1,3),false,bad);
  assert.equal(matchesDecimal('0,'+'1'.repeat(1000),1,3),false);
});
