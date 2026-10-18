import { type ModuleId, modules } from './content.ts';
import { checkAnswer, getGroupProblems, getProblemPool, shuffleProblems } from './engine.ts';
import { dailyKey, localDay, resolveDailyTask, type DailySession, type DailyTask } from './daily-model.ts';
import { pendingMistakes, recordAttempt, recordHint, type LearningProgress } from './learning-progress.ts';

function dayRandom(day: string) {
  let seed = [...day].reduce((n, c) => (Math.imul(n, 31) + c.charCodeAt(0)) >>> 0, 2026);
  return () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296; };
}
export function makeDailyTasks(state: LearningProgress, now: number): DailyTask[] {
  const random = dayRandom(localDay(now)), used = new Set<string>(), tasks: DailyTask[] = [];
  const pending = pendingMistakes(state), due = pending.filter(m => m.dueAt <= now).slice(0, 2);
  const reserved = new Set(pending.map(dailyKey));
  function add(task: DailyTask) { const key = dailyKey(task); if (!used.has(key)) { used.add(key); tasks.push(task); } }
  function choose(moduleId: ModuleId, kind: 'warmup' | 'recall', onlySeen: boolean) {
    const pool = getProblemPool(moduleId);
    const candidates = pool.flatMap((p, i) => {
      const group = Math.floor(i / 20) + 1, task = { moduleId, group, problemId: p.id, kind };
      const seen = state.byModule[moduleId]?.byGroup[group]?.seen.includes(p.id);
      return !used.has(dailyKey(task)) && !reserved.has(dailyKey(task)) && (!onlySeen || seen) && !p.practical ? [task] : [];
    });
    const fallback = kind === 'warmup' && !candidates.length ? pool.flatMap((p, i) => {
      const task = { moduleId, group: Math.floor(i / 20) + 1, problemId: p.id, kind };
      return !used.has(dailyKey(task)) && !p.practical ? [task] : [];
    }) : [];
    const selected = shuffleProblems(candidates.length ? candidates : fallback, random)[0];
    if (selected) add(selected);
  }
  // Reserve due mistakes first, so a warm-up cannot silently consume a review.
  for (const m of due) add({ moduleId: m.moduleId, group: m.group, problemId: m.problemId, kind: 'mistake' });
  const math = state.byModule['mental-math'];
  const arithmetic = math && math.attempts >= 3 && math.independent / math.attempts >= .7 ? 'mental-math' : 'beginner-math';
  for (let i = 0; i < 3; i++) choose(arithmetic, 'warmup', false);
  const studied = shuffleProblems(modules.filter(m => !['mental-math', 'beginner-math'].includes(m.id) && Object.values(state.byModule[m.id]?.byGroup ?? {}).some(g => g.seen.length > 0) && !getProblemPool(m.id)[0]?.practical), random)
    .sort((a, b) => (state.byModule[a.id]!.independent / Math.max(1, state.byModule[a.id]!.attempts)) - (state.byModule[b.id]!.independent / Math.max(1, state.byModule[b.id]!.attempts)));
  for (const m of studied) { if (tasks.length >= 8) break; choose(m.id, 'recall', true); }
  const basics: ModuleId[] = ['fractions', 'percent', 'powers', 'beginner-math'];
  // New learners get introductory groups, without requiring a module choice.
  for (let i = 0; tasks.length < 8 && i < 40; i++) {
    const moduleId = basics[i % basics.length];
    const first = shuffleProblems(getGroupProblems(moduleId, 1), random).find(p => !used.has(`${moduleId}:${p.id}`) && !reserved.has(`${moduleId}:${p.id}`));
    if (first) add({ moduleId, group: 1, problemId: first.id, kind: 'recall' });
  }
  // Even an unusually large mistake queue must leave a usable eight-task plan.
  for (const p of getProblemPool('beginner-math')) {
    if (tasks.length >= 8) break;
    if (!reserved.has(`beginner-math:${p.id}`)) add({ moduleId: 'beginner-math', group: Math.floor(getProblemPool('beginner-math').indexOf(p) / 20) + 1, problemId: p.id, kind: 'recall' });
  }
  // A queue containing every arithmetic task still allows genuinely due tasks.
  for (const m of pending.filter(m => m.dueAt <= now)) { if (tasks.length >= 8) break; add({ ...m, kind: 'mistake' }); }
  for (const [i, p] of getProblemPool('beginner-math').entries()) {
    if (tasks.length >= 8) break;
    add({ moduleId: 'beginner-math', group: Math.floor(i / 20) + 1, problemId: p.id, kind: 'recall' });
  }
  return [...tasks.filter(t => t.kind === 'warmup'), ...tasks.filter(t => t.kind === 'recall'), ...tasks.filter(t => t.kind === 'mistake')].slice(0, 8);
}
export function startDaily(state: LearningProgress, now = Date.now()): LearningProgress {
  if (state.daily.current && !state.daily.current.finishedAt || state.daily.history.some(r => r.day === localDay(now))) return state;
  const tasks = makeDailyTasks(state, now);
  if (tasks.length !== 8) return state;
  const current: DailySession = { id: `daily-${now}-${Math.random().toString(36).slice(2)}`, day: localDay(now), startedAt: now, elapsedMs: 0, tasks, answers: [], hints: tasks.map(() => 0) };
  return { ...state, daily: { ...state.daily, current } };
}
export function answerDaily(state: LearningProgress, id: string, index: number, input: string, now = Date.now()): LearningProgress {
  const s = state.daily.current, task = s?.tasks[index];
  if (!s || s.id !== id || s.finishedAt || index !== s.answers.length || !task || !input || input.length > 64) return state;
  const problem = resolveDailyTask(task);
  if (!problem) return state;
  const correct = checkAnswer(input, problem), assisted = s.hints[index] > 0;
  const next = recordAttempt(state, { sessionId: s.id, ...task, correct, hintLevel: s.hints[index], mode: task.kind === 'mistake' ? 'review' : 'practice', at: now });
  return { ...next, daily: { ...next.daily, current: { ...s, answers: [...s.answers, { input, correct, assisted, at: now }] } } };
}
export function hintDaily(state: LearningProgress, id: string, index: number, level: number, now = Date.now()): LearningProgress {
  const s = state.daily.current, task = s?.tasks[index];
  if (!s || s.id !== id || s.finishedAt || index !== s.answers.length || !task || !Number.isInteger(level) || level < 1 || level > 3 || level <= s.hints[index]) return state;
  const next = recordHint(state, { sessionId: s.id, ...task, at: now });
  return { ...next, daily: { ...next.daily, current: { ...s, hints: s.hints.map((v, i) => i === index ? level : v) } } };
}
export function timeDaily(state: LearningProgress, id: string, elapsedMs: number): LearningProgress {
  const s = state.daily.current;
  if (!s || s.id !== id || s.finishedAt || !Number.isSafeInteger(elapsedMs) || elapsedMs <= s.elapsedMs) return state;
  return { ...state, daily: { ...state.daily, current: { ...s, elapsedMs } } };
}
export function finishDaily(state: LearningProgress, id: string, elapsedMs: number, now = Date.now()): LearningProgress {
  const updated = timeDaily(state, id, elapsedMs), s = updated.daily.current;
  if (!s || s.id !== id || s.finishedAt || !s.answers.length) return state;
  const result = { id: s.id, day: s.day, answered: s.answers.length, independent: s.answers.filter(a => a.correct && !a.assisted).length, assisted: s.answers.filter(a => a.correct && a.assisted).length, elapsedMs: s.elapsedMs };
  return { ...updated, daily: { current: { ...s, finishedAt: now }, history: [...updated.daily.history, result].slice(-60) } };
}
