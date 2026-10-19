import test from 'node:test';
import assert from 'node:assert/strict';
import { EXAM_DURATION, emptyExam, examHasWork, examRemaining, examResults, makeExam, parseExam, practicalModules, reduceExam, resolveExam } from '../src/study/exam.ts';
import { extendedTask } from '../src/extended/bank.ts';
import { applyStudy } from '../src/study/integration.ts';
import { initialProgress, mistakeKey, parseProgress } from '../src/learning-progress.ts';
import { emptyStudy } from '../src/study/state.ts';
const random = (seed: number) => () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
test('Mocks have exactly 1–25, one intact practical block, all first-part modules and six extended tasks', () => {
  const blocks = new Set<string>();
  for (let seed = 0; seed < 400; seed++) {
    const refs = makeExam(random(Math.imul(seed + 1, 2654435761) >>> 0));
    assert.equal(refs.length, 25); assert.deepEqual(refs.map(r => r.number), Array.from({ length: 25 }, (_, i) => i + 1));
    assert.equal(new Set(refs.map(r => r.problemId)).size, 25);
    const first = resolveExam(refs[0])!; blocks.add(refs[0].moduleId);
    assert.ok(practicalModules.includes(refs[0].moduleId as typeof practicalModules[number]));
    for (const r of refs.slice(0, 5)) { const p = resolveExam(r)!; assert.equal(p.practical?.number, r.number); assert.equal(p.practical?.block.id, first.practical!.block.id); assert.equal(r.moduleId, refs[0].moduleId); }
    for (const r of refs.slice(5, 19)) { assert.equal(r.moduleId, `oge-${r.number}`); assert.ok(resolveExam(r)); }
    for (const r of refs.slice(19)) { const p = extendedTask(r.problemId)!; assert.equal(p.number, r.number); assert.equal(p.group, r.group); }
  }
  assert.equal(blocks.size, 8);
});
test('Exam edits, flags and long drafts restore; unfinished work cannot be replaced or edited out of position', () => {
  let state = reduceExam(emptyExam(), { type: 'start', timed: true, random: random(1) }, 1000), session = state.current!;
  assert.equal(EXAM_DURATION, 235 * 60000); assert.equal(session.deadline, 1000 + EXAM_DURATION);
  assert.equal(reduceExam(state, { type: 'start', timed: false }, 2000), state);
  state = reduceExam(state, { type: 'edit', id: session.id, number: 1, input: '0,125', flagged: true }, 2000);
  state = reduceExam(state, { type: 'select', id: session.id, position: 23 }, 2000);
  state = reduceExam(state, { type: 'edit', id: session.id, number: 24, draft: 'Доказательство. '.repeat(1000), paper: true }, 2000);
  assert.equal(state.current!.work[24].draft.length, 6000); assert.equal(state.current!.work[1].flagged, true);
  assert.equal(reduceExam(state, { type: 'edit', id: session.id, number: 23, draft: 'stale' }, 2000), state);
  const restored = parseExam(JSON.parse(JSON.stringify(state)));
  assert.equal(restored.current!.work[1].input, '0,125'); assert.equal(restored.current!.work[24].draft, state.current!.work[24].draft); assert.equal(restored.current!.position, 23);
  assert.equal(examHasWork(session.tasks[23], state.current!.work[24]), true);
});
test('Wall-clock deadline continues outside the app; expired edits are discarded and submission is idempotent', () => {
  let state = reduceExam(emptyExam(), { type: 'start', timed: true }, 1000), session = state.current!;
  const ref = session.tasks[0], answer = resolveExam(ref)!.answer;
  state = reduceExam(state, { type: 'edit', id: session.id, number: 1, input: answer }, 1500);
  assert.equal(examRemaining(state.current!, 1000 + EXAM_DURATION / 2), EXAM_DURATION / 2);
  state = parseExam(JSON.parse(JSON.stringify(state)));
  state = reduceExam(state, { type: 'edit', id: session.id, number: 1, input: 'late' }, 1000 + EXAM_DURATION);
  assert.equal(state.current!.work[1].input, answer); assert.equal(state.current!.expired, true); assert.equal(state.current!.finishedAt, session.deadline);
  assert.equal(reduceExam(state, { type: 'finish', id: session.id }, 2000 + EXAM_DURATION), state);
  assert.equal(examResults(state.current!).automatic, 1);
});
test('Untimed work can resume much later; only first-part answers are automatically scored', () => {
  let state = reduceExam(emptyExam(), { type: 'start', timed: false }, 1000), session = state.current!;
  for (let i = 0; i < 19; i++) {
    state = reduceExam(state, { type: 'select', id: session.id, position: i }, 2000);
    state = reduceExam(state, { type: 'edit', id: session.id, number: i + 1, input: resolveExam(session.tasks[i])!.answer }, 2000);
  }
  state = reduceExam(state, { type: 'sync', id: session.id }, 1000 + EXAM_DURATION * 10);
  assert.equal(state.current!.finishedAt, undefined); assert.equal(examRemaining(state.current!), null);
  assert.equal(reduceExam(state, { type: 'score', id: session.id, number: 24, points: 2 }), state);
  state = reduceExam(state, { type: 'finish', id: session.id }, 1000 + EXAM_DURATION * 10);
  let r = examResults(state.current!); assert.equal(r.automatic, 19); assert.equal(r.scored, 0); assert.equal(r.total, null);
  for (let number = 20; number <= 25; number++) state = reduceExam(state, { type: 'score', id: session.id, number, points: 2 });
  r = examResults(state.current!); assert.equal(r.manual, 12); assert.equal(r.total, 31);
  assert.equal(reduceExam(state, { type: 'score', id: session.id, number: 24, points: 3 }), state);
  assert.equal(reduceExam(state, { type: 'edit', id: session.id, number: 19, input: '' }), state);
});
test('Submission queues failures and blanks atomically without changing ordinary accuracy or records', () => {
  let state = initialProgress(); state.attempts = 10; state.correct = 8; state.best = 9;
  state = applyStudy(state, { area: 'exam', action: { type: 'start', timed: false } }, 1000);
  const session = state.study.exam.current!, task = session.tasks[0];
  state = applyStudy(state, { area: 'exam', action: { type: 'edit', id: session.id, number: 1, input: resolveExam(task)!.answer } }, 1500);
  assert.equal(Object.keys(state.mistakes).length, 0);
  state = applyStudy(state, { area: 'exam', action: { type: 'finish', id: session.id } }, 2000);
  assert.equal(Object.keys(state.mistakes).length, 18); assert.equal(state.mistakes[mistakeKey(task.moduleId as never, task.problemId)], undefined);
  assert.equal(state.attempts, 10); assert.equal(state.correct, 8); assert.equal(state.best, 9);
  const after = state; assert.equal(applyStudy(state, { area: 'exam', action: { type: 'finish', id: session.id } }, 3000), after);
  state = applyStudy(state, { area: 'exam', action: { type: 'score', id: session.id, number: 24, points: 1 } }, 3000);
  const proof = session.tasks[23]; assert.equal(state.extended.stats[proof.problemId].dueAt, 3000); assert.equal(state.extended.stats[proof.problemId].attempts, 0);
  const oldStat = state.extended.stats[proof.problemId];
  state = applyStudy(state, { area: 'exam', action: { type: 'score', id: session.id, number: 24, points: 2 } }, 4000);
  assert.deepEqual(state.extended.stats[proof.problemId], oldStat);
});
test('Archived work remains reviewable and manually scorable; history is bounded and references validated', () => {
  let state = emptyExam();
  for (let i = 0; i < 13; i++) { state = reduceExam(state, { type: 'start', timed: false }, 1000 + i * 1000); state = reduceExam(state, { type: 'finish', id: state.current!.id }, 1500 + i * 1000); }
  assert.equal(state.history.length, 10);
  const id = state.history[0].id;
  state = reduceExam(state, { type: 'score', id, number: 20, points: 1 }); assert.equal(state.history[0].points[20], 1);
  assert.equal(parseExam(JSON.parse(JSON.stringify(state))).history.length, 10);
  const corrupt = JSON.parse(JSON.stringify(state)); corrupt.current.tasks[1] = { ...corrupt.current.tasks[0], number: 2 };
  assert.equal(parseExam(corrupt).current, null);
  const other = JSON.parse(JSON.stringify(state)); other.current.tasks[0].moduleId = 'unknown'; assert.equal(parseExam(other).current, null);
});
test('Legacy progress adds study tools without replacing old daily, extended or numeric records', () => {
  const current = initialProgress(), { study: _study, ...old } = current;
  const restored = parseProgress({ ...old, best: 7, completed: 3 });
  assert.deepEqual(restored.study, emptyStudy()); assert.equal(restored.best, 7); assert.equal(restored.completed, 3);
  assert.deepEqual(restored.daily, current.daily); assert.deepEqual(restored.extended, current.extended);
});
test('Exam, detective, favorites and queued assistance survive one shared progress snapshot', () => {
  let state = initialProgress();
  state = applyStudy(state, { area: 'exam', action: { type: 'start', timed: false } }, 1000);
  state = applyStudy(state, { area: 'exam', action: { type: 'edit', id: state.study.exam.current!.id, number: 1, input: '12' } }, 2000);
  state = applyStudy(state, { area: 'detective', action: { type: 'start', group: 3, random: () => 0 } }, 2000);
  const detective = state.study.detective.current!;
  state = applyStudy(state, { area: 'detective', action: { type: 'book', session: detective.id, index: 0 } }, 3000);
  state = applyStudy(state, { area: 'book', id: 'pythagoras' });
  const restored = parseProgress(JSON.parse(JSON.stringify(state)));
  assert.equal(restored.study.exam.current!.work[1].input, '12');
  assert.equal(restored.study.detective.current!.work[detective.ids[0]].help, true);
  assert.equal(restored.study.detective.stats[detective.ids[0]].dueAt, 3000);
  assert.deepEqual(restored.study.favorites, ['pythagoras']); assert.equal(restored.attempts, 0);
  assert.equal(applyStudy(state, { area: 'book', id: 'unknown' }), state);
});
