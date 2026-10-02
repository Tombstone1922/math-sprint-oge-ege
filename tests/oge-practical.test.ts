import assert from 'node:assert/strict';
import test from 'node:test';
import { practicalPools } from '../src/oge-practical.ts';
import { checkAnswer, makeRound, restoreRound, shuffleForPractice } from '../src/engine.ts';

test('practical rounds preserve two complete blocks, conditions and colors', () => {
  for (const id of Object.keys(practicalPools) as (keyof typeof practicalPools)[]) {
    for (let group = 1; group <= 10; group++) {
      const round = makeRound(id, group, () => 0.3);
      const practice = shuffleForPractice(restoreRound(round.map(p => p.id).join(','), id, group));
      for (const cards of [round, practice]) for (let start = 0; start < 10; start += 5) {
        assert.deepEqual(cards.slice(start, start + 5).map(p => p.practical!.number), [1, 2, 3, 4, 5]);
        assert.equal(new Set(cards.slice(start, start + 5).map(p => p.practical!.block)).size, 1);
        assert.equal(new Set(cards.slice(start, start + 5).map(p => p.colorIndex)).size, 1);
      }
      assert.deepEqual(new Set(round.map(p => p.id)), new Set(practice.map(p => p.id)));
      const corrupted = [...round];
      [corrupted[1], corrupted[6]] = [corrupted[6], corrupted[1]];
      assert.throws(() => restoreRound(corrupted.map(p => p.id).join(','), id, group));
    }
  }
});

test('plan areas, tile rounding and tyre dimensions agree with source data', () => {
  for (const [id, cards] of Object.entries(practicalPools)) for (let i = 0; i < cards.length; i += 5) {
    const block = cards[i].practical!.block, scene = block.scene;
    assert.ok(cards.slice(i, i + 5).every(p => checkAnswer(p.answer, p)));
    if (scene.kind === 'plan') {
      for (const r of scene.rooms) assert.ok(r.x >= 0 && r.y >= 0 && r.x + r.w <= scene.width && r.y + r.h <= scene.height);
      const [first, second] = scene.rooms;
      assert.ok(Math.abs(Number(cards[i + 1].answer) - first.w * first.h * scene.unit ** 2) < 1e-8);
      assert.equal(cards[i].answer, scene.rooms.map(r => r.label).join(''));
      if (id === 'oge-apartment') {
        const pack = Number(/в упаковке (\d+)/.exec(block.text)![1]);
        assert.equal(Number(cards[i + 2].answer), Math.ceil(first.w * first.h / pack));
        assert.ok(Math.abs(Number(cards[i + 3].answer) - 2 * (second.w + second.h) * scene.unit) < 1e-8);
      } else {
        const pack = Number(/хватает на (\d+)/.exec(block.text)![1]);
        assert.equal(Number(cards[i + 2].answer), scene.width * scene.height * scene.unit ** 2);
        assert.equal(Number(cards[i + 3].answer), Math.ceil(second.w * second.h * scene.unit ** 2 / pack));
      }
    } else {
      assert.equal(Number(cards[i].answer), Math.min(...block.table!.rows.map(r => Number(r[0]))));
      assert.equal(Number(cards[i + 1].answer), scene.width * scene.ratio / 100);
      assert.ok(Math.abs(Number(cards[i + 2].answer) - scene.rim * 25.4) < 1e-8);
      assert.ok(Math.abs(Number(cards[i + 3].answer) - scene.rim * 25.4 - 2 * scene.width * scene.ratio / 100) < 1e-8);
      assert.equal(checkAnswer(cards[i + 1].answer.replace('.', ','), cards[i + 1]), true);
    }
  }
});
