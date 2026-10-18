import assert from 'node:assert/strict';
import test from 'node:test';
import { getGroupProblems } from '../src/engine.ts';
import { dailyKey, localDay, resolveDailyTask } from '../src/daily-model.ts';
import { answerDaily, finishDaily, hintDaily, makeDailyTasks, startDaily, timeDaily } from '../src/daily-training.ts';
import { DAY, finishSession, initialProgress, mistakeKey, parseProgress, recordAttempt } from '../src/learning-progress.ts';

const now = new Date(2026, 9, 18, 12).getTime();
test('daily plans are deterministic, varied, unique and usable without learning history', () => {
  const state = initialProgress(), tasks = makeDailyTasks(state, now);
  assert.deepEqual(tasks, makeDailyTasks(state, now));
  assert.equal(tasks.length, 8); assert.equal(new Set(tasks.map(dailyKey)).size, 8);
  assert.equal(tasks.filter(t => t.kind === 'warmup').length, 3);
  assert.ok(tasks.every(t => resolveDailyTask(t)));
  assert.ok(new Set(tasks.map(t => t.moduleId)).size >= 3);
  assert.notDeepEqual(tasks, makeDailyTasks(state, now + DAY));
  assert.equal(localDay(new Date(2026, 9, 18, 0, 1).getTime()), '2026-10-18');
});
test('daily warm-up adapts, known topics are preferred and only due mistakes are scheduled as reviews', () => {
  let state = initialProgress();
  for (const [i, p] of getGroupProblems('mental-math', 1).slice(0, 5).entries()) state = recordAttempt(state, { moduleId: 'mental-math', group: 1, problemId: p.id, sessionId: `m${i}`, mode: 'practice', correct: true, hintLevel: 0, at: now - DAY });
  const p = getGroupProblems('oge-13', 1)[0], q = getGroupProblems('oge-tyres', 1)[0];
  state = recordAttempt(state, { moduleId: 'oge-13', group: 1, problemId: p.id, sessionId: 'wrong', mode: 'practice', correct: false, hintLevel: 0, at: now - DAY });
  state = recordAttempt(state, { moduleId: 'oge-tyres', group: 1, problemId: q.id, sessionId: 'wrong-tyres', mode: 'practice', correct: false, hintLevel: 0, at: now - DAY });
  const future = getGroupProblems('percent', 1)[0];
  state = recordAttempt(state, { moduleId: 'percent', group: 1, problemId: future.id, sessionId: 'future', mode: 'practice', correct: false, hintLevel: 0, at: now });
  state = recordAttempt(state, { moduleId: 'percent', group: 1, problemId: future.id, sessionId: 'early', mode: 'review', correct: true, hintLevel: 0, at: now });
  const plan = makeDailyTasks(state, now);
  assert.ok(plan.filter(t => t.kind === 'warmup').every(t => t.moduleId === 'mental-math'));
  assert.deepEqual(new Set(plan.filter(t => t.kind === 'mistake').map(t => t.problemId)), new Set([p.id, q.id]));
  assert.ok(!plan.some(t => t.problemId === future.id));
  assert.ok(resolveDailyTask(plan.find(t => t.problemId === q.id)!)?.practical?.block.text);
});
test('daily hint, answers, time and plan survive serialization without duplicate attempts or scores', () => {
  let state = startDaily(initialProgress(), now), s = state.daily.current!;
  assert.strictEqual(startDaily(state, now), state);
  state = hintDaily(state, s.id, 0, 1, now);
  state = parseProgress(JSON.parse(JSON.stringify(state)));
  assert.equal(state.daily.current?.hints[0], 1);
  const p = resolveDailyTask(s.tasks[0])!;
  state = answerDaily(state, s.id, 0, p.answer, now);
  assert.equal(state.attempts, 1); assert.equal(state.independent, 0); assert.equal(state.assisted, 1);
  assert.strictEqual(answerDaily(state, s.id, 0, p.answer, now), state);
  assert.strictEqual(answerDaily(state, s.id, 2, p.answer, now), state);
  state = timeDaily(state, s.id, 11000);
  assert.strictEqual(timeDaily(state, s.id, 10000), state);
  state = parseProgress(JSON.parse(JSON.stringify(state)));
  assert.equal(state.daily.current!.answers.length, 1); assert.equal(state.daily.current!.elapsedMs, 11000);
  state = finishDaily(state, s.id, 14000, now);
  assert.equal(state.daily.history[0].answered, 1); assert.equal(state.daily.history[0].assisted, 1);
  assert.equal(state.completed, 0); assert.equal(state.best, 0); assert.equal(state.reviewSessions, 0);
  assert.strictEqual(finishDaily(state, s.id, 15000, now), state);
  assert.strictEqual(startDaily(state, now), state);
  assert.notEqual(startDaily(state, now + DAY).daily.current!.id, s.id);
});
test('daily due-mistake answers advance the same spaced schedule, and a single answer does not clear a mistake', () => {
  const p = getGroupProblems('equations', 1)[0], key = mistakeKey('equations', p.id);
  let state = recordAttempt(initialProgress(), { moduleId: 'equations', group: 1, problemId: p.id, sessionId: 'wrong', mode: 'practice', correct: false, hintLevel: 0, at: now });
  state = startDaily(state, now); const s = state.daily.current!;
  for (const [i, t] of s.tasks.entries()) state = answerDaily(state, s.id, i, resolveDailyTask(t)!.answer, now);
  assert.equal(state.mistakes[key].streak, 1); assert.equal(state.mistakes[key].dueAt, now + DAY);
  state = finishDaily(state, s.id, 300000, now);
  assert.equal(state.daily.history[0].independent, 8);
  assert.equal(state.byModule.equations?.best, 0);
});
test('previous-day unfinished sessions resume, migration initializes daily state, and malformed plans are discarded', () => {
  let state = startDaily(initialProgress(), now);
  assert.strictEqual(startDaily(state, now + DAY), state);
  assert.deepEqual(parseProgress({ completed: 3, best: 8 }).daily, { current: null, history: [] });
  assert.equal(parseProgress({ ...state, daily: { current: { ...state.daily.current, tasks: [{ problemId: 'bad' }] } } }).daily.current, null);
  state = finishSession(state, { id: 'normal', moduleId: 'mental-math', group: 1, score: 9, total: 10, mode: 'practice' });
  assert.equal(state.best, 9); assert.equal(state.daily.current?.answers.length, 0);
  assert.strictEqual(finishDaily(state, state.daily.current!.id, 300000, now), state, 'zero answers do not complete a day');
});

test('an entirely waiting arithmetic queue still permits a daily plan without early review credit', () => {
  const state = initialProgress();
  for (let group = 1; group <= 10; group++) for (const p of getGroupProblems('beginner-math', group)) {
    state.mistakes[mistakeKey('beginner-math', p.id)] = { moduleId: 'beginner-math', group, problemId: p.id, firstAt: now - DAY, lastAt: now, dueAt: now + DAY, streak: 1, failures: 1, reason: 'wrong' };
  }
  let next = startDaily(state, now), s = next.daily.current!;
  assert.equal(s.tasks.length, 8); assert.equal(s.tasks.filter(t => t.kind === 'warmup').length, 3);
  const t = s.tasks[0]; assert.equal(t.kind, 'warmup');
  next = answerDaily(next, s.id, 0, resolveDailyTask(t)!.answer, now);
  assert.equal(next.mistakes[dailyKey(t)].streak, 1);
  assert.equal(next.mistakes[dailyKey(t)].dueAt, now + DAY);
});
