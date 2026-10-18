import { detectiveTask, detectiveTasks } from './detective-bank.ts';
export type DetectiveWork = { step?: number; found: boolean; choice?: number; done: boolean; wrong: boolean; help: boolean; stepError: boolean; choiceError: boolean };
export type DetectiveStat = { attempts: number; independent: number; assisted: number; dueAt: number | null; streak: number };
export type DetectiveSession = { id: string; group: number; review: boolean; ids: string[]; position: number; work: Record<string, DetectiveWork> };
export type DetectiveState = { current: DetectiveSession | null; stats: Record<string, DetectiveStat> };
export type DetectiveAction = { type: 'start'; group: number; review?: boolean; random?: () => number } | { type: 'step' | 'choice'; session: string; index: number; value: number } | { type: 'check-step' | 'check-choice' | 'help' | 'book' | 'next'; session: string; index: number } | { type: 'finish'; session: string };
export const emptyDetective = (): DetectiveState => ({ current: null, stats: {} });
export const emptyDetectiveWork = (): DetectiveWork => ({ found: false, done: false, wrong: false, help: false, stepError: false, choiceError: false });
const emptyStat = (): DetectiveStat => ({ attempts: 0, independent: 0, assisted: 0, dueAt: null, streak: 0 });
export const detectivePending = (state: DetectiveState, now?: number) => Object.entries(state.stats).filter(([id, s]) => detectiveTask(id) && s.dueAt !== null && (now === undefined || s.dueAt <= now));
export function reduceDetective(state: DetectiveState, a: DetectiveAction, now = Date.now()): DetectiveState {
  if (a.type === 'start') {
    if (state.current || !Number.isInteger(a.group) || a.group < 1 || a.group > 10) return state;
    let ids = detectiveTasks.filter(t => t.group === a.group && (!a.review || state.stats[t.id]?.dueAt !== null && (state.stats[t.id]?.dueAt ?? Infinity) <= now)).map(t => t.id);
    const random = a.random ?? Math.random;
    for (let i = ids.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [ids[i], ids[j]] = [ids[j], ids[i]]; }
    ids = ids.slice(0, 10); if (!ids.length) return state;
    return { ...state, current: { id: `detective-${now}-${Math.random().toString(36).slice(2)}`, group: a.group, review: Boolean(a.review), ids, position: 0, work: {} } };
  }
  const s = state.current;
  if (!s || s.id !== a.session) return state;
  if (a.type === 'finish') return { ...state, current: null };
  if (a.index !== s.position || s.position >= s.ids.length) return state;
  const id = s.ids[s.position], task = detectiveTask(id)!, before = s.work[id] ?? emptyDetectiveWork();
  if (a.type === 'next') return before.done ? { ...state, current: { ...s, position: s.position + 1 } } : state;
  if (before.done) return state;
  const work = { ...before }; let stats = state.stats;
  const queue = () => { stats = { ...stats, [id]: { ...(stats[id] ?? emptyStat()), streak: 0, dueAt: now } }; };
  const complete = () => {
    const old = stats[id] ?? emptyStat(), independent = !work.wrong && !work.help;
    let { dueAt, streak } = old;
    if (!independent) { dueAt = now; streak = 0; }
    else if (s.review && dueAt !== null && now >= dueAt) { streak++; dueAt = streak >= 3 ? null : now + (streak === 1 ? 86400000 : 3 * 86400000); }
    stats = { ...stats, [id]: { attempts: old.attempts + 1, independent: old.independent + Number(independent), assisted: old.assisted + Number(!independent), dueAt, streak } }; work.done = true;
  };
  if (a.type === 'step') {
    if (work.found || !Number.isInteger(a.value) || a.value < 0 || a.value >= task.steps.length) return state;
    work.step = a.value; work.stepError = false;
  } else if (a.type === 'check-step') {
    if (work.found || work.step === undefined) return state;
    if (work.step === task.badIndex) work.found = true;
    else { work.wrong = true; work.stepError = true; queue(); }
  } else if (a.type === 'choice') {
    if (!work.found || !Number.isInteger(a.value) || a.value < 0 || a.value >= task.choices.length) return state;
    work.choice = a.value; work.choiceError = false;
  } else if (a.type === 'check-choice') {
    if (!work.found || work.choice === undefined) return state;
    if (work.choice === task.correctChoice) complete();
    else { work.wrong = true; work.choiceError = true; queue(); }
  } else if (a.type === 'book') { work.help = true; queue(); }
  else if (a.type === 'help') { work.help = true; queue(); complete(); }
  return { stats, current: { ...s, work: { ...s.work, [id]: work } } };
}
const obj = (v: unknown): Record<string, unknown> => v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : {};
const count = (v: unknown) => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0 ? v : 0;
export function parseDetective(value: unknown): DetectiveState {
  const raw = obj(value), result = emptyDetective();
  for (const [id, value] of Object.entries(obj(raw.stats))) {
    if (!detectiveTask(id)) continue;
    const s = obj(value), independent = count(s.independent), assisted = count(s.assisted);
    result.stats[id] = { attempts: independent + assisted, independent, assisted, dueAt: s.dueAt === null ? null : count(s.dueAt), streak: Math.min(3, count(s.streak)) };
  }
  const s = obj(raw.current), ids = s.ids;
  if (typeof s.id !== 'string' || s.id.length > 100 || !Number.isInteger(s.group) || (s.group as number) < 1 || (s.group as number) > 10 || !Array.isArray(ids) || ids.length < 1 || ids.length > 10 || new Set(ids).size !== ids.length || ids.some(id => typeof id !== 'string' || detectiveTask(id)?.group !== s.group)) return result;
  const work: Record<string, DetectiveWork> = {};
  for (const id of ids as string[]) {
    const w = obj(obj(s.work)[id]), task = detectiveTask(id)!;
    const step = typeof w.step === 'number' && Number.isInteger(w.step) && w.step >= 0 && w.step < task.steps.length ? w.step : undefined;
    const choice = typeof w.choice === 'number' && Number.isInteger(w.choice) && w.choice >= 0 && w.choice < 3 ? w.choice : undefined;
    const help = w.help === true, found = w.found === true && step === task.badIndex, done = w.done === true && (help || found && choice === task.correctChoice);
    if (Object.keys(w).length) work[id] = { step, choice, found, done, wrong: w.wrong === true, help, stepError: w.stepError === true, choiceError: w.choiceError === true };
  }
  let position = Math.min(ids.length, count(s.position));
  const missed = ids.findIndex((id, i) => i < position && !work[id as string]?.done); if (missed >= 0) position = missed;
  result.current = { id: s.id, ids: ids as string[], group: s.group as number, review: s.review === true, position, work };
  return result;
}
