export type PhysicsCourseId = `physics-oge-${number}`;
export type PhysicsPlot = { kind: 'plot'; xLabel: string; yLabel: string; points: [number, number][]; xTicks: number[]; yTicks: number[]; caption: string };
export type PhysicsFigure = PhysicsPlot | { kind: 'scale'; min: number; max: number; divisions: number; reading: number; unit: string; instrument: string; start?: number; caption: string } | { kind: 'apparatus'; mode: 'friction' | 'spring' | 'density' | 'optics'; labels: string[]; caption: string } | { kind: 'rays'; focal: number; correct: number; caption: string } | { kind: 'meters'; caption: string } | { kind: 'circuit'; parallel: boolean; resistors: number[]; voltage?: number; unknown?: boolean | number[]; caption: string } | { kind: 'lens'; focal: number; distance: number; caption: string } | { kind: 'charges'; values: string[]; caption: string } | { kind: 'table'; headers: string[]; rows: string[][]; caption: string } | { kind: 'lever'; left: number; right: number; force: number; caption: string };
export type PhysicsOption = { id: string; text: string };
export type PhysicsTask = {
  id: string; number: number; group: number; colorIndex: number;
  kind: 'matching' | 'choice' | 'cloze' | 'number' | 'multi' | 'written'; prompt: string;
  targets: string[]; options: PhysicsOption[]; keys: string[]; value?: number; unit?: string;
  steps: string[]; hint: string; firstStep: string; sourceIds: number[]; category: number;
  figure?: PhysicsFigure; model?: { rule: string; values: number[] };
  fixedOptions?: boolean;
  passage?: { title: string; body: string };
  written?: { mode: 'experiment' | 'reading' | 'explanation' | 'calculation'; criteria: { title: string; detail: string }[] };
};
export type PhysicsGroup = { number: number; title: string; note: string };
export type PhysicsLessonPage = { title: string; text: string; example: string };
export type PhysicsCourse = { id: PhysicsCourseId; number: number; title: string; intro: string; groups: readonly PhysicsGroup[]; tasks: readonly PhysicsTask[]; lesson: readonly PhysicsLessonPage[]; sources: { category: number; title: string; examples: number[] }[] };
export const fmt = (n: number): string => String(Number(n.toFixed(6))).replace('.', ',').replace('-', '−');
export function rng(seed: number) { let n = seed >>> 0; return () => { n = (Math.imul(n, 1664525) + 1013904223) >>> 0; return n / 4294967296; }; }
export function shuffled<T>(values: readonly T[], random: () => number): T[] { const a = [...values]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
export const taskId = (number: number, group: number, index: number) => `physics${number}-v1-g${group}-${index + 1}`;
