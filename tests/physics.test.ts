import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { answerFor, physicsGroups, physicsTasks, scienceTask, seededRandom } from '../src/science/bank.ts';
import { conceptExample, conceptExamples, conceptTitles } from '../src/science/concepts.ts';
import { quantities, quantity, unit, units } from '../src/science/physics-units.ts';
import { emptyScience, parseScience, practiceOptions, reduceScience, sciencePending, type ScienceState } from '../src/science/state.ts';
import { createScienceWriter, loadScience, SCIENCE_KEY } from '../src/science/storage.ts';

// Parse the printed base-unit notation independently of each stored dimension vector.
function printedDimension(text: string): number[] {
  const tokens = text.replaceAll('²', '^2').replaceAll('³', '^3').match(/кг|м|с|А|К|\d+|[·/^()]/g)!; let pos = 0;
  const atoms: Record<string, number[]> = { кг: [1,0,0,0,0], м: [0,1,0,0,0], с: [0,0,1,0,0], А: [0,0,0,1,0], К: [0,0,0,0,1], '1': [0,0,0,0,0] };
  function factor(): number[] {
    const t = tokens[pos++]; let v: number[];
    if (t === '(') { v = expression(); assert.equal(tokens[pos++], ')'); } else { assert.ok(atoms[t], text); v = [...atoms[t]]; }
    if (tokens[pos] === '^') { pos++; const n = Number(tokens[pos++]); v = v.map(x => x * n); }
    return v;
  }
  function expression(): number[] { let v = factor(); while (tokens[pos] === '·' || tokens[pos] === '/') { const sign = tokens[pos++] === '·' ? 1 : -1, next = factor(); v = v.map((x, i) => x + sign * next[i]); } return v; }
  const result = expression(); assert.equal(pos, tokens.length, text); return result;
}
function fromRelation(q: typeof quantities[number]) {
  const result = [0,0,0,0,0];
  for (const [ids, sign] of [[q.relation.numerator, 1], [q.relation.denominator, -1]] as const) for (const id of ids) printedDimension(unit(id).base).forEach((n, i) => { result[i] += sign * n; });
  return result;
}

test('every printed SI unit and physical formula agrees with independent dimensional algebra', () => {
  for (const u of units) assert.deepEqual(printedDimension(u.base), [...u.dimension], u.id);
  for (const q of quantities) assert.deepEqual(fromRelation(q), [...unit(q.unit).dimension], q.title);
  assert.equal(unit('momentum').base, 'кг·м/с');
  assert.match(quantity('momentum').reason, /Н·с, а не Н\/с/);
  assert.equal(unit('specificHeat').symbol, 'Дж/(кг·К)');
  assert.equal(unit('heatCapacity').symbol, 'Дж/К');
});

test('200 tasks have one unambiguous solution, ten groups, stable backgrounds and substantive distinct conditions', () => {
  assert.equal(createHash('sha256').update(JSON.stringify({ physicsTasks, quantities, units, conceptExamples, conceptTitles })).digest('hex'), '2fdc3f94ba27da9de3d379597baa906b84e66cf4e1043471a5b14fe52ddaea2b', 'Published v1 IDs must keep their original task content');
  assert.equal(physicsGroups.length, 10); assert.equal(physicsTasks.length, 200);
  assert.equal(physicsTasks.filter(t => t.concepts).length, 20);
  assert.equal(new Set(physicsTasks.map(t => t.id)).size, 200);
  const seen = new Set<string>();
  for (const group of physicsGroups) assert.equal(physicsTasks.filter(t => t.group === group.number).length, 20);
  for (const t of physicsTasks) {
    assert.equal(t.targets.length, 3); assert.equal(t.options.length, 5); assert.equal(new Set(t.options).size, 5); assert.ok(t.colorIndex >= 0 && t.colorIndex < 20);
    const expected = t.targets.map(id => {
      const matches = t.options.flatMap((option, i) => t.concepts ? conceptExample(option).category === id ? [i+1] : [] : JSON.stringify(printedDimension(unit(option).base)) === JSON.stringify(fromRelation(quantity(id))) ? [i+1] : []);
      assert.equal(matches.length, 1, t.id); return matches[0];
    }).join('');
    assert.equal(answerFor(t), expected, t.id);
    const signature = t.concepts ? `concepts:${[...t.options].sort().join(',')}` : `${t.base}:${[...t.targets].sort().join(',')}`;
    assert.ok(!seen.has(signature), t.id); seen.add(signature);
    assert.equal(scienceTask(t.id), t);
  }
});
const start = (group = 1) => reduceScience(emptyScience(), { type: 'start', group, random: seededRandom(8) }, 1000);
function toPractice(s: ScienceState) {
  while (s.active?.phase === 'view') s = reduceScience(s, { type: 'view-next', session: s.active.id, task: s.active.ids[s.active.position] }, 1001);
  return s;
}
function submit(s: ScienceState, input?: string, now = 2000) {
  const a = s.active!, id = a.order[a.position];
  s = reduceScience(s, { type: 'input', session: a.id, task: id, value: input ?? answerFor(scienceTask(id)!, a.options[id]) }, now);
  return reduceScience(s, { type: 'submit', session: a.id, task: id }, now);
}

