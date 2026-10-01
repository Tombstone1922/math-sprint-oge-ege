import type { FigureSpec, Problem } from './engine.ts';
import { triangleProblemPool } from './oge15-problems.ts';
import { circleProblemPool } from './oge16-problems.ts';
import { quadrilateralProblemPool } from './oge17-problems.ts';
import { gridProblemPool } from './oge18-problems.ts';

export type OgeGeometryId = 'oge-15' | 'oge-16' | 'oge-17' | 'oge-18' | 'oge-19';
type Add = (expression: string, answer: number, hint: string, figure: FigureSpec) => void;

function bank(id: OgeGeometryId, build: (add: Add) => void): readonly Problem[] {
  const items: Problem[] = [];
  const seen = new Set<string>();
  build((expression, answer, hint, figure) => {
    if (!Number.isFinite(answer) || seen.has(expression)) throw new Error(`Incorrect or duplicate task: ${expression}`);
    seen.add(expression);
    items.push({ id: `${id}-${items.length + 1}`, expression, answer: String(answer), hint, figure, colorIndex: 0 });
  });
  if (items.length < 200) throw new Error(`${id}: expected at least 200 tasks, got ${items.length}`);
  let seed = 2027 + Number(id.slice(-2));
  for (let i = items.length - 1; i > 0; i--) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const j = Math.floor(seed / 4294967296 * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items.slice(0, 200).map((item, index) => ({ ...item, colorIndex: index % 20 }));
}

const statements = bank('oge-19', add => {
  for (let a = 2; a <= 21; a++) for (let b = 3; b <= 12; b++) {
    const correct = (a + b) % 3 + 1;
    const area = a * b, diameter = 2 * a, angle = 130 - a - b;
    add(`Какое утверждение верно? Запиши его номер.\n1) Площадь прямоугольника ${a}×${b} равна ${area + Number(correct !== 1)}.\n2) Диаметр окружности радиуса ${a} равен ${diameter + Number(correct !== 2)}.\n3) Если углы треугольника ${a + 20}° и ${b + 30}°, то третий равен ${angle + Number(correct !== 3)}°.`, correct, `S=${area}; d=${diameter}; третий угол=${angle}°. Верно только утверждение ${correct}.`, { kind: 'claims' });
  }
});

export const ogeGeometryPools: Record<OgeGeometryId, readonly Problem[]> = {
  'oge-15': triangleProblemPool, 'oge-16': circleProblemPool, 'oge-17': quadrilateralProblemPool, 'oge-18': gridProblemPool, 'oge-19': statements,
};
