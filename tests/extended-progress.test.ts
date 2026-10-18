import test from 'node:test';
import assert from 'node:assert/strict';
import { extendedTask } from '../src/extended/bank.ts';
import { emptyExtended, emptyWork, extendedPending, parseExtended, reduceExtended, type ExtendedState, type Rating } from '../src/extended/progress.ts';
import { initialProgress, parseProgress } from '../src/learning-progress.ts';
const DAY = 86400000;
function start(state = emptyExtended(), now = 1000, review = false) { return reduceExtended(state, { type: 'start', number: 24, group: 1, random: () => 0, review }, now); }
function command(state: ExtendedState, type: 'hint' | 'reveal' | 'next', now = 1000) { return reduceExtended(state, { type, session: state.active!.id, index: state.active!.position }, now); }
function prepared(state: ExtendedState) {
  const a = state.active!, index = a.position;
  state = reduceExtended(state, { type: 'edit', session: a.id, index, draft: 'Моё решение с обоснованием.' });
  state = command(state, 'reveal');
  for (let item = 0; item < extendedTask(a.ids[index])!.checklist.length; item++) state = reduceExtended(state, { type: 'tick', session: a.id, index, item });
  return state;
}
function rate(state: ExtendedState, rating: Rating, now = 1000) { return reduceExtended(state, { type: 'rate', session: state.active!.id, index: state.active!.position, rating }, now); }
const finish = (state: ExtendedState) => reduceExtended(state, { type: 'finish', session: state.active!.id });

