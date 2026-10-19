import { getProblemPool } from '../engine.ts';
import { extendedGroup } from '../extended/bank.ts';
import type { ModuleId } from '../content.ts';
import type { ExtendedNumber } from '../extended/model.ts';
import { practicalModules, secondGroups, type ExamRef } from './exam-bank.ts';

export const WEEKLY_COUNT = 10;
export const WEEKLY_VERSION = 1;
const DAY = 86400000, WEEK = DAY * 7, OFFSET = 4 * 3600000;
// A single fixed calendar for a teacher's whole class, regardless of device timezone.
const EPOCH = Date.UTC(2026, 0, 5) - OFFSET;
export type WeeklyLabel = { week: string; number: number; version: 1 };
export type WeeklyVariant = { id: string; label: WeeklyLabel; tasks: ExamRef[]; theme: string };
const themes: Record<string, string> = { 'oge-apartment': 'План квартиры', 'oge-plot': 'Земельный участок', 'oge-routes-grid': 'Маршруты по клеткам', 'oge-routes': 'Дороги и расстояния', 'oge-tyres': 'Автомобильные шины', 'oge-tariffs': 'Мобильная связь', 'oge-stoves': 'Печь для бани', 'oge-paper': 'Листы бумаги' };
const modulo = (n: number, length: number) => (n % length + length) % length;
export function weeklyPeriod(now = Date.now()) {
  const shifted = new Date(now + OFFSET);
  const start = Date.UTC(shifted.getUTCFullYear(), shifted.getUTCMonth(), shifted.getUTCDate()) - modulo(shifted.getUTCDay() - 1, 7) * DAY - OFFSET;
  return { week: new Date(start + OFFSET).toISOString().slice(0, 10), start, end: start + WEEK };
}
function startOfWeek(week: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(week)) return null;
  const ms = Date.parse(`${week}T00:00:00.000Z`);
  return Number.isFinite(ms) && new Date(ms).toISOString().slice(0, 10) === week && new Date(ms).getUTCDay() === 1 ? ms - OFFSET : null;
}
export function parseWeeklyLabel(value: unknown): WeeklyLabel | null {
  if (!value || typeof value !== 'object') return null;
  const v = value as WeeklyLabel;
  return v.version === WEEKLY_VERSION && typeof v.week === 'string' && startOfWeek(v.week) !== null && Number.isInteger(v.number) && v.number >= 1 && v.number <= WEEKLY_COUNT ? { week: v.week, number: v.number, version: WEEKLY_VERSION } : null;
}
export const weeklyId = (label: WeeklyLabel) => `oge-weekly-v${label.version}-${label.week}-${String(label.number).padStart(2, '0')}`;
export function weeklyDates(week: string) {
  const start = startOfWeek(week);
  if (start === null) return '';
  const format = (at: number) => new Date(at + OFFSET).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
  return `${format(start)} — ${format(start + 6 * DAY)}`;
}
export const weeklyTitle = (label: WeeklyLabel) => `Вариант ${label.number} · неделя ${label.week.split('-').reverse().join('.')}`;
// Stable PRNG and keyed permutations: never use Math.random or mutable progress for the catalogue.
function hash(key: string) { let h = 2166136261; for (let i = 0; i < key.length; i++) h = Math.imul(h ^ key.charCodeAt(i), 16777619); return h >>> 0; }
function shuffled<T>(items: readonly T[], key: string): T[] {
  const result = [...items]; let seed = hash(key);
  for (let i = result.length - 1; i > 0; i--) { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; const j = Math.floor(seed / 4294967296 * (i + 1)); [result[i], result[j]] = [result[j], result[i]]; }
  return result;
}
export function weeklyVariants(week: string): WeeklyVariant[] {
  const start = startOfWeek(week);
  if (start === null) return [];
  const cycle = Math.round((start - EPOCH) / WEEK), prefix = `weekly-v${WEEKLY_VERSION}`, key = `${prefix}:${week}`;
  const variants: WeeklyVariant[] = Array.from({ length: WEEKLY_COUNT }, (_, i) => {
    // All eight shared-input themes are represented; two rotate weekly.
    const moduleId = practicalModules[modulo(cycle + i, practicalModules.length)], pool = getProblemPool(moduleId);
    const blocks = shuffled(pool.filter(p => p.practical?.number === 1), `${prefix}:${moduleId}:blocks`);
    const withinTheme = Math.floor(i / practicalModules.length), first = blocks[modulo(cycle * 2 + Math.floor(cycle / 20) + withinTheme, blocks.length)];
    const tasks = pool.filter(p => p.practical?.block.id === first.practical!.block.id).sort((a, b) => a.practical!.number - b.practical!.number).map(p => ({ number: p.practical!.number, moduleId, group: Math.floor(pool.indexOf(p) / 20) + 1, problemId: p.id }));
    const label: WeeklyLabel = { week, number: i + 1, version: WEEKLY_VERSION };
    return { id: weeklyId(label), label, tasks, theme: themes[moduleId] };
  });
  for (let number = 6; number <= 25; number++) {
    const groups = shuffled(number <= 19 ? Array.from({ length: 10 }, (_, i) => i + 1) : secondGroups[number as ExtendedNumber], `${key}:${number}:groups`);
    const slots = shuffled(Array.from({ length: WEEKLY_COUNT }, (_, i) => i), `${key}:${number}:slots`);
    const occurrences = new Map<number, number>();
    for (let position = 0; position < WEEKLY_COUNT; position++) {
      const group = groups[position % groups.length], occurrence = occurrences.get(group) ?? 0;
      occurrences.set(group, occurrence + 1);
      const moduleId = `oge-${number}` as ModuleId;
      const pool = number <= 19 ? getProblemPool(moduleId).slice((group - 1) * 20, group * 20) : extendedGroup(number as ExtendedNumber, group);
      const ordered = shuffled(pool.map(p => p.id), `${prefix}:${number}:${group}:tasks`);
      // Consecutive disjoint positions per group/week; all 20 variants remain reachable.
      const stride = Math.ceil(WEEKLY_COUNT / groups.length);
      const problemId = ordered[modulo(cycle * stride + occurrence, ordered.length)];
      variants[slots[position]].tasks.push({ number, moduleId: number <= 19 ? moduleId : 'extended', group, problemId });
    }
  }
  return variants;
}
export const weeklyVariant = (week: string, number: number) => weeklyVariants(week).find(v => v.label.number === number);
