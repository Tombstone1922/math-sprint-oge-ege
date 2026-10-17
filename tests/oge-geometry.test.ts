import assert from 'node:assert/strict';
import test from 'node:test';
import { checkAnswer, getGroupProblems, getProblemPool } from '../src/engine.ts';
import { statementGroups } from '../src/oge19-problems.ts';

test('statement bank covers ten topics with all valid answer combinations and explains each option', () => {
  const pool = getProblemPool('oge-19');
  assert.equal(pool.length, 200);
  assert.equal(statementGroups.length, 10);
  assert.equal(new Set(pool.map(p => p.expression)).size, 200);
  assert.deepEqual(new Set(pool.map(p => p.answer)), new Set(['1', '2', '3', '12', '13', '23', '123']));
  const facts = new Set<string>();
  for (let group = 1; group <= 10; group++) {
    const cards = getGroupProblems('oge-19', group);
    assert.equal(cards.length, 20);
    assert.ok(cards.every(p => p.id.startsWith(`oge-19-g${group}-`)));
    assert.deepEqual(cards.map(p => p.colorIndex), Array.from({ length: 20 }, (_, i) => i));
    for (const p of cards) {
      assert.equal(p.statements!.length, 3);
      assert.equal(new Set(p.statements!.map(s => s.fact)).size, 3);
      assert.equal(p.answerMode, 'statements');
      const truth = p.statements!.flatMap((s, j) => s.valid ? [j + 1] : []).join('');
      assert.equal(p.answer, truth);
      for (const s of p.statements!) { facts.add(s.fact); assert.ok(s.explanation.length > 20); assert.ok(p.expression.includes(s.text)); assert.ok(p.hint.includes(s.explanation)); }
      assert.ok(checkAnswer(p.answer, p));
      for (const invalid of ['', '0', '4', `${p.answer}0`, `0${p.answer}`, `${p.answer},`, p.answer.length > 1 ? p.answer.slice(0, 1) : '123']) assert.equal(checkAnswer(invalid, p), false, p.id);
      if (p.answer.length > 1) { assert.equal(checkAnswer([...p.answer].reverse().join(''), p), false); assert.equal(checkAnswer([...p.answer].join(','), p), false); }
      assert.ok(p.figure!.scene);
    }
  }
  assert.equal(facts.size, 60);
});

test('selected false universal statements have explicit numerical counterexamples', () => {
  const all = getProblemPool('oge-19').flatMap(p => p.statements!);
  const falseClaim = (fact: string) => { const claim = all.find(s => s.fact === fact && !s.valid); assert.ok(claim, fact); return claim; };
  falseClaim('sas'); // Same two sides, different valid third sides.
  assert.ok(3 + 4 > 6 && 3 + 6 > 4 && 4 + 6 > 3);
  assert.notEqual(5, 6);
  falseClaim('perimeter');
  assert.equal(3 + 4 + 5, 4 + 4 + 4);
  falseClaim('sss');
  assert.equal(3 * 4 / 2, 2 * 6 / 2);
  assert.notEqual(Math.hypot(3, 4), Math.hypot(2, 6));
  falseClaim('inequality'); assert.equal(2 + 3, 5);
  falseClaim('para-diagonals'); assert.notEqual(3 * 3 - 4 * 4, 0); // dot product of rectangle diagonal directions
  falseClaim('trap-diagonals'); assert.notEqual(Math.hypot(2, 4), Math.hypot(5, 4));
  falseClaim('similar-area'); assert.equal((6 * 8 / 2) / (2 * (8 / 3) / 2), 9);
  falseClaim('inradius-area'); assert.equal(3 * 4 / 2, 6); assert.notEqual(3 * 4 / 2, (3 + 4 + 5) * 1);
  falseClaim('tangent-secant'); assert.notEqual(1 * 9, 1 * (9 - 1));
});
