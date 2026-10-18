import { extendedGroup, extendedTask } from './bank.ts';
import { extendedNumbers, numericAnswer, type ExtendedNumber } from './model.ts';

export type Rating = 'self' | 'help' | 'repeat';
export type Work = { draft: string; paper: boolean; input: string; hint: number; revealed: boolean; checks: number[]; wrong: boolean; checked?: boolean; rating?: Rating };
export type ExtendedStat = { attempts: number; self: number; help: number; repeat: number; streak: number; dueAt: number | null; lastAt: number };
export type ExtendedSession = { id: string; number: ExtendedNumber; group: number; mode: 'practice' | 'review'; ids: string[]; position: number; work: Record<string, Work> };
export type ExtendedState = { stats: Record<string, ExtendedStat>; active: ExtendedSession | null };
export type ExtendedAction =
  { type: 'start'; number: ExtendedNumber; group: number; review?: boolean; random?: () => number } |
  { type: 'edit'; session: string; index: number; draft?: string; input?: string; paper?: boolean } |
  { type: 'hint' | 'check' | 'reveal' | 'next'; session: string; index: number } |
  { type: 'tick'; session: string; index: number; item: number } |
  { type: 'rate'; session: string; index: number; rating: Rating } |
  { type: 'finish'; session: string };
