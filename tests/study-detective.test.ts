import test from 'node:test';
import assert from 'node:assert/strict';
import { detectiveTask, detectiveTasks, detectiveGroups } from '../src/study/detective-bank.ts';
import { detectivePending, emptyDetective, parseDetective, reduceDetective, type DetectiveState } from '../src/study/detective.ts';
import { formulaEntry, formulaEntries } from '../src/study/reference.ts';
import { quizSolutions } from '../src/study/quiz-solutions.ts';
import { getGroupProblems } from '../src/engine.ts';
const close = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-7 * Math.max(1, Math.abs(b)), `${a} != ${b}`);
test('Detective has 200 unique tasks, ten groups, varied error positions/answers and valid reference links', () => {
  assert.equal(detectiveTasks.length, 200); assert.equal(detectiveGroups.length, 10);
  assert.equal(new Set(detectiveTasks.map(t => t.condition)).size, 200);
  for (let g = 1; g <= 10; g++) {
    const tasks = detectiveTasks.filter(t => t.group === g); assert.equal(tasks.length, 20);
    assert.equal(new Set(tasks.map(t => t.index)).size, 20); assert.equal(new Set(tasks.map(t => t.correctChoice)).size, 3); assert.equal(new Set(tasks.map(t => t.badIndex)).size, 2);
  }
  for (const t of detectiveTasks) {
    assert.ok(t.badIndex > 0 && t.badIndex < t.steps.length); assert.equal(new Set(t.choices).size, 3); assert.ok(t.corrected.length >= 2 && t.explanation && t.tip); assert.ok(formulaEntry(t.reference));
    assert.ok(Object.values(t.model.data).every(Number.isFinite)); assert.notEqual(t.model.correct, t.model.wrong);
  }
});
test('All 200 intended corrections agree with independent arithmetic, root sets, inequalities and diagram areas', () => {
  for (const t of detectiveTasks) {
    const d = t.model.data, expected = t.model.correct;
    switch (t.model.family) {
      case 1: close(expected, d.a - (-d.b)); close(t.model.wrong, d.a - d.b); break;
      case 2: close(expected, -d.k * (0 - d.b)); close(t.model.wrong, -d.k * 0 - d.k * d.b); break;
      case 3: close(expected, d.a / d.d + d.b / d.e); close(t.model.wrong, (d.a + d.b) / (d.d + d.e)); break;
      case 4: close(expected, (d.x + d.a) / d.a); close(t.model.wrong, d.x); break;
      case 5: close(expected, d.price * (1 + d.p / 100) * (1 - d.p / 100)); break;
      case 6: close(expected, (d.a + d.b) * (d.a + d.b)); break;
      case 7: close(expected, Math.sqrt(d.x * d.x)); assert.ok(expected >= 0); break;
      case 8: { const roots = Array.from({ length: 50 }, (_, i) => i - 25).filter(x => x * (x - d.a) === 0); assert.deepEqual(roots, [0, d.a]); assert.equal(expected, roots.length); break; }
      case 9: for (let x = -30; x <= 30; x += .5) assert.equal(-d.k * x <= -d.k * d.a, x >= d.a); break;
      case 10: {
        const p = t.scene!.points; close(Math.hypot(p.B[0] - p.A[0], p.B[1] - p.A[1]), d.a); close(Math.hypot(p.D[0] - p.A[0], p.D[1] - p.A[1]), d.side); close(Math.hypot(p.D[0] - p.H[0], p.D[1] - p.H[1]), d.h);
        const v = [p.A, p.B, p.C, p.D]; const area = Math.abs(v.reduce((s, p, i) => { const q = v[(i + 1) % 4]; return s + p[0] * q[1] - p[1] * q[0]; }, 0)) / 2; close(expected, area); break;
      }
      default: assert.fail(t.id);
    }
  }
});
const start = (state = emptyDetective(), now = 1000, review = false) => reduceDetective(state, { type: 'start', group: 1, review, random: () => 0 }, now);
function solve(state: DetectiveState, now = 1000) {
  const s = state.current!, task = detectiveTask(s.ids[s.position])!;
  state = reduceDetective(state, { type: 'step', session: s.id, index: s.position, value: task.badIndex }, now);
  state = reduceDetective(state, { type: 'check-step', session: s.id, index: s.position }, now);
  state = reduceDetective(state, { type: 'choice', session: s.id, index: s.position, value: task.correctChoice }, now);
  return reduceDetective(state, { type: 'check-choice', session: s.id, index: s.position }, now);
}
const finish = (state: DetectiveState) => reduceDetective(state, { type: 'finish', session: state.current!.id });
test('Both phases are required, stale selections are rejected and duplicate submissions cannot inflate scores', () => {
  let state = start(), s = state.current!, id = s.ids[0];
  assert.equal(new Set(s.ids).size, 10);
  assert.equal(reduceDetective(state, { type: 'next', session: s.id, index: 0 }), state);
  assert.equal(reduceDetective(state, { type: 'choice', session: s.id, index: 0, value: 0 }), state);
  state = solve(state); assert.equal(state.stats[id].attempts, 1); assert.equal(state.stats[id].independent, 1);
  assert.equal(solve(state), state);
  state = reduceDetective(state, { type: 'next', session: s.id, index: 0 });
  assert.equal(reduceDetective(state, { type: 'step', session: s.id, index: 0, value: 0 }), state);
});
test('A wrong step is queued immediately and cannot become independent after retries or restart', () => {
  let state = start(), s = state.current!, id = s.ids[0];
  state = reduceDetective(state, { type: 'step', session: s.id, index: 0, value: 0 }, 1000);
  state = reduceDetective(state, { type: 'check-step', session: s.id, index: 0 }, 1000);
  assert.equal(detectivePending(state, 1000).length, 1); assert.equal(state.stats[id].attempts, 0);
  state = parseDetective(JSON.parse(JSON.stringify(state))); state = solve(state);
  assert.equal(state.stats[id].independent, 0); assert.equal(state.stats[id].assisted, 1);
  const after = state; assert.equal(reduceDetective(state, { type: 'help', session: s.id, index: 0 }), after);
});
test('Wrong correction, a clue, a reference or the full solution all count as assistance', () => {
  for (const assistance of ['choice', 'book', 'help'] as const) {
    let state = start(), s = state.current!, task = detectiveTask(s.ids[0])!;
    if (assistance === 'choice') {
      state = reduceDetective(state, { type: 'step', session: s.id, index: 0, value: task.badIndex }); state = reduceDetective(state, { type: 'check-step', session: s.id, index: 0 });
      state = reduceDetective(state, { type: 'choice', session: s.id, index: 0, value: (task.correctChoice + 1) % 3 }); state = reduceDetective(state, { type: 'check-choice', session: s.id, index: 0 });
    } else state = reduceDetective(state, { type: assistance, session: s.id, index: 0 });
    assert.equal(state.stats[task.id].dueAt !== null, true);
    state = solve(state); assert.equal(state.stats[task.id].assisted, 1); assert.equal(state.stats[task.id].independent, 0);
  }
});
test('Detective review uses three spaced independent completions, not early or ordinary retries', () => {
  let state = start(), id = state.current!.ids[0];
  state = reduceDetective(state, { type: 'help', session: state.current!.id, index: 0 }, 1000); state = finish(state);
  const day = 86400000;
  for (const [at, streak, dueAt] of [[2000, 1, 2000 + day], [2000 + day, 2, 2000 + 4 * day], [2000 + 4 * day, 3, null]] as const) {
    state = finish(solve(start(state, at, true), at)); assert.equal(state.stats[id].streak, streak); assert.equal(state.stats[id].dueAt, dueAt);
    if (dueAt !== null) assert.equal(start(state, dueAt - 1, true), state);
  }
  assert.equal(detectivePending(state).length, 0);
});
test('Reference has forty unique cards, forty explained quizzes, varied choices and valid training routes', () => {
  assert.equal(formulaEntries.length, 40); assert.equal(new Set(formulaEntries.map(f => f.id)).size, 40);
  assert.equal(new Set(formulaEntries.map(f => f.quiz.answer)).size, 3);
  assert.ok(formulaEntries.filter(f => f.scene).length >= 12);
  for (const f of formulaEntries) { assert.equal(new Set(f.quiz.options).size, 3, f.id); assert.ok(quizSolutions[f.id], f.id); assert.ok(f.formula && f.notation && f.example && f.solution); assert.equal(getGroupProblems(f.practice.module, f.practice.group).length, 20); }
  const answers = Object.fromEntries(formulaEntries.map(f => [f.id, f.quiz.options[f.quiz.answer]]));
  assert.equal(answers['fractions-add'], '1/2'); assert.equal(answers['fraction-product'], '5/6'); assert.equal(answers['root-square'], '7'); assert.equal(answers.quadratic, '0'); assert.equal(answers.vieta, '2'); assert.equal(answers['rhombus-area'], '13'); assert.equal(answers.bisector, '6');
});