test('guided cards give no attempts; the same ten tasks are reordered with fresh option numbering and survive restore', () => {
  const initial = start(5), ids = initial.active!.ids;
  assert.equal(new Set(ids).size, 10); assert.ok(ids.every(id => scienceTask(id)!.group === 5));
  const p = toPractice(initial), a = p.active!;
  assert.deepEqual([...a.order].sort(), [...ids].sort()); assert.notDeepEqual(a.order, ids); assert.deepEqual(p.stats, {});
  for (const id of ids) {
    const task = scienceTask(id)!;
    assert.notEqual(answerFor(task, a.options[id]), answerFor(task));
    assert.deepEqual([...a.options[id]].sort(), [...task.options].sort());
    assert.equal(task.colorIndex, scienceTask(id)!.colorIndex);
  }
  assert.deepEqual(parseScience(JSON.parse(JSON.stringify(p))), p);
  const restored = parseScience(JSON.parse(JSON.stringify(submit(p)))); assert.equal(restored.stats[a.order[0]].independent, 1);
});

test('phase, stale-action and duplicate-submit guards prevent false results and count each checked answer once', () => {
  const initial = start(), a = initial.active!, task = a.ids[0];
  assert.equal(reduceScience(initial, { type: 'submit', session: a.id, task }, 1), initial);
  let p = toPractice(initial); const b = p.active!, id = b.order[0];
  assert.equal(reduceScience(p, { type: 'next', session: b.id, task: id }), p);
  for (const value of ['1234', '000', '678', '1 2', 'abc']) assert.equal(reduceScience(p, { type: 'input', session: b.id, task: id, value }), p);
  p = submit(p); const checked = p;
  assert.equal(reduceScience(p, { type: 'submit', session: b.id, task: id }), checked);
  assert.equal(reduceScience(p, { type: 'hint', session: b.id, task: id, level: 3 }), checked);
  assert.equal(p.stats[id].attempts, 1);
  p = reduceScience(p, { type: 'next', session: b.id, task: id });
  assert.equal(reduceScience(p, { type: 'next', session: b.id, task: id }), p);
  assert.equal(reduceScience(p, { type: 'submit', session: 'stale', task: p.active!.order[1] }), p);
});

test('help and partial mistakes enter repetition; correct after help is not independent', () => {
  let p = toPractice(start()), a = p.active!, id = a.order[0];
  p = reduceScience(p, { type: 'hint', session: a.id, task: id, level: 1 }, 2000);
  assert.equal(p.stats[id].attempts, 0); assert.equal(sciencePending(p, 2000).length, 1);
  p = submit(p); assert.equal(p.stats[id].correct, 1); assert.equal(p.stats[id].independent, 0); assert.equal(p.stats[id].assisted, 1);
  p = reduceScience(p, { type: 'next', session: a.id, task: id }); a = p.active!; id = a.order[a.position];
  const expected = answerFor(scienceTask(id)!, a.options[id]), wrong = (expected[0] === '1' ? '2' : '1') + expected.slice(1);
  p = submit(p, wrong); assert.equal(p.active!.work[id].matched, 2); assert.equal(p.stats[id].correct, 0); assert.equal(p.stats[id].dueAt, 2000);
});

