import { emptyStudy, parseStudy, type StudyState } from './study/state.ts';
import { emptyExtended, parseExtended, type ExtendedState } from './extended/progress.ts';
import { emptyDaily, parseDaily, type DailyState } from './daily-model.ts';
import { modules, type ModuleId } from './content.ts';
import { getGroupProblems, type Problem } from './engine.ts';

export const DAY = 24 * 60 * 60 * 1000;
export const REVIEW_PASSES = 3;
export type TrainingMode = 'practice' | 'review';
export type Counters = { attempts: number; correct: number; independent: number; assisted: number; hints: number };
export type GroupProgress = Counters & { completed: number; best: number; lastScore: number; seen: string[] };
export type ModuleProgress = Counters & { completed: number; best: number; lastScore: number; byGroup: Record<string, GroupProgress> };
export type Mistake = { moduleId: ModuleId; problemId: string; group: number; firstAt: number; lastAt: number; dueAt: number; streak: number; failures: number; reason: 'wrong' | 'hint' };
export type LearningProgress = Counters & { version: 2; best: number; completed: number; lastScore: number; reviewSessions: number; reviewed: number; daily: DailyState; extended: ExtendedState; study: StudyState; byModule: Partial<Record<ModuleId, ModuleProgress>>; mistakes: Record<string, Mistake>; events: string[]; sessions: string[] };
export type Attempt = { sessionId: string; moduleId: ModuleId; group: number; problemId: string; correct: boolean; hintLevel: number; mode: TrainingMode; at: number };
export const emptyCounters = (): Counters => ({ attempts: 0, correct: 0, independent: 0, assisted: 0, hints: 0 });
export const emptyGroup = (): GroupProgress => ({ ...emptyCounters(), completed: 0, best: 0, lastScore: 0, seen: [] });
export const emptyModule = (): ModuleProgress => ({ ...emptyCounters(), completed: 0, best: 0, lastScore: 0, byGroup: {} });
export const initialProgress = (): LearningProgress => ({ ...emptyCounters(), version: 2, best: 0, completed: 0, lastScore: 0, reviewSessions: 0, reviewed: 0, daily: emptyDaily(), extended: emptyExtended(), study: emptyStudy(), byModule: {}, mistakes: {}, events: [], sessions: [] });
export const mistakeKey = (moduleId: ModuleId, problemId: string) => `${moduleId}:${problemId}`;
export const accuracy = (correct: number, attempts: number): number | null => attempts ? Math.round(correct / attempts * 100) : null;
export function findLearningProblem(moduleId: ModuleId, group: number, problemId: string): Problem | undefined {
  try { return getGroupProblems(moduleId, group).find(p => p.id === problemId); } catch { return undefined; }
}
const remember = (events: string[], id: string) => [...events, id].slice(-600);
const hintEvent = (a: Pick<Attempt, 'sessionId' | 'problemId'>) => `hint:${a.sessionId}:${a.problemId}`;
function needsWork(previous: Mistake | undefined, a: Pick<Attempt, 'moduleId' | 'problemId' | 'group' | 'at'>, wrong: boolean): Mistake {
  return { moduleId: a.moduleId, problemId: a.problemId, group: a.group, firstAt: previous?.firstAt ?? a.at, lastAt: a.at, dueAt: a.at, streak: 0, failures: (previous?.failures ?? 0) + Number(wrong), reason: wrong ? 'wrong' : 'hint' };
}
function updateCounters(state: LearningProgress, moduleId: ModuleId, group: number, change: Partial<Counters>, seen?: string): LearningProgress {
  const module = state.byModule[moduleId] ?? emptyModule(), before = module.byGroup[group] ?? emptyGroup();
  const bump = <T extends Counters>(value: T): T => ({ ...value, ...Object.fromEntries(Object.entries(change).map(([key, amount]) => [key, value[key as keyof Counters] + amount!])) });
  return { ...bump(state), byModule: { ...state.byModule, [moduleId]: { ...bump(module), byGroup: { ...module.byGroup, [group]: { ...bump(before), seen: seen && !before.seen.includes(seen) ? [...before.seen, seen] : before.seen } } } } };
}
export function recordHint(state: LearningProgress, a: Pick<Attempt, 'sessionId' | 'moduleId' | 'group' | 'problemId' | 'at'>): LearningProgress {
  const event = hintEvent(a);
  if (state.events.includes(event) || state.events.includes(`answer:${a.sessionId}:${a.problemId}`) || !findLearningProblem(a.moduleId, a.group, a.problemId)) return state;
  const key = mistakeKey(a.moduleId, a.problemId);
  const next = updateCounters(state, a.moduleId, a.group, { hints: 1 });
  return { ...next, events: remember(next.events, event), mistakes: { ...next.mistakes, [key]: needsWork(next.mistakes[key], a, false) } };
}
export function recordAttempt(state: LearningProgress, a: Attempt): LearningProgress {
  const event = `answer:${a.sessionId}:${a.problemId}`;
  if (state.events.includes(event) || !findLearningProblem(a.moduleId, a.group, a.problemId)) return state;
  const assisted = a.hintLevel > 0 || state.events.includes(hintEvent(a));
  const next = updateCounters(state, a.moduleId, a.group, { attempts: 1, correct: Number(a.correct), independent: Number(a.correct && !assisted), assisted: Number(assisted) }, a.problemId);
  const key = mistakeKey(a.moduleId, a.problemId), previous = state.mistakes[key], mistakes = { ...state.mistakes };
  let reviewed = state.reviewed;
  if (!a.correct || assisted) mistakes[key] = needsWork(previous, a, !a.correct);
  else if (previous && a.mode === 'review' && a.at >= previous.dueAt) {
    const streak = previous.streak + 1;
    if (streak >= REVIEW_PASSES) { delete mistakes[key]; reviewed++; }
    else mistakes[key] = { ...previous, streak, lastAt: a.at, dueAt: a.at + (streak === 1 ? DAY : 3 * DAY) };
  }
  return { ...next, reviewed, mistakes, events: remember(state.events, event) };
}
export function finishSession(state: LearningProgress, session: { id: string; moduleId: ModuleId; group: number; score: number; total: number; mode: TrainingMode }): LearningProgress {
  if (state.sessions.includes(session.id) || !Number.isInteger(session.total) || !Number.isInteger(session.score) || session.total < 1 || session.total > 10 || session.score < 0 || session.score > session.total) return state;
  const sessions = remember(state.sessions, session.id);
  if (session.mode === 'review') return { ...state, reviewSessions: state.reviewSessions + 1, sessions };
  if (session.total !== 10) return state;
  const module = state.byModule[session.moduleId] ?? emptyModule(), group = module.byGroup[session.group] ?? emptyGroup();
  const result = <T extends { best: number; completed: number; lastScore: number }>(before: T): T => ({ ...before, best: Math.max(before.best, session.score), completed: before.completed + 1, lastScore: session.score });
  return { ...result(state), sessions, byModule: { ...state.byModule, [session.moduleId]: { ...result(module), byGroup: { ...module.byGroup, [session.group]: result(group) } } } };
}
export function pendingMistakes(state: LearningProgress, options: { moduleId?: ModuleId; group?: number; dueOnly?: boolean; now?: number } = {}): Mistake[] {
  return Object.values(state.mistakes).filter(m => (!options.moduleId || m.moduleId === options.moduleId) && (!options.group || m.group === options.group) && (!options.dueOnly || m.dueAt <= (options.now ?? Date.now())) && findLearningProblem(m.moduleId, m.group, m.problemId))
    .sort((a, b) => a.dueAt - b.dueAt || a.firstAt - b.firstAt || a.problemId.localeCompare(b.problemId));
}
export function restoreReviewRound(ids: string, moduleId: ModuleId, group: number): Problem[] {
  const requested = ids.split(',');
  if (!requested.length || requested.length > 10 || new Set(requested).size !== requested.length) throw new Error('Invalid review');
  return requested.map(id => {
    const problem = findLearningProblem(moduleId, group, id);
    if (!problem) throw new Error('Unknown review problem');
    return problem;
  });
}

