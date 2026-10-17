import assert from 'node:assert/strict';
import test from 'node:test';
import { modules } from '../src/content.ts';
import { getGroupProblems, getProblemPool } from '../src/engine.ts';
import { getHintSteps } from '../src/hints.ts';
import { accuracy, DAY, finishSession, initialProgress, mistakeKey, parseProgress, pendingMistakes, recordAttempt, recordHint, restoreReviewRound, type Attempt } from '../src/learning-progress.ts';
import { createProgressWriter, LEGACY_PROGRESS_KEY, loadProgress, PROGRESS_KEY } from '../src/learning-storage.ts';
const problem = getGroupProblems('mental-math', 1)[0];
const base: Attempt = { sessionId: 'first', moduleId: 'mental-math', group: 1, problemId: problem.id, correct: false, hintLevel: 0, mode: 'practice', at: 1000 };
const key = mistakeKey(base.moduleId, base.problemId);

test('a wrong answer persists immediately, before a round is completed', async () => {
  const state = recordAttempt(initialProgress(), base);
  assert.equal(state.completed, 0);
  assert.equal(state.attempts, 1);
  assert.equal(state.byModule['mental-math']?.byGroup[1].seen.length, 1);
  assert.equal(pendingMistakes(state, { dueOnly: true, now: base.at })[0].problemId, problem.id);
  const storage = new Map<string, string>();
  const adapter = { getItem: async (k: string) => storage.get(k) ?? null, setItem: async (k: string, v: string) => { storage.set(k, v); } };
  await createProgressWriter(adapter)(state);
  assert.deepEqual(await loadProgress(adapter), state);
});

test('a mistake requires three unaided spaced reviews, and early or ordinary correct answers do not skip stages', () => {
  let state = recordAttempt(initialProgress(), base);
  state = recordAttempt(state, { ...base, sessionId: 'r1', correct: true, mode: 'review' });
  assert.equal(state.mistakes[key].streak, 1);
  assert.equal(state.mistakes[key].dueAt, base.at + DAY);
  state = recordAttempt(state, { ...base, sessionId: 'too-early', correct: true, mode: 'review', at: base.at + DAY - 1 });
  assert.equal(state.mistakes[key].streak, 1);
  state = recordAttempt(state, { ...base, sessionId: 'ordinary', correct: true, at: base.at + DAY });
  assert.equal(state.mistakes[key].streak, 1);
  state = recordAttempt(state, { ...base, sessionId: 'r2', correct: true, mode: 'review', at: base.at + DAY });
  assert.equal(state.mistakes[key].streak, 2);
  assert.equal(state.mistakes[key].dueAt, base.at + 4 * DAY);
  assert.equal(pendingMistakes(state, { dueOnly: true, now: base.at + 4 * DAY - 1 }).length, 0);
  state = recordAttempt(state, { ...base, sessionId: 'r3', correct: true, mode: 'review', at: base.at + 4 * DAY });
  assert.equal(state.mistakes[key], undefined);
  assert.equal(state.reviewed, 1);
});

test('hints are durable without submission and assisted correct answers never count as independent', () => {
  let state = recordHint(initialProgress(), base);
  assert.equal(state.attempts, 0);
  assert.equal(state.hints, 1);
  assert.equal(state.mistakes[key].reason, 'hint');
  assert.strictEqual(recordHint(state, base), state);
  // Even a stale UI reporting level zero cannot undo the hint already recorded.
  state = recordAttempt(state, { ...base, correct: true });
  assert.equal(state.correct, 1);
  assert.equal(state.independent, 0);
  assert.equal(state.assisted, 1);
  assert.equal(state.mistakes[key].streak, 0);
  assert.equal(accuracy(state.independent, state.attempts), 0);
  assert.strictEqual(recordHint(state, base), state, 'viewing a solution after submitting does not rewrite the attempt');
});

test('a new mistake or hint resets a partially completed review schedule', () => {
  let state = recordAttempt(initialProgress(), base);
  state = recordAttempt(state, { ...base, sessionId: 'r1', correct: true, mode: 'review' });
  state = recordAttempt(state, { ...base, sessionId: 'wrong-again', mode: 'review', at: base.at + DAY });
  assert.equal(state.mistakes[key].streak, 0);
  assert.equal(state.mistakes[key].failures, 2);
  state = recordAttempt(state, { ...base, sessionId: 'r2', correct: true, mode: 'review', at: base.at + DAY });
  state = recordHint(state, { ...base, sessionId: 'needed-help', at: base.at + 2 * DAY });
  assert.equal(state.mistakes[key].streak, 0);
  assert.equal(state.mistakes[key].dueAt, base.at + 2 * DAY);
});

test('double taps cannot duplicate an answer or a completed round, and review scores never replace a ten-task record', () => {
  let state = recordAttempt(initialProgress(), { ...base, correct: true });
  assert.strictEqual(recordAttempt(state, { ...base, correct: true }), state);
  const session = { id: 'normal', moduleId: base.moduleId, group: 1, score: 8, total: 10, mode: 'practice' as const };
  state = finishSession(state, session);
  assert.strictEqual(finishSession(state, session), state);
  state = finishSession(state, { ...session, id: 'review', score: 1, total: 1, mode: 'review' });
  assert.equal(state.completed, 1);
  assert.equal(state.reviewSessions, 1);
  assert.equal(state.best, 8);
  assert.equal(state.byModule['mental-math']?.byGroup[1].best, 8);
  assert.strictEqual(finishSession(state, { ...session, id: 'bad', score: 10.5 }), state);
});

