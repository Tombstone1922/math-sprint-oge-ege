import type { Problem } from './engine.ts';

// 89 squares + 89 inverse roots, with 22 reinforcement tasks: ten groups of twenty.
export const squareRootGroups = Array.from({ length: 10 }, (_, group) => {
  const start = 11 + group * 9;
  return `Квадраты и корни · ${start}–${Math.min(start + 8, 99)}`;
});
export const squareRootPool: readonly Problem[] = Array.from({ length: 10 }, (_, group) => {
  const start = 11 + group * 9, end = Math.min(start + 8, 99);
  const tasks: Omit<Problem, 'id' | 'colorIndex'>[] = [];
  for (let n = start; n <= end; n++) {
    tasks.push({ expression: `${n}²`, answer: String(n * n), hint: `${n}² = ${n} × ${n} = ${n * n}` });
    tasks.push({ expression: `√${n * n}`, answer: String(n), hint: `${n}² = ${n * n}, поэтому √${n * n} = ${n}. Арифметический корень неотрицательный.` });
  }
  for (let n = start; tasks.length < 20; n++) {
    tasks.push({ expression: `${n} × ${n}`, answer: String(n * n), hint: `Это квадрат числа ${n}: ${n}² = ${n * n}.` });
    tasks.push({ expression: `Какое положительное число в квадрате равно ${n * n}?`, answer: String(n), hint: `${n} × ${n} = ${n * n}. Положительное число — ${n}.` });
  }
  return tasks.map((task, index) => ({ ...task, id: `squares-roots-${group * 20 + index + 1}`, colorIndex: index }));
}).flat();