const DAY = 86400000;
export const emptyExtended = (): ExtendedState => ({ stats: {}, active: null });
export const emptyWork = (): Work => ({ draft: '', paper: false, input: '', hint: 0, revealed: false, checks: [], wrong: false });
const emptyStat = (): ExtendedStat => ({ attempts: 0, self: 0, help: 0, repeat: 0, streak: 0, dueAt: null, lastAt: 0 });
export const extendedPending = (state: ExtendedState, now?: number) => Object.entries(state.stats).filter(([id, s]) => extendedTask(id) && s.dueAt !== null && (now === undefined || s.dueAt <= now)).sort((a, b) => a[1].dueAt! - b[1].dueAt!);
export function reduceExtended(state: ExtendedState, a: ExtendedAction, now = Date.now()): ExtendedState {
  if (a.type === 'start') {
    if (state.active || !extendedNumbers.includes(a.number) || !Number.isInteger(a.group) || a.group < 1 || a.group > 10) return state;
    let ids = extendedGroup(a.number, a.group).map(t => t.id);
    if (a.review) ids = ids.filter(id => state.stats[id]?.dueAt !== null && (state.stats[id]?.dueAt ?? Infinity) <= now);
    const random = a.random ?? Math.random;
    for (let i = ids.length - 1; i > 0; i--) { const j = Math.min(i, Math.max(0, Math.floor(random() * (i + 1)))); [ids[i], ids[j]] = [ids[j], ids[i]]; }
    ids = ids.slice(0, 10);
    if (!ids.length) return state;
    return { ...state, active: { id: `${now}-${Math.random().toString(36).slice(2)}`, number: a.number, group: a.group, mode: a.review ? 'review' : 'practice', ids, position: 0, work: {} } };
  }
  const active = state.active;
  if (!active || active.id !== a.session) return state;
  if (a.type === 'finish') return { ...state, active: null };
  if (a.index !== active.position || active.position >= active.ids.length) return state;
  const id = active.ids[active.position], task = extendedTask(id)!;
  const before = active.work[id] ?? emptyWork();
  if (a.type === 'next') return before.rating ? { ...state, active: { ...active, position: active.position + 1 } } : state;
  if (before.rating) return state;
  let work = { ...before }, stats = state.stats;
  const queue = () => { stats = { ...stats, [id]: { ...(stats[id] ?? emptyStat()), dueAt: now, streak: 0, lastAt: now } }; };
  if (a.type === 'edit') {
    if (before.revealed) return state;
    work = { ...work, draft: a.draft?.slice(0, 6000) ?? work.draft, input: a.input?.slice(0, 160) ?? work.input, paper: a.paper ?? work.paper, checked: a.input !== undefined ? undefined : work.checked };
  } else if (a.type === 'hint') {
    if (before.revealed || before.hint >= 2) return state;
    work.hint++; queue();
  } else if (a.type === 'check') {
    if (before.revealed || task.answerSpec?.kind !== 'numbers' || !before.input.trim()) return state;
    work.checked = numericAnswer(work.input, task.answerSpec) === true;
    if (!work.checked) { work.wrong = true; queue(); }
  } else if (a.type === 'reveal') {
    if (before.revealed || (!before.paper && !before.draft.trim())) return state;
    work.revealed = true;
  } else if (a.type === 'tick') {
    if (!before.revealed || !Number.isInteger(a.item) || a.item < 0 || a.item >= task.checklist.length) return state;
    work.checks = before.checks.includes(a.item) ? before.checks.filter(x => x !== a.item) : [...before.checks, a.item];
  } else if (a.type === 'rate') {
    if (!before.revealed || !['self', 'help', 'repeat'].includes(a.rating)) return state;
    if (a.rating !== 'repeat' && work.checks.length !== task.checklist.length) return state;
    if (a.rating === 'self' && (work.hint > 0 || work.wrong)) return state;
    work.rating = a.rating;
    const old = stats[id] ?? emptyStat();
    let dueAt = old.dueAt, streak = old.streak;
    if (a.rating !== 'self') { dueAt = now; streak = 0; }
    else if (active.mode === 'review' && dueAt !== null && now >= dueAt) { streak++; dueAt = streak >= 3 ? null : now + (streak === 1 ? DAY : 3 * DAY); }
    stats = { ...stats, [id]: { ...old, attempts: old.attempts + 1, [a.rating]: old[a.rating] + 1, lastAt: now, dueAt, streak } };
  }
  return { stats, active: { ...active, work: { ...active.work, [id]: work } } };
}
const object = (v: unknown): Record<string, unknown> => v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : {};
const count = (v: unknown) => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0 ? v : 0;
const time = (v: unknown) => typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : 0;
export function parseExtended(value: unknown): ExtendedState {
  const raw = object(value), result = emptyExtended();
  for (const [id, value] of Object.entries(object(raw.stats))) {
    if (!extendedTask(id)) continue;
    const s = object(value), self = count(s.self), help = count(s.help), repeat = count(s.repeat);
    result.stats[id] = { attempts: self + help + repeat, self, help, repeat, streak: Math.min(3, count(s.streak)), dueAt: s.dueAt === null ? null : time(s.dueAt), lastAt: time(s.lastAt) };
  }
  const a = object(raw.active), ids = Array.isArray(a.ids) ? a.ids : [];
  if (typeof a.id !== 'string' || !a.id || a.id.length > 100 || !extendedNumbers.includes(a.number as ExtendedNumber) || count(a.group) < 1 || count(a.group) > 10 || !ids.length || ids.length > 10 || new Set(ids).size !== ids.length || ids.some(id => typeof id !== 'string' || extendedTask(id)?.number !== a.number || extendedTask(id)?.group !== a.group)) return result;
  const active: ExtendedSession = { id: a.id, number: a.number as ExtendedNumber, group: a.group as number, mode: a.mode === 'review' ? 'review' : 'practice', ids: ids as string[], position: Math.min(ids.length, count(a.position)), work: {} };
  const work = object(a.work);
  for (const id of active.ids) {
    if (!(id in work)) continue;
    const w = object(work[id]), task = extendedTask(id)!;
    const checks = [...new Set(Array.isArray(w.checks) ? w.checks.filter((n): n is number => Number.isInteger(n) && typeof n === 'number' && n >= 0 && n < task.checklist.length) : [])];
    const revealed = w.revealed === true;
    const hint = Math.min(2, count(w.hint)), wrong = w.wrong === true;
    let rating = revealed && ['self', 'help', 'repeat'].includes(w.rating as string) ? w.rating as Rating : undefined;
    if (rating === 'self' && (hint > 0 || wrong)) rating = 'help';
    if (rating && rating !== 'repeat' && checks.length !== task.checklist.length) rating = undefined;
    active.work[id] = { draft: typeof w.draft === 'string' ? w.draft.slice(0, 6000) : '', input: typeof w.input === 'string' ? w.input.slice(0, 160) : '', paper: w.paper === true, revealed, checks, hint, wrong, checked: typeof w.checked === 'boolean' ? w.checked : undefined, rating };
  }
  // A corrupt cursor must not silently skip an unassessed task.
  const missed = active.ids.findIndex((id, i) => i < active.position && !active.work[id]?.rating);
  if (missed >= 0) active.position = missed;
  result.active = active;
  return result;
}
