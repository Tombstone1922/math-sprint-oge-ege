import type { Problem } from './engine.ts';
import { fmt, rounded, type DataTable, type PracticalBlock } from './practical-models.ts';
export type Question = { text: string; value: number | string; solution: string; skill: string; sequence?: boolean; table?: DataTable };
export function labelOrder(count: number, seed: number): string[] {
  const labels = Array.from({ length: count }, (_, i) => String(i + 1));
  let state = seed + 1979;
  for (let i = count - 1; i > 0; i--) { state = (Math.imul(state, 1664525) + 1013904223) >>> 0; const j = state % (i + 1); [labels[i], labels[j]] = [labels[j], labels[i]]; }
  return labels;
}
export function cards(block: PracticalBlock, questions: Question[], index: number): Problem[] {
  return questions.map((q, n) => ({ id: `${block.id}-q${n + 1}`, expression: `Вариант ${index + 1} · №${n + 1}. ${q.text}`, answer: typeof q.value === 'number' ? String(rounded(q.value, 6)) : q.value, answerDisplay: typeof q.value === 'number' ? fmt(q.value) : q.value, hint: q.solution, colorIndex: index % 20, practical: { block, number: n + 1, skill: q.skill, table: q.table }, ...(q.sequence ? { answerMode: 'sequence' as const } : {}) }));
}
