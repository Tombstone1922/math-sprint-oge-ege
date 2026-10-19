import test from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { weeklyDates, weeklyId, weeklyPeriod, weeklyVariant, weeklyVariants, parseWeeklyLabel, WEEKLY_COUNT, type WeeklyLabel } from '../src/study/weekly.ts';
import { emptyExam, EXAM_DURATION, EXAM_HISTORY_LIMIT, examResults, parseExam, reduceExam, resolveExam } from '../src/study/exam.ts';
import { secondGroups } from '../src/study/exam-bank.ts';
import { extendedTask } from '../src/extended/bank.ts';
import type { ExtendedNumber } from '../src/extended/model.ts';
import { applyStudy } from '../src/study/integration.ts';
import { initialProgress, parseProgress } from '../src/learning-progress.ts';
import { createProgressWriter, loadProgress } from '../src/learning-storage.ts';
const MONDAY = Date.parse('2026-10-18T20:00:00.000Z'), WEEK = 7 * 86400000;
const label = (number = 1, week = '2026-10-19'): WeeklyLabel => ({ week, number, version: 1 });

test('Weekly calendar switches on Monday at 00:00 UTC+4, including year boundaries', () => {
  assert.equal(weeklyPeriod(MONDAY - 1).week, '2026-10-12');
  assert.deepEqual(weeklyPeriod(MONDAY), { week: '2026-10-19', start: MONDAY, end: MONDAY + WEEK });
  assert.equal(weeklyPeriod(MONDAY + WEEK - 1).week, '2026-10-19');
  assert.equal(weeklyPeriod(MONDAY + WEEK).week, '2026-10-26');
  assert.equal(weeklyPeriod(Date.parse('2027-01-01T12:00:00Z')).week, '2026-12-28');
  assert.equal(weeklyPeriod(Date.parse('2027-01-03T20:00:00Z')).week, '2027-01-04');
  assert.ok(weeklyDates('2026-12-28').includes('2026') && weeklyDates('2026-12-28').includes('2027'));
});
test('Exactly ten weekly variants each contain a full canonical 1–25 paper with one intact practical block', () => {
  const themes = new Set<string>(), all = new Set<string>(), variants = weeklyVariants('2026-10-19');
  assert.equal(variants.length, WEEKLY_COUNT);
  assert.deepEqual(variants.map(v => v.label.number), Array.from({ length: 10 }, (_, i) => i + 1));
  for (const variant of variants) {
    assert.equal(variant.tasks.length, 25); assert.equal(variant.id, weeklyId(variant.label));
    assert.deepEqual(variant.tasks.map(t => t.number), Array.from({ length: 25 }, (_, i) => i + 1));
    themes.add(variant.tasks[0].moduleId);
    const first = resolveExam(variant.tasks[0])!;
    for (const ref of variant.tasks) {
      assert.ok(!all.has(ref.problemId), `duplicate task ${ref.problemId}`); all.add(ref.problemId);
      if (ref.number <= 5) {
        const p = resolveExam(ref)!; assert.equal(p.practical!.number, ref.number); assert.equal(p.practical!.block.id, first.practical!.block.id); assert.equal(ref.moduleId, variant.tasks[0].moduleId);
      } else if (ref.number <= 19) { assert.ok(resolveExam(ref)); assert.equal(ref.moduleId, `oge-${ref.number}`); }
      else {
        const task = extendedTask(ref.problemId)!; assert.equal(task.number, ref.number); assert.equal(task.group, ref.group);
        assert.ok(secondGroups[task.number].includes(task.group)); assert.ok(task.steps.length >= 2);
      }
    }
  }
  assert.equal(themes.size, 8); assert.equal(all.size, 250);
  for (let number = 6; number <= 19; number++) assert.equal(new Set(variants.map(v => v.tasks[number - 1].group)).size, 10);
});
test('A hundred successive weeks remain unique and adjacent weekly sets do not reuse tasks', () => {
  let previous = new Set<string>();
  for (let week = 0; week < 100; week++) {
    const key = weeklyPeriod(MONDAY + week * WEEK).week, variants = weeklyVariants(key);
    const ids = variants.flatMap(v => v.tasks.map(t => t.problemId));
    assert.equal(ids.length, 250); assert.equal(new Set(ids).size, 250);
    assert.ok(ids.every(id => !previous.has(id)), `same task in adjacent week ${key}`);
    for (let number = 20; number <= 25; number++) {
      const counts = secondGroups[number as ExtendedNumber].map(g => variants.filter(v => v.tasks[number - 1].group === g).length);
      assert.ok(Math.max(...counts) - Math.min(...counts) <= 1);
    }
    previous = new Set(ids);
  }
});
test('Same week is deterministic in fresh processes and independent of device timezone', () => {
  const script = "import {weeklyVariants,weeklyPeriod} from './src/study/weekly.ts'; process.stdout.write(JSON.stringify(weeklyVariants(weeklyPeriod(1792411200000).week)))";
  const run = (tz: string) => execFileSync(process.execPath, ['--disable-warning=MODULE_TYPELESS_PACKAGE_JSON', '--experimental-strip-types', '--input-type=module', '-e', script], { cwd: process.cwd(), env: { ...process.env, TZ: tz }, encoding: 'utf8' });
  assert.equal(run('Pacific/Honolulu'), run('Asia/Tokyo'));
  assert.deepEqual(weeklyVariants('2026-10-19'), weeklyVariants('2026-10-19'));
  assert.equal(createHash('sha256').update(JSON.stringify(weeklyVariants('2026-10-19').map(v => v.tasks))).digest('hex'), 'ef59ad9f2f2770783a1e5978d3f57644e30e647ca5b518bce1512dd682a76d83', 'version 1 must not silently reshuffle an existing weekly set');
});
test('Long-term rotation reaches all variants in first-part groups and all selected second-part families', () => {
  const seen = new Map<string, Set<string>>();
  for (let week = 0; week < 120; week++) for (const variant of weeklyVariants(weeklyPeriod(MONDAY + week * WEEK).week)) for (const task of variant.tasks) {
    const key = task.moduleId === 'extended' ? `extended-${task.number}` : task.moduleId;
    const ids = seen.get(key) ?? new Set<string>(); ids.add(task.problemId); seen.set(key, ids);
  }
  for (const [key, ids] of seen) {
    const number = Number(key.replace('extended-', '')) as ExtendedNumber;
    assert.equal(ids.size, key.startsWith('extended-') ? secondGroups[number].length * 20 : 200, key);
  }
});
test('Starting a numbered paper snapshots its tasks and preserves answers across week rollover and restart', async () => {
  let state = applyStudy(initialProgress(), { area: 'exam', action: { type: 'start', timed: false, weekly: label(7) } }, MONDAY + 1000);
  const original = state.study.exam.current!, refs = weeklyVariant('2026-10-19', 7)!.tasks;
  assert.deepEqual(original.tasks, refs); assert.deepEqual(original.weekly, label(7));
  assert.notEqual(original.tasks, refs); assert.notEqual(original.tasks[0], refs[0]);
  state = applyStudy(state, { area: 'exam', action: { type: 'edit', id: original.id, number: 1, input: '123', flagged: true } }, MONDAY + 2000);
  state = applyStudy(state, { area: 'exam', action: { type: 'select', id: original.id, position: 23 } }, MONDAY + 2100);
  state = applyStudy(state, { area: 'exam', action: { type: 'edit', id: original.id, number: 24, draft: 'Доказательство из старой недели', paper: true } }, MONDAY + 2200);
  const storage = new Map<string, string>(), adapter = { getItem: async (k: string) => storage.get(k) ?? null, setItem: async (k: string, v: string) => { storage.set(k, v); } };
  await createProgressWriter(adapter)(state); state = await loadProgress(adapter);
  const old = state;
  state = applyStudy(state, { area: 'exam', action: { type: 'start', timed: false, weekly: label(1, '2026-10-26') } }, MONDAY + WEEK);
  assert.equal(state, old); assert.deepEqual(state.study.exam.current!.tasks, original.tasks);
  assert.equal(state.study.exam.current!.work[1].input, '123'); assert.equal(state.study.exam.current!.work[24].draft, 'Доказательство из старой недели');
  assert.deepEqual(state.study.exam.current!.weekly, label(7)); assert.equal(state.study.exam.current!.deadline, null);
});
test('All ten completed numbered variants remain accessible and manually scorable in history', () => {
  let state = emptyExam();
  for (let number = 1; number <= 10; number++) {
    state = reduceExam(state, { type: 'start', timed: false, weekly: label(number) }, MONDAY + number * 1000);
    state = reduceExam(state, { type: 'finish', id: state.current!.id }, MONDAY + number * 1000 + 100);
  }
  state = parseExam(JSON.parse(JSON.stringify(state)));
  const sessions = [state.current!, ...state.history];
  assert.equal(sessions.length, 10); assert.equal(EXAM_HISTORY_LIMIT, 10); assert.equal(new Set(sessions.map(s => s.weekly!.number)).size, 10);
  const first = sessions.find(s => s.weekly!.number === 1)!;
  state = reduceExam(state, { type: 'score', id: first.id, number: 24, points: 2 }, MONDAY + WEEK);
  assert.equal(state.history.find(s => s.id === first.id)!.points[24], 2);
  state = reduceExam(state, { type: 'start', timed: false, weekly: label(1, '2026-10-26') }, MONDAY + WEEK);
  assert.equal(state.history.length, 10); assert.equal(state.current!.weekly!.week, '2026-10-26');
});
test('Weekly scoring, timed expiry, error queues and random extras retain existing exam behavior', () => {
  let state = applyStudy(initialProgress(), { area: 'exam', action: { type: 'start', timed: true, weekly: label(2) } }, MONDAY);
  const e = state.study.exam.current!;
  state = applyStudy(state, { area: 'exam', action: { type: 'edit', id: e.id, number: 1, input: resolveExam(e.tasks[0])!.answer } }, MONDAY + 1000);
  state = applyStudy(state, { area: 'exam', action: { type: 'sync', id: e.id } }, MONDAY + EXAM_DURATION);
  assert.equal(state.study.exam.current!.expired, true); assert.equal(examResults(state.study.exam.current!).automatic, 1);
  assert.equal(Object.keys(state.mistakes).length, 18); assert.equal(state.attempts, 0);
  state = applyStudy(state, { area: 'exam', action: { type: 'score', id: e.id, number: 24, points: 0 } }, MONDAY + EXAM_DURATION + 1);
  assert.equal(state.extended.stats[e.tasks[23].problemId].attempts, 0);
  const weekly = weeklyVariants('2026-10-19');
  state = applyStudy(state, { area: 'exam', action: { type: 'start', timed: false } }, MONDAY + EXAM_DURATION + 2);
  assert.equal(state.study.exam.current!.weekly, undefined); assert.deepEqual(weeklyVariants('2026-10-19'), weekly);
});
test('Malformed weekly metadata cannot start a paper or erase valid legacy exam work', () => {
  const fresh = emptyExam();
  for (const value of [label(0), label(11), label(1, '2026-10-20'), label(1, '2026-02-30'), { ...label(), version: 99 }, { ...label(), week: null }, { ...label(), number: 1.5 }]) {
    assert.equal(parseWeeklyLabel(value), null); assert.equal(reduceExam(fresh, { type: 'start', timed: false, weekly: value as WeeklyLabel }, MONDAY), fresh);
  }
  let state = reduceExam(fresh, { type: 'start', timed: false }, MONDAY);
  const raw = JSON.parse(JSON.stringify(state)); raw.current.weekly = { ...label(), number: 999 };
  state = parseExam(raw); assert.ok(state.current); assert.equal(state.current!.weekly, undefined);
  assert.ok(parseProgress({ ...initialProgress(), study: { ...initialProgress().study, exam: state } }).study.exam.current);
  assert.deepEqual(weeklyVariants('not-a-date'), []); assert.equal(weeklyVariant('2026-10-19', 11), undefined);
});