test('one ordinary correct answer cannot erase an old error; three due reviews use the scheduled intervals', () => {
  let p = toPractice(start()), a = p.active!, id = a.order[0];
  p = { ...p, stats: { [id]: { attempts: 1, correct: 0, independent: 0, assisted: 0, dueAt: 100, streak: 0 } } };
  p = submit(p); assert.equal(p.stats[id].dueAt, 100); assert.equal(p.stats[id].streak, 0);
  p = reduceScience(p, { type: 'finish', session: a.id });
  let now = 3000;
  for (let pass = 1; pass <= 3; pass++) {
    p = reduceScience(p, { type: 'start', group: 1, review: true, random: seededRandom(pass) }, now); assert.equal(p.active!.phase, 'practice');
    p = submit(p, undefined, now); a = p.active!; assert.equal(p.stats[id].streak, pass);
    p = reduceScience(p, { type: 'finish', session: a.id });
    if (pass < 3) { const due = p.stats[id].dueAt!; assert.equal(due - now, pass === 1 ? 86400000 : 259200000); assert.equal(reduceScience(p, { type: 'start', group: 1, review: true }, due - 1), p); now = due; }
  }
  assert.equal(p.stats[id].dueAt, null); assert.equal(sciencePending(p).length, 0);
});

test('corrupt option orders are rejected and an invalid result cursor cannot skip unanswered tasks', () => {
  const p = toPractice(start());
  const raw = JSON.parse(JSON.stringify(p));raw.active.position = 10;raw.active.phase = 'result';
  const restored = parseScience(raw); assert.equal(restored.active!.position, 0); assert.equal(restored.active!.phase, 'practice');
  raw.active.options[raw.active.ids[0]][0] = 'unknown-unit';assert.equal(parseScience(raw).active, null);
  assert.throws(() => parseScience({ version: 2 }));
});

test('a complete physics round reaches a persisted result without counting the guided phase', () => {
  let p = toPractice(start(6)); const id = p.active!.id;
  for (let i = 0; i < 10; i++) { p = submit(p); p = reduceScience(p, { type: 'next', session: id, task: p.active!.order[p.active!.position] }); }
  assert.equal(p.active!.phase, 'result');assert.equal(Object.values(p.stats).reduce((n, s) => n + s.attempts, 0), 10);assert.deepEqual(parseScience(JSON.parse(JSON.stringify(p))), p);
});

test('physics storage serializes writes, recovers after failure and never touches the mathematical snapshot', async () => {
  const map = new Map([['math-sprint/progress/v2', 'keep math data']]);let fail = true;
  const storage = { getItem: async (key: string) => map.get(key) ?? null, setItem: async (key: string, value: string) => { assert.equal(key, SCIENCE_KEY);if (fail) { fail = false;throw Error('disk'); }map.set(key,value); } };
  assert.deepEqual(await loadScience(storage), emptyScience());const write = createScienceWriter(storage);
  await assert.rejects(write(start()));const p = toPractice(start(2));await write(p);assert.deepEqual(await loadScience(storage), p);assert.equal(map.get('math-sprint/progress/v2'), 'keep math data');
  map.set(SCIENCE_KEY, '{corrupt');await assert.rejects(loadScience(storage));assert.equal(map.get(SCIENCE_KEY), '{corrupt');
  let release!: () => void;const calls: string[] = [];
  const queued = createScienceWriter({ getItem: async () => null, setItem: async (_key, value) => { if (!calls.length) { calls.push(value);await new Promise<void>(resolve => { release = resolve; }); } else calls.push(value); } });
  const first = queued(emptyScience()), second = queued(p);await new Promise(resolve => setTimeout(resolve, 0));assert.equal(calls.length,1);release();await Promise.all([first, second]);assert.equal(calls.length,2);assert.deepEqual(parseScience(JSON.parse(calls[1])),p);
});
