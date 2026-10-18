import { modules, type ModuleId } from './content.ts';
import { getGroupProblems } from './engine.ts';

export const DAILY_TARGET_MS = 5 * 60 * 1000;
export type DailyTask = { moduleId: ModuleId; group: number; problemId: string; kind: 'warmup' | 'recall' | 'mistake' };
export type DailyAnswer = { input: string; correct: boolean; assisted: boolean; at: number };
export type DailySession = { id: string; day: string; startedAt: number; elapsedMs: number; tasks: DailyTask[]; answers: DailyAnswer[]; hints: number[]; finishedAt?: number };
export type DailyResult = { id: string; day: string; answered: number; independent: number; assisted: number; elapsedMs: number };
export type DailyState = { current: DailySession | null; history: DailyResult[] };
export const emptyDaily = (): DailyState => ({ current: null, history: [] });
export function localDay(now = Date.now()): string {
  const date = new Date(now);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export const dailyKey = (task: Pick<DailyTask, 'moduleId' | 'problemId'>) => `${task.moduleId}:${task.problemId}`;
export function resolveDailyTask(task: DailyTask) {
  try { return getGroupProblems(task.moduleId, task.group).find(p => p.id === task.problemId); } catch { return undefined; }
}
export function parseDaily(value: unknown): DailyState {
  const fresh = emptyDaily();
  if (!value || typeof value !== 'object') return fresh;
  const raw = value as DailyState;
  const count = (n: unknown) => typeof n === 'number' && Number.isSafeInteger(n) && n >= 0;
  const day = (s: unknown) => typeof s === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(s);
  if (Array.isArray(raw.history)) fresh.history = raw.history.filter(r => r && typeof r.id === 'string' && day(r.day) && [r.answered, r.independent, r.assisted, r.elapsedMs].every(count) && r.answered >= 1 && r.answered <= 8 && r.independent + r.assisted <= r.answered).slice(-60);
  const s = raw.current;
  if (!s || typeof s.id !== 'string' || !day(s.day) || !count(s.startedAt) || !count(s.elapsedMs) || s.finishedAt !== undefined && !count(s.finishedAt)) return fresh;
  if (!Array.isArray(s.tasks) || s.tasks.length !== 8 || !s.tasks.every(t => t && modules.some(m => m.id === t.moduleId) && ['warmup', 'recall', 'mistake'].includes(t.kind) && resolveDailyTask(t)) || new Set(s.tasks.map(dailyKey)).size !== s.tasks.length) return fresh;
  if (!Array.isArray(s.answers) || s.answers.length > s.tasks.length || !s.answers.every(a => a && typeof a.input === 'string' && a.input.length <= 64 && typeof a.correct === 'boolean' && typeof a.assisted === 'boolean' && count(a.at))) return fresh;
  fresh.current = { ...s, hints: s.tasks.map((_, i) => Math.max(0, Math.min(3, Number.isInteger(s.hints?.[i]) ? s.hints[i] : 0))) };
  return fresh;
}
