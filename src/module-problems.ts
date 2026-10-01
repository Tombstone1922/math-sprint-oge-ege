import type { ModuleId } from './content.ts';
import type { Problem } from './engine.ts';
import { beginnerProblemPool } from './beginner-math.ts';
import { ogeAlgebraPools } from './oge-algebra.ts';
import { ogeGeometryPools } from './oge-geometry.ts';

type OtherModule = Exclude<ModuleId, 'mental-math'>;
type AddProblem = (expression: string, answer: string | number, hint: string) => void;

function collect(module: OtherModule, build: (add: AddProblem) => void): readonly Problem[] {
  const items: Omit<Problem, 'colorIndex'>[] = [];
  const expressions = new Set<string>();
  build((expression, answer, hint) => {
    if (expressions.has(expression)) throw new Error(`Duplicate problem: ${expression}`);
    expressions.add(expression);
    items.push({ id: `${module}-${items.length + 1}`, expression, answer: String(answer), hint });
  });
  if (items.length < 200) throw new Error(`Too few problems for ${module}: ${items.length}`);
  // A fixed shuffle spreads each problem type across the ten groups.
  let seed = 2026 + module.length * 7919;
  for (let i = items.length - 1; i > 0; i--) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const j = Math.floor(seed / 4294967296 * (i + 1));
    [items[i], items[j]] = [items[j], items[i]];
  }
  return items.slice(0, 200).map((item, index) => ({ ...item, colorIndex: index % 20 }));
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}
function fraction(numerator: number, denominator: number): string {
  const divisor = gcd(numerator, denominator);
  const top = numerator / divisor, bottom = denominator / divisor;
  return bottom === 1 ? String(top) : `${top}/${bottom}`;
}

const percent = collect('percent', add => {
  const rates = [5, 10, 15, 20, 25, 30, 40, 50, 60, 75];
  const bases = [40, 60, 80, 100, 120, 160, 200, 240, 300, 400, 500, 600, 800];
  for (const rate of rates) for (const base of bases) {
    add(`${rate}% от ${base}`, base * rate / 100, `${base} × ${rate} ÷ 100`);
  }
  for (const rate of [10, 20, 25, 50]) for (const base of [80, 100, 120, 200, 240, 300, 400, 500, 600, 800]) {
    add(`Цена ${base} ₽, скидка ${rate}%. Новая цена?`, base * (100 - rate) / 100, `${base} − ${base * rate / 100}`);
    add(`Цена ${base} ₽ выросла на ${rate}%. Новая цена?`, base * (100 + rate) / 100, `${base} + ${base * rate / 100}`);
  }
});

const fractions = collect('fractions', add => {
  for (const d of [3, 4, 5, 6, 8, 10, 12]) {
    for (let a = 1; a < d; a++) for (let b = 1; b < d; b++) {
      add(`${a}/${d} + ${b}/${d}`, fraction(a + b, d), `Сложи числители: ${a + b}/${d}; сократи дробь`);
      if (a > b) add(`${a}/${d} − ${b}/${d}`, fraction(a - b, d), `Вычти числители: ${a - b}/${d}; сократи дробь`);
    }
  }
  for (const d of [2, 3, 4, 5, 6, 8, 10]) for (const n of [24, 30, 40, 60, 80, 120]) {
    if (n % d !== 0) continue;
    for (const a of [1, 2, 3]) {
      if (a >= d) continue;
      add(`${a}/${d} от ${n}`, n / d * a, `${n} ÷ ${d} × ${a}`);
    }
  }
});

const equations = collect('equations', add => {
  for (const x of [4, 7, 9, 12, 15, 18, 21, 24, 27, 30, 36, 40]) for (const a of [3, 5, 8, 11, 14, 17]) {
    add(`x + ${a} = ${x + a}`, x, `Вычти ${a} из обеих частей`);
    if (x > a) add(`x − ${a} = ${x - a}`, x, `Прибавь ${a} к обеим частям`);
    add(`2x + ${a} = ${2 * x + a}`, x, `Вычти ${a}, затем раздели на 2`);
  }
  for (const k of [2, 3]) for (const x of [3, 5, 7, 9]) for (const a of [2, 4, 6]) {
    add(`${k}(x + ${a}) = ${k * (x + a)}`, x, `Раздели на ${k}, затем вычти ${a}`);
  }
});

const geometry = collect('geometry', add => {
  for (let a = 3; a <= 12; a++) for (let b = 2; b <= 9; b++) {
    add(`Прямоугольник ${a} × ${b}. Площадь?`, a * b, `S = ${a} × ${b}`);
    add(`Прямоугольник ${a} × ${b}. Периметр?`, 2 * (a + b), `P = 2 × (${a} + ${b})`);
  }
  for (const base of [4, 6, 8, 10, 12, 14]) for (let height = 3; height <= 10; height++) {
    add(`Треугольник: основание ${base}, высота ${height}. Площадь?`, base * height / 2, `S = ${base} × ${height} ÷ 2`);
  }
});

const powers = collect('powers', add => {
  for (let n = 2; n <= 50; n++) {
    add(`${n}²`, n * n, `${n} × ${n}`);
    add(`√${n * n}`, n, `${n}² = ${n * n}; корень неотрицательный`);
  }
  for (let n = 2; n <= 20; n++) add(`${n}³`, n ** 3, `${n} × ${n} × ${n}`);
  for (let n = 2; n <= 20; n++) for (let extra = 1; extra <= 8; extra++) {
    add(`${n}² + ${extra}`, n * n + extra, `Сначала ${n} × ${n}, затем прибавь ${extra}`);
  }
});

const probability = collect('probability', add => {
  for (let red = 1; red <= 15; red++) for (let blue = 1; blue <= 15; blue++) {
    const total = red + blue;
    add(`В мешке красных: ${red}, синих: ${blue}. P(красный)?`, fraction(red, total), `Подходящих ${red}, всего ${total}: ${red}/${total}`);
    add(`В мешке красных: ${red}, синих: ${blue}. P(синий)?`, fraction(blue, total), `Подходящих ${blue}, всего ${total}: ${blue}/${total}`);
  }
});

export const modulePools: Record<OtherModule, readonly Problem[]> = {
  'beginner-math': beginnerProblemPool, percent, fractions, equations, geometry, powers, probability, ...ogeGeometryPools, ...ogeAlgebraPools,
};
