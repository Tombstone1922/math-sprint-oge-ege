import type { ModuleId } from '../content.ts';
import { getProblemPool } from '../engine.ts';
import { extendedGroup } from '../extended/bank.ts';
import type { ExtendedNumber } from '../extended/model.ts';
export type ExamRef = { number: number; moduleId: ModuleId | 'extended'; group: number; problemId: string };

export const practicalModules: readonly ModuleId[] = ['oge-apartment', 'oge-plot', 'oge-routes-grid', 'oge-routes', 'oge-tyres', 'oge-tariffs', 'oge-stoves', 'oge-paper'];
// Selected training families keep the full variant varied; this is an authored mock, not an official KIM.
export const secondGroups: Record<ExtendedNumber, number[]> = { 20: [2, 3, 4, 6, 7, 8, 10], 21: [1, 2, 4, 8, 9, 10], 22: [5, 7, 8, 9, 10], 23: [1, 2, 4, 7, 9, 10], 24: [1, 3, 4, 6, 8, 9], 25: [1, 3, 4, 5, 7, 8, 10] };
export function makeExam(random: () => number = Math.random): ExamRef[] {
  const pick = <T>(items: readonly T[]): T => items[Math.min(items.length - 1, Math.max(0, Math.floor(random() * items.length)))];
  const moduleId = pick(practicalModules), pool = getProblemPool(moduleId), first = pick(pool.filter(p => p.practical?.number === 1));
  const block = pool.filter(p => p.practical?.block.id === first.practical!.block.id).sort((a, b) => a.practical!.number - b.practical!.number);
  const refs: ExamRef[] = block.map(p => ({ number: p.practical!.number, moduleId, group: Math.floor(pool.indexOf(p) / 20) + 1, problemId: p.id }));
  for (let number = 6; number <= 19; number++) {
    const moduleId = `oge-${number}` as ModuleId, pool = getProblemPool(moduleId);
    const p = pick(pool);
    refs.push({ number, moduleId, group: Math.floor(pool.indexOf(p) / 20) + 1, problemId: p.id });
  }
  for (let number = 20; number <= 25; number++) {
    const group = pick(secondGroups[number as ExtendedNumber]), p = pick(extendedGroup(number as ExtendedNumber, group));
    refs.push({ number, moduleId: 'extended', group, problemId: p.id });
  }
  return refs;
}
export function resolveExam(ref: ExamRef) { return ref.moduleId === 'extended' ? undefined : getProblemPool(ref.moduleId).find(p => p.id === ref.problemId); }