// Old records only contain scores; never invent per-answer accuracy during migration.
export function parseProgress(value: unknown): LearningProgress {
  const object = (v: unknown): Record<string, unknown> => v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : {};
  const raw = object(value), fresh = initialProgress();
  const count = (v: unknown) => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0 ? v : 0;
  const score = (v: unknown) => Math.min(10, count(v));
  const counters = (v: Record<string, unknown>): Counters => {
    const attempts = count(v.attempts), correct = Math.min(attempts, count(v.correct));
    return { attempts, correct, independent: Math.min(correct, count(v.independent)), assisted: Math.min(attempts, count(v.assisted)), hints: count(v.hints) };
  };
  const legacy = (v: Record<string, unknown>) => ({ best: score(v.best), completed: count(v.completed), lastScore: score(v.lastScore) });
  const isV2 = raw.version === 2;
  if (raw.version !== undefined && !isV2) throw new Error('Unsupported progress version');
  const byModule = { ...object(raw.byModule) };
  if (!Object.keys(byModule).length && count(raw.completed)) byModule['mental-math'] = legacy(raw);
  for (const module of modules) if (byModule[module.id]) {
    const before = object(byModule[module.id]), byGroup: Record<string, GroupProgress> = {};
    if (isV2) for (const [key, value] of Object.entries(object(before.byGroup))) {
      const g = Number(key), data = object(value);
      try {
        const validIds = new Set(getGroupProblems(module.id, g).map(p => p.id));
        byGroup[g] = { ...counters(data), ...legacy(data), seen: [...new Set(Array.isArray(data.seen) ? data.seen.filter((id): id is string => typeof id === 'string' && validIds.has(id)) : [])] };
      } catch { /* A removed or invalid group has no current coverage. */ }
    }
    fresh.byModule[module.id] = { ...(isV2 ? counters(before) : emptyCounters()), ...legacy(before), byGroup };
  }
  if (isV2) for (const value of Object.values(object(raw.mistakes))) {
    const m = object(value), moduleId = m.moduleId as ModuleId, group = count(m.group), problemId = m.problemId;
    if (!modules.some(module => module.id === moduleId) || typeof problemId !== 'string' || !findLearningProblem(moduleId, group, problemId)) continue;
    if (![m.firstAt, m.lastAt, m.dueAt].every(t => typeof t === 'number' && Number.isFinite(t) && t >= 0)) continue;
    fresh.mistakes[mistakeKey(moduleId, problemId)] = { moduleId, problemId, group, firstAt: m.firstAt as number, lastAt: m.lastAt as number, dueAt: m.dueAt as number, streak: Math.min(2, count(m.streak)), failures: count(m.failures), reason: m.reason === 'hint' ? 'hint' : 'wrong' };
  }
  const strings = (v: unknown) => Array.isArray(v) ? v.filter((s): s is string => typeof s === 'string').slice(-600) : [];
  return { ...fresh, daily: isV2 ? parseDaily(raw.daily) : emptyDaily(), extended: isV2 ? parseExtended(raw.extended) : emptyExtended(), study: isV2 ? parseStudy(raw.study) : emptyStudy(), ...legacy(raw), ...(isV2 ? counters(raw) : emptyCounters()), reviewSessions: isV2 ? count(raw.reviewSessions) : 0, reviewed: isV2 ? count(raw.reviewed) : 0, events: strings(raw.events), sessions: strings(raw.sessions) };
}
