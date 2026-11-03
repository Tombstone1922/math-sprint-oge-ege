import { PHYSICS_COURSE, shuffle } from './bank.ts';
import { correctAnswer, physicsCorrect, physicsReady, validPhysicsInput, physicsCourse, physicsTask as scienceTask, taskCourse, type ScienceCourseId } from './courses.ts';
export type ScienceStat = { attempts: number; correct: number; independent: number; assisted: number; dueAt: number | null; streak: number; selfAttempts?: number; selfPoints?: number; selfMax?: number; selfFull?: number };
export type ScienceWork = { input: string; hint: number; submitted: boolean; correct: boolean; matched: number; draft?: string; opened?: boolean; criteria?: boolean[]; score?: number };
export type ScienceSession = { id: string; course: ScienceCourseId; group: number; mode: 'practice' | 'review'; phase: 'view' | 'practice' | 'result'; ids: string[]; order: string[]; options: Record<string, string[]>; position: number; work: Record<string, ScienceWork> };
export type ScienceState = { version: 1; active: ScienceSession | null; stats: Record<string, ScienceStat> };
export type ScienceAction = { type: 'start'; course?: ScienceCourseId; group: number; review?: boolean; random?: () => number } | { type: 'finish'; session: string } | { type: 'view-next' | 'next' | 'submit' | 'open-sample' | 'self-grade'; session: string; task: string } | { type: 'input'; session: string; task: string; value: string } | { type: 'hint'; session: string; task: string; level: number } | { type: 'draft'; session: string; task: string; value: string } | { type: 'criterion'; session: string; task: string; index: number; checked: boolean };
export const emptyScience = (): ScienceState => ({ version: 1, active: null, stats: {} });
export const emptyScienceWork = (): ScienceWork => ({ input: '', hint: 0, submitted: false, correct: false, matched: 0 });
const emptyStat = (): ScienceStat => ({ attempts: 0, correct: 0, independent: 0, assisted: 0, dueAt: null, streak: 0 });
export const sciencePending = (state: ScienceState, now?: number, course?: ScienceCourseId) => Object.entries(state.stats).filter(([id, s]) => scienceTask(id) && (!course || taskCourse(id)?.id === course) && s.dueAt !== null && (now === undefined || s.dueAt <= now)).sort((a, b) => a[1].dueAt! - b[1].dueAt!);
export function practiceOptions(id: string, random: () => number): string[] {
  const task = scienceTask(id)!, original = task.options.map(o => o.id);
  if (task.fixedOptions || original.length < 2) return original;
  const options = shuffle(original, random);
  return correctAnswer(task, options) !== correctAnswer(task) ? options : [...original.slice(1), original[0]];
}
export function reduceScience(state: ScienceState, action: ScienceAction, now = Date.now()): ScienceState {
  if (action.type === 'start') {
    if (state.active || !Number.isInteger(action.group) || action.group < 1 || action.group > 10) return state;
    const course = physicsCourse(action.course ?? PHYSICS_COURSE); if (!course) return state;
    const random = action.random ?? Math.random;
    const candidates = action.review ? sciencePending(state, now, course.id).map(([id]) => id) : course.tasks.filter(t => t.group === action.group).map(t => t.id);
    const ids = shuffle(candidates, random).slice(0, 10); if (!ids.length) return state;
    const order = shuffle(ids, random);
    if (ids.length > 1 && order.every((id, i) => id === ids[i])) order.push(order.shift()!);
    return { ...state, active: { id: `science-${now}-${Math.floor(random() * 1e9)}`, course: course.id, group: action.review ? 0 : action.group, mode: action.review ? 'review' : 'practice', phase: action.review ? 'practice' : 'view', ids, order, options: Object.fromEntries(ids.map(id => [id, practiceOptions(id, random)])), position: 0, work: {} } };
  }
  const active = state.active;
  if (!active || active.id !== action.session) return state;
  if (action.type === 'finish') return { ...state, active: null };
  const id = (active.phase === 'view' ? active.ids : active.order)[active.position];
  if (active.phase === 'result' || action.task !== id) return state;
  if (action.type === 'view-next') {
    if (active.phase !== 'view') return state;
    return { ...state, active: { ...active, ...(active.position + 1 < active.ids.length ? { position: active.position + 1 } : { phase: 'practice', position: 0 }) } };
  }
  if (active.phase !== 'practice') return state;
  const task = scienceTask(id)!;
  const before = active.work[id] ?? (task.kind === 'written' ? { ...emptyScienceWork(), draft: '', opened: false, criteria: task.written!.criteria.map(() => false) } : emptyScienceWork());
  if (action.type === 'next') return !before.submitted ? state : { ...state, active: { ...active, position: active.position + 1, phase: active.position + 1 === active.order.length ? 'result' : 'practice' } };
  if (before.submitted) return state;
  let work = before, stats = state.stats;
  if (action.type === 'draft') {
    if (task.kind !== 'written' || typeof action.value !== 'string' || action.value.length > 6000 || action.value === before.draft) return state;
    work = { ...before, draft: action.value, hint: before.opened ? Math.max(1, before.hint) : before.hint };
    if (before.opened) stats = { ...stats, [id]: { ...(stats[id] ?? emptyStat()), dueAt: now, streak: 0 } };
  } else if (action.type === 'open-sample') {
    if (task.kind !== 'written' || !before.draft?.trim() || before.opened) return state;
    work = { ...before, opened: true };
  } else if (action.type === 'criterion') {
    if (task.kind !== 'written' || !before.opened || !Number.isInteger(action.index) || action.index < 0 || action.index >= task.written!.criteria.length || typeof action.checked !== 'boolean') return state;
    const criteria = [...before.criteria!]; criteria[action.index] = action.checked; work = { ...before, criteria };
  } else if (action.type === 'self-grade') {
    if (task.kind !== 'written' || !before.opened || !before.draft?.trim() || before.criteria?.length !== task.written!.criteria.length) return state;
    const score = before.criteria.filter(Boolean).length, max = task.written!.criteria.length, correct = score === max;
    work = { ...before, score, correct, matched: score, submitted: true };
    const old = stats[id] ?? emptyStat(); let dueAt = old.dueAt, streak = old.streak;
    if (!correct || before.hint) { dueAt = now; streak = 0; }
    else if (active.mode === 'review' && dueAt !== null && dueAt <= now) { streak = Math.min(3, streak + 1); dueAt = streak === 3 ? null : now + (streak === 1 ? 86400000 : 259200000); }
    stats = { ...stats, [id]: { ...old, dueAt, streak, selfAttempts: (old.selfAttempts ?? 0) + 1, selfPoints: (old.selfPoints ?? 0) + score, selfMax: (old.selfMax ?? 0) + max, selfFull: (old.selfFull ?? 0) + Number(correct) } };
  } else if (action.type === 'input') {
    if (!validPhysicsInput(scienceTask(id)!, action.value) || action.value === before.input) return state;
    work = { ...before, input: action.value };
  } else if (action.type === 'hint') {
    if (!Number.isInteger(action.level) || action.level < 1 || action.level > 3 || action.level <= before.hint) return state;
    work = { ...before, hint: action.level }; stats = { ...stats, [id]: { ...(stats[id] ?? emptyStat()), dueAt: now, streak: 0 } };
  } else if (action.type === 'submit') {
    if (!physicsReady(scienceTask(id)!, before.input)) return state;
    const expected = correctAnswer(scienceTask(id)!, active.options[id]);
    const correct = physicsCorrect(scienceTask(id)!, before.input, active.options[id]), assisted = before.hint > 0;
    work = { ...before, submitted: true, correct, matched: task.kind === 'number' ? Number(correct) : task.kind === 'multi' ? [...before.input].filter(n => expected.includes(n)).length : [...expected].filter((n, i) => n === before.input[i]).length };
    const old = stats[id] ?? emptyStat(); let dueAt = old.dueAt, streak = old.streak;
    if (!correct || assisted) { dueAt = now; streak = 0; }
    else if (active.mode === 'review' && dueAt !== null && dueAt <= now) { streak = Math.min(3, streak + 1); dueAt = streak === 3 ? null : now + (streak === 1 ? 86400000 : 259200000); }
    stats = { ...stats, [id]: { attempts: old.attempts + 1, correct: old.correct + Number(correct), independent: old.independent + Number(correct && !assisted), assisted: old.assisted + Number(assisted), dueAt, streak } };
  } else return state;
  return { ...state, stats, active: { ...active, work: { ...active.work, [id]: work } } };
}
const obj = (v: unknown): Record<string, unknown> => v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : {};
const count = (v: unknown) => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0 ? v : 0;
export function parseScience(value: unknown): ScienceState {
  const raw = obj(value); if (raw.version !== 1) throw new Error('Unsupported physics progress version');
  const result = emptyScience();
  for (const [id, value] of Object.entries(obj(raw.stats))) {
    if (!scienceTask(id)) continue;
    const s = obj(value), attempts = count(s.attempts), correct = Math.min(attempts, count(s.correct));
    result.stats[id] = { attempts, correct, independent: Math.min(correct, count(s.independent)), assisted: Math.min(attempts, count(s.assisted)), dueAt: s.dueAt === null ? null : count(s.dueAt), streak: Math.min(3, count(s.streak)) };
    if (scienceTask(id)!.kind === 'written') {
      const selfAttempts = count(s.selfAttempts), selfMax = selfAttempts * scienceTask(id)!.written!.criteria.length;
      result.stats[id] = { attempts: 0, correct: 0, independent: 0, assisted: 0, dueAt: result.stats[id].dueAt, streak: result.stats[id].streak, ...(selfAttempts ? { selfAttempts, selfMax, selfPoints: Math.min(selfMax, count(s.selfPoints)), selfFull: Math.min(selfAttempts, count(s.selfFull)) } : {}) };
    }
  }
  if (!raw.active) return result;
  const a = obj(raw.active), ids = Array.isArray(a.ids) ? a.ids : [], order = Array.isArray(a.order) ? a.order : [];
  const review = a.mode === 'review', group = count(a.group), course = physicsCourse(a.course);
  if (typeof a.id !== 'string' || !a.id || a.id.length > 100 || !course || !['practice', 'review'].includes(a.mode as string) || !['view', 'practice', 'result'].includes(a.phase as string) || !ids.length || ids.length > 10 || (!review && ids.length !== 10) || new Set(ids).size !== ids.length || ids.some(id => typeof id !== 'string' || !scienceTask(id) || taskCourse(id)?.id !== course?.id || !review && scienceTask(id)?.group !== group) || !review && (group < 1 || group > 10) || review && (group !== 0 || a.phase === 'view') || order.length !== ids.length || new Set(order).size !== ids.length || order.some(id => !ids.includes(id))) return result;
  const options: Record<string, string[]> = {};
  for (const id of ids as string[]) {
    const supplied = obj(a.options)[id], expected = scienceTask(id)!.options.map(o => o.id);
    if (!Array.isArray(supplied) || supplied.length !== expected.length || new Set(supplied).size !== expected.length || supplied.some(v => typeof v !== 'string' || !expected.includes(v))) return result;
    if (scienceTask(id)!.fixedOptions && supplied.some((v, i) => v !== expected[i])) return result;
    options[id] = supplied as string[];
  }
  const active: ScienceSession = { id: a.id, course: course!.id, group, mode: review ? 'review' : 'practice', phase: a.phase as ScienceSession['phase'], ids: ids as string[], order: order as string[], options, position: Math.min(ids.length, count(a.position)), work: {} };
  if (active.phase !== 'view') for (const id of active.ids) {
    const w = obj(obj(a.work)[id]); if (!Object.keys(w).length) continue;
    const task = scienceTask(id)!;
    if (task.kind === 'written') {
      const draft = typeof w.draft === 'string' ? w.draft.slice(0, 6000) : '', opened = w.opened === true && Boolean(draft.trim());
      const criteria = task.written!.criteria.map((_, i) => Array.isArray(w.criteria) && w.criteria[i] === true), score = criteria.filter(Boolean).length, submitted = w.submitted === true && opened;
      active.work[id] = { input: '', hint: Math.min(3, count(w.hint)), draft, opened, criteria, submitted, correct: submitted && score === criteria.length, matched: submitted ? score : 0, ...(submitted ? { score } : {}) };
      continue;
    }
    const input = validPhysicsInput(scienceTask(id)!, w.input) ? w.input : '', hint = Math.min(3, count(w.hint)), submitted = w.submitted === true && physicsReady(scienceTask(id)!, input);
    const expected = correctAnswer(scienceTask(id)!, options[id]), correct = submitted && physicsCorrect(scienceTask(id)!, input, options[id]);
    active.work[id] = { input, hint, submitted, correct, matched: submitted ? task.kind === 'number' ? Number(correct) : task.kind === 'multi' ? [...input].filter(c => expected.includes(c)).length : [...expected].filter((c, i) => c === input[i]).length : 0 };
  }
  if (active.phase === 'view') active.position = Math.min(ids.length - 1, active.position);
  else {
    const missed = active.order.findIndex((id, i) => (i < active.position || active.phase === 'result') && !active.work[id]?.submitted);
    if (missed >= 0) { active.position = missed; active.phase = 'practice'; }
    else if (active.position === ids.length) active.phase = 'result';
  }
  result.active = active; return result;
}
export const scienceTotals = (state: ScienceState, group?: number, course?: ScienceCourseId) => Object.entries(state.stats).filter(([id]) => (group === undefined || scienceTask(id)?.group === group) && (!course || taskCourse(id)?.id === course)).reduce((out, [, s]) => ({ attempts: out.attempts + s.attempts, correct: out.correct + s.correct, independent: out.independent + s.independent, assisted: out.assisted + s.assisted, selfAttempts: out.selfAttempts + (s.selfAttempts ?? 0), selfPoints: out.selfPoints + (s.selfPoints ?? 0), selfMax: out.selfMax + (s.selfMax ?? 0), selfFull: out.selfFull + (s.selfFull ?? 0) }), { attempts: 0, correct: 0, independent: 0, assisted: 0, selfAttempts: 0, selfPoints: 0, selfMax: 0, selfFull: 0 });
