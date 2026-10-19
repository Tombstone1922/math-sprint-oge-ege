import type { ModuleId } from '../content.ts';
import { checkAnswer, getProblemPool } from '../engine.ts';
import { extendedTask } from '../extended/bank.ts';
import { makeExam, practicalModules, resolveExam, type ExamRef } from './exam-bank.ts';
import { parseWeeklyLabel, weeklyVariant, type WeeklyLabel } from './weekly.ts';
export { makeExam, practicalModules, resolveExam, type ExamRef } from './exam-bank.ts';

export const EXAM_DURATION = 235 * 60 * 1000;
export const EXAM_HISTORY_LIMIT = 10;
export type ExamWork = { input: string; draft: string; paper: boolean; flagged: boolean };
export type ExamSession = { id: string; startedAt: number; deadline: number | null; position: number; tasks: ExamRef[]; work: Record<string, ExamWork>; finishedAt?: number; expired?: boolean; points: Record<string, number>; weekly?: WeeklyLabel };
export type ExamState = { current: ExamSession | null; history: ExamSession[] };
export type ExamAction = { type: 'start'; timed: boolean; random?: () => number; weekly?: WeeklyLabel } | { type: 'select'; id: string; position: number } | { type: 'edit'; id: string; number: number; input?: string; draft?: string; paper?: boolean; flagged?: boolean } | { type: 'finish' | 'sync'; id: string } | { type: 'score'; id: string; number: number; points: number };
export const emptyExam = (): ExamState => ({ current: null, history: [] });
export const emptyExamWork = (): ExamWork => ({ input: '', draft: '', paper: false, flagged: false });
export function examResults(session: ExamSession) {
  const first = session.tasks.filter(t => t.number <= 19).map(ref => {
    const input = session.work[ref.number]?.input ?? '', p = resolveExam(ref)!;
    return { ref, input, correct: Boolean(input.trim()) && checkAnswer(input, p) };
  });
  const automatic = first.filter(r => r.correct).length, scored = session.tasks.filter(t => t.number >= 20 && session.points[t.number] !== undefined).length;
  const manual = Object.values(session.points).reduce((sum, value) => sum + value, 0);
  return { first, automatic, manual, scored, total: scored === 6 ? automatic + manual : null };
}
export const examRemaining = (session: ExamSession, now = Date.now()) => session.deadline === null ? null : Math.max(0, session.deadline - now);
export const examHasWork = (ref: ExamRef, work: ExamWork | undefined) => ref.number <= 19 ? Boolean(work?.input.trim()) : Boolean(work?.draft.trim() || work?.paper);
export function reduceExam(state: ExamState, action: ExamAction, now = Date.now()): ExamState {
  const current = state.current;
  if (current && !current.finishedAt && current.deadline !== null && now >= current.deadline) return { ...state, current: { ...current, finishedAt: current.deadline, expired: true } };
  if (action.type === 'start') {
    if (current && !current.finishedAt) return state;
    const weekly = action.weekly === undefined ? undefined : parseWeeklyLabel(action.weekly);
    if (action.weekly !== undefined && !weekly) return state;
    const tasks = weekly ? weeklyVariant(weekly.week, weekly.number)?.tasks.map(ref => ({ ...ref })) : makeExam(action.random);
    if (!tasks) return state;
    const history = current ? [current, ...state.history.filter(s => s.id !== current.id)].slice(0, EXAM_HISTORY_LIMIT) : state.history;
    return { history, current: { id: `exam-${now}-${Math.random().toString(36).slice(2)}`, startedAt: now, deadline: action.timed ? now + EXAM_DURATION : null, position: 0, tasks, work: {}, points: {}, ...(weekly ? { weekly } : {}) } };
  }
  if (action.type === 'score') {
    if (!Number.isInteger(action.points) || action.points < 0 || action.points > 2 || action.number < 20 || action.number > 25 || !Number.isInteger(action.number)) return state;
    const update = (s: ExamSession) => s.id !== action.id || !s.finishedAt || s.points[action.number] === action.points ? s : { ...s, points: { ...s.points, [action.number]: action.points } };
    const nextCurrent = current ? update(current) : null, history = state.history.map(update);
    return nextCurrent === current && history.every((s, i) => s === state.history[i]) ? state : { current: nextCurrent, history };
  }
  if (!current || current.id !== action.id || current.finishedAt) return state;
  if (action.type === 'finish') return { ...state, current: { ...current, finishedAt: now } };
  if (action.type === 'sync') return state;
  if (action.type === 'select') return Number.isInteger(action.position) && action.position >= 0 && action.position < 25 ? { ...state, current: { ...current, position: action.position } } : state;
  if (action.type !== 'edit' || action.number !== current.position + 1) return state;
  const before = current.work[action.number] ?? emptyExamWork(), isShort = action.number <= 19;
  const work = { ...before, input: isShort ? action.input?.slice(0, 64) ?? before.input : '', draft: !isShort ? action.draft?.slice(0, 6000) ?? before.draft : '', paper: !isShort && (action.paper ?? before.paper), flagged: action.flagged ?? before.flagged };
  return { ...state, current: { ...current, work: { ...current.work, [action.number]: work } } };
}
const obj = (v: unknown): Record<string, unknown> => v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : {};
export function parseExam(value: unknown): ExamState {
  const raw = obj(value), result = emptyExam();
  function session(value: unknown): ExamSession | null {
    const s = obj(value), tasks = s.tasks as ExamRef[];
    if (typeof s.id !== 'string' || s.id.length > 100 || typeof s.startedAt !== 'number' || !Number.isFinite(s.startedAt) || s.startedAt <= 0 || s.deadline !== null && s.deadline !== s.startedAt + EXAM_DURATION) return null;
    if (s.finishedAt !== undefined && (typeof s.finishedAt !== 'number' || !Number.isFinite(s.finishedAt) || s.finishedAt < s.startedAt || s.deadline !== null && s.finishedAt > (s.deadline as number))) return null;
    if (!Array.isArray(tasks) || tasks.length !== 25 || tasks.some((r, i) => {
      if (!r || r.number !== i + 1 || !Number.isInteger(r.group) || r.group < 1 || r.group > 10) return true;
      if (i >= 19) { const p = extendedTask(r.problemId); return r.moduleId !== 'extended' || p?.number !== r.number || p?.group !== r.group; }
      if (i < 5 && !practicalModules.includes(r.moduleId as ModuleId) || i >= 5 && r.moduleId !== `oge-${i + 1}`) return true;
      try { const pool = getProblemPool(r.moduleId as ModuleId), index = pool.findIndex(p => p.id === r.problemId); return index < 0 || Math.floor(index / 20) + 1 !== r.group || i < 5 && pool[index].practical?.number !== i + 1; } catch { return true; }
    })) return null;
    const first = resolveExam(tasks[0])?.practical?.block.id;
    if (!first || tasks.slice(0, 5).some(r => r.moduleId !== tasks[0].moduleId || resolveExam(r)?.practical?.block.id !== first)) return null;
    const work: Record<string, ExamWork> = {}, source = obj(s.work);
    for (const ref of tasks) {
      const w = obj(source[ref.number]);
      work[ref.number] = { input: ref.number <= 19 && typeof w.input === 'string' ? w.input.slice(0, 64) : '', draft: ref.number >= 20 && typeof w.draft === 'string' ? w.draft.slice(0, 6000) : '', paper: ref.number >= 20 && w.paper === true, flagged: w.flagged === true };
    }
    const points: Record<string, number> = {};
    if (s.finishedAt) for (let n = 20; n <= 25; n++) { const p = obj(s.points)[n]; if (typeof p === 'number' && Number.isInteger(p) && p >= 0 && p <= 2) points[n] = p; }
    return { id: s.id, startedAt: s.startedAt, deadline: s.deadline as number | null, position: typeof s.position === 'number' && Number.isInteger(s.position) && s.position >= 0 && s.position < 25 ? s.position : 0, tasks, work, points, ...(parseWeeklyLabel(s.weekly) ? { weekly: parseWeeklyLabel(s.weekly)! } : {}), ...(s.finishedAt ? { finishedAt: s.finishedAt as number, expired: s.expired === true } : {}) };
  }
  result.current = session(raw.current);
  if (Array.isArray(raw.history)) result.history = raw.history.map(session).filter((s): s is ExamSession => Boolean(s?.finishedAt) && s!.id !== result.current?.id).filter((s, i, all) => all.findIndex(p => p.id === s.id) === i).slice(0, EXAM_HISTORY_LIMIT);
  return result;
}