test('Extended rounds sample ten unique problems, preserve unfinished work, require work before comparison', () => {
  let state = start(); const active = state.active!, id = active.ids[0];
  assert.equal(active.ids.length, 10); assert.equal(new Set(active.ids).size, 10);
  assert.ok(active.ids.every(id => extendedTask(id)?.number === 24 && extendedTask(id)?.group === 1));
  assert.equal(command(state, 'reveal'), state);
  assert.equal(command(state, 'next'), state);
  assert.equal(reduceExtended(state, { type: 'start', number: 20, group: 2 }), state);
  state = reduceExtended(state, { type: 'edit', session: active.id, index: 0, draft: 'Дано…\n∠MBC = ∠MDA', input: '1/4' });
  assert.deepEqual(JSON.parse(JSON.stringify(parseExtended(JSON.parse(JSON.stringify(state))))), JSON.parse(JSON.stringify(state)));
  state = prepared(state);
  assert.equal(reduceExtended(state, { type: 'edit', session: active.id, index: 0, draft: 'Изменить после образца' }), state);
  state = rate(state, 'self'); const once = state;
  state = rate(state, 'self'); assert.equal(state, once);
  assert.equal(state.stats[id].attempts, 1); assert.equal(state.stats[id].self, 1);
  state = command(state, 'next'); assert.equal(state.active!.position, 1);
});
test('Hints persist before finishing, bar independent rating and enter spaced review immediately', () => {
  let state = start(), id = state.active!.ids[0];
  state = command(state, 'hint', 1000);
  assert.equal(state.stats[id].attempts, 0); assert.equal(extendedPending(state, 1000).length, 1);
  state = parseExtended(JSON.parse(JSON.stringify(state)));
  state = prepared(state);
  assert.equal(rate(state, 'self'), state);
  state = rate(state, 'help'); assert.equal(state.stats[id].help, 1);
  state = finish(state);
  const independentReview = (s: ExtendedState, at: number) => finish(rate(prepared(start(s, at, true)), 'self', at));
  state = independentReview(state, 2000); assert.equal(state.stats[id].streak, 1); assert.equal(state.stats[id].dueAt, 2000 + DAY);
  assert.equal(start(state, 2000 + DAY - 1, true), state);
  state = independentReview(state, 2000 + DAY); assert.equal(state.stats[id].streak, 2); assert.equal(state.stats[id].dueAt, 2000 + 4 * DAY);
  state = independentReview(state, 2000 + 4 * DAY); assert.equal(state.stats[id].streak, 3); assert.equal(state.stats[id].dueAt, null); assert.equal(extendedPending(state).length, 0);
});
test('A hint during review resets spacing; ordinary practice cannot erase a pending proof', () => {
  let state = rate(prepared(start()), 'repeat'), id = state.active!.ids[0];
  state = finish(state); state = rate(prepared(start(state, 2000, true)), 'self', 2000); state = finish(state);
  const due = state.stats[id].dueAt;
  state = rate(prepared(start(state, 3000)), 'self', 3000);
  assert.equal(state.active!.ids[0], id); assert.equal(state.stats[id].dueAt, due); assert.equal(state.stats[id].streak, 1);
  state = finish(state); state = start(state, due!, true); state = command(state, 'hint', due!);
  assert.equal(state.stats[id].streak, 0); assert.equal(state.stats[id].dueAt, due);
});
test('Only the numeric result is checked; wrong attempts persist, no automatic proof score', () => {
  let state = reduceExtended(emptyExtended(), { type: 'start', number: 20, group: 1, random: () => 0 }, 1000), a = state.active!, id = a.ids[0], task = extendedTask(id)!;
  state = reduceExtended(state, { type: 'edit', session: a.id, index: 0, input: '99999' });
  state = reduceExtended(state, { type: 'check', session: a.id, index: 0 }, 1000);
  assert.equal(state.active!.work[id].wrong, true); assert.equal(state.stats[id].attempts, 0);
  state = reduceExtended(state, { type: 'edit', session: a.id, index: 0, input: task.answer });
  state = reduceExtended(state, { type: 'check', session: a.id, index: 0 });
  assert.equal(state.active!.work[id].checked, true); assert.equal(state.active!.work[id].wrong, true);
  state = prepared(state); assert.equal(rate(state, 'self'), state);
  state = rate(state, 'help'); assert.equal(state.stats[id].self, 0);
});
test('Assessment requires the checklist; paper is allowed; stale actions cannot edit the next task', () => {
  let state = start(), a = state.active!;
  state = reduceExtended(state, { type: 'edit', session: a.id, index: 0, paper: true });
  state = command(state, 'reveal'); assert.equal(state.active!.work[a.ids[0]].revealed, true);
  assert.equal(rate(state, 'self'), state); assert.equal(rate(state, 'help'), state);
  state = rate(state, 'repeat'); state = command(state, 'next');
  assert.equal(reduceExtended(state, { type: 'edit', session: a.id, index: 0, draft: 'stale' }), state);
  assert.equal(reduceExtended(state, { type: 'finish', session: 'wrong-session' }), state);
});
test('Migration preserves first-part counters and adds separate self-assessment state', () => {
  const old = initialProgress(); const { extended: _extended, ...legacyV2 } = old;
  const parsed = parseProgress({ ...legacyV2, attempts: 10, correct: 8, independent: 7 });
  assert.deepEqual(parsed.extended, emptyExtended()); assert.equal(parsed.independent, 7);
  parsed.extended = rate(prepared(start()), 'self');
  const restored = parseProgress(JSON.parse(JSON.stringify(parsed)));
  assert.deepEqual(JSON.parse(JSON.stringify(restored)), JSON.parse(JSON.stringify(parsed))); assert.equal(restored.attempts, 10); assert.equal(restored.correct, 8);
  assert.deepEqual(parseProgress({ best: 5, completed: 3 }).extended, emptyExtended());
});
test('Malformed saved cursors and tasks are bounded, without deleting valid earlier progress', () => {
  let state = prepared(start()); const a = state.active!, id = a.ids[0];
  const restored = parseExtended({ ...state, active: { ...a, position: 100, work: { [id]: { ...emptyWork(), draft: 'x'.repeat(9000), hint: 99, revealed: true, rating: 'self', checks: [0, 1, 2, 99, '0'] } } } });
  assert.equal(restored.active!.position, 1); assert.equal(restored.active!.work[id].draft.length, 6000); assert.equal(restored.active!.work[id].hint, 2); assert.equal(restored.active!.work[id].rating, 'help');
  assert.equal(parseExtended({ active: { ...a, ids: ['unknown'] } }).active, null);
  const fresh = emptyExtended();
  assert.equal(reduceExtended(fresh, { type: 'start', number: 20, group: 999 }), fresh);
});