test('coverage counts unique tasks, keeps groups separate and supports all fourteen fraction groups', () => {
  let state = initialProgress();
  for (const p of getGroupProblems('mental-math', 1)) state = recordAttempt(state, { ...base, sessionId: p.id, problemId: p.id, correct: true });
  state = recordAttempt(state, { ...base, sessionId: 'repeat-same', correct: true });
  assert.equal(state.byModule['mental-math']?.byGroup[1].seen.length, 20);
  assert.equal(state.attempts, 21);
  const fraction = getGroupProblems('fraction-decimals', 14)[0];
  state = recordAttempt(state, { ...base, sessionId: 'fraction', moduleId: 'fraction-decimals', group: 14, problemId: fraction.id, correct: true });
  assert.equal(state.byModule['fraction-decimals']?.byGroup[14].seen.length, 1);
  assert.equal(state.byModule['mental-math']?.byGroup[2], undefined);
});

test('legacy scores migrate without invented accuracy, and malformed or obsolete task references are handled safely', () => {
  const old = { best: 9, completed: 3, lastScore: 6 };
  const migrated = parseProgress(old);
  assert.equal(migrated.best, 9);
  assert.equal(migrated.byModule['mental-math']?.completed, 3);
  assert.equal(migrated.attempts, 0);
  assert.equal(accuracy(migrated.correct, migrated.attempts), null);
  assert.deepEqual(parseProgress(JSON.parse(JSON.stringify(migrated))), migrated);
  const multiple = parseProgress({ ...old, byModule: { 'oge-9': old } });
  assert.equal(multiple.byModule['oge-9']?.best, 9);
  assert.equal(multiple.byModule['mental-math'], undefined);
  assert.throws(() => parseProgress({ version: 99 }));
  assert.equal(Object.keys(parseProgress({ version: 2, mistakes: { bad: { ...base, dueAt: 0, firstAt: 0, lastAt: 0, problemId: 'deleted' } } }).mistakes).length, 0);
  assert.strictEqual(recordAttempt(migrated, { ...base, problemId: 'unknown' }), migrated);
});

test('short review rounds preserve the complete shared context of individual OGE 1–5 questions', () => {
  const question = getGroupProblems('oge-tyres', 1)[3];
  const round = restoreReviewRound(question.id, 'oge-tyres', 1);
  assert.equal(round.length, 1);
  assert.strictEqual(round[0], question);
  assert.ok(round[0].practical?.block.text);
  assert.throws(() => restoreReviewRound('', 'oge-tyres', 1));
  assert.throws(() => restoreReviewRound(`${question.id},${question.id}`, 'oge-tyres', 1));
  assert.throws(() => restoreReviewRound(question.id, 'oge-tyres', 2));
  assert.throws(() => restoreReviewRound(getGroupProblems('oge-tyres', 1).slice(0, 11).map(p => p.id).join(','), 'oge-tyres', 1));
});

test('all task banks provide separate clue, first step and explicit worked answer', () => {
  for (const module of modules) for (const [i, p] of getProblemPool(module.id).entries()) {
    const steps = getHintSteps(p, module.id, Math.floor(i / 20) + 1);
    assert.ok(steps.clue.length > 15 && steps.firstStep.length > 20, p.id);
    assert.notEqual(steps.clue, steps.firstStep, p.id);
    assert.notEqual(steps.clue, p.hint, p.id);
    assert.notEqual(steps.firstStep, p.hint, p.id);
    assert.doesNotMatch(steps.clue + steps.firstStep, /Ответ:/, p.id);
    assert.ok(steps.solution.includes(p.hint) && steps.solution.includes(`Ответ: ${p.answerDisplay ?? p.answer}`), p.id);
  }
});

test('storage preserves snapshot order, recovers after a write failure and never writes during migration', async () => {
  const writes: string[] = [], release: (() => void)[] = [];
  const writer = createProgressWriter({ getItem: async () => null, setItem: async (_key, value) => { await new Promise<void>(resolve => release.push(resolve)); writes.push(value); } });
  const a = initialProgress(), b = recordAttempt(a, base);
  const first = writer(a), second = writer(b);
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(release.length, 1);
  release[0](); await first;
  await new Promise(resolve => setTimeout(resolve, 0));
  assert.equal(release.length, 2);
  release[1](); await second;
  assert.equal(JSON.parse(writes[1]).attempts, 1);
  let calls = 0;
  const recovering = createProgressWriter({ getItem: async () => null, setItem: async () => { if (++calls === 1) throw new Error('disk full'); } });
  await assert.rejects(recovering(a)); await recovering(b);
  assert.equal(calls, 2);
  const adapter = { getItem: async (k: string) => k === LEGACY_PROGRESS_KEY ? JSON.stringify({ completed: 4, best: 8, lastScore: 7 }) : null, setItem: async () => { throw new Error('must not write while loading'); } };
  assert.equal((await loadProgress(adapter)).completed, 4);
  await assert.rejects(loadProgress({ ...adapter, getItem: async (k: string) => k === PROGRESS_KEY ? '{broken' : null }));
});

test('conditional probability hints preserve whether the condition is B or its complement', () => {
  for (const p of getProblemPool('oge-10')) {
    if (p.chance?.kind !== 'tree') continue;
    const step = getHintSteps(p, 'oge-10', Number(p.id.split('-g')[1].split('-')[0])).firstStep;
    if (p.chance.event === 'AgivenNotB') assert.match(step, /условии «не B».*B не произошло/, p.id);
    else if (p.chance.event === 'AgivenB') assert.match(step, /условии B.*произошло B/, p.id);
    else assert.match(step, /пути, соответствующие событию из вопроса/, p.id);
  }
});
