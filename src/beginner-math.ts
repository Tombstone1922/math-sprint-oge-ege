import type { Problem } from './engine.ts';

export const beginnerGroups = ['Сложение до 5', 'Вычитание до 5', 'Сложение до 10', 'Вычитание до 10', 'Сложение до 15', 'Вычитание до 15', 'Сложение до 20', 'Вычитание до 20', 'Повторяем сложение', 'Повторяем вычитание'] as const;
type Candidate = { left: number; right: number; operation: '+' | '−' };
const pool: Problem[] = [];
const seen = new Set<string>();

function explanation({ left, right, operation }: Candidate, answer: number): string {
  if (operation === '+') {
    if (!left || !right) return `Прибавление нуля не меняет число: ${left} + ${right} = ${answer}.`;
    const big = Math.max(left, right), small = Math.min(left, right);
    if (answer <= 10) return `Начни с ${big} и прибавь ${small}: получится ${answer}.`;
    if (big >= 10) return `Отдели десяток: ${big} = 10 + ${big - 10}. Единицы: ${big - 10} + ${small} = ${answer - 10}. Вместе: 10 + ${answer - 10} = ${answer}.`;
    const toTen = 10 - big, rest = small - toTen;
    return `Разбей ${small} на ${toTen} и ${rest}. Сначала ${big} + ${toTen} = 10, затем 10 + ${rest} = ${answer}.`;
  }
  if (!right) return `Если ничего не убрать, число не изменится: ${left} − 0 = ${answer}.`;
  if (left === right) return `Убираем всё число: ${left} − ${right} = 0.`;
  if (left <= 10) return `От ${left} отсчитай назад ${right} шагов: получится ${answer}.`;
  const ones = left - 10;
  if (right <= ones) return `Оставь десяток и вычти из единиц: ${ones} − ${right} = ${ones - right}. Вместе: 10 + ${ones - right} = ${answer}.`;
  return `Разбей ${right} на ${ones} и ${right - ones}. Сначала ${left} − ${ones} = 10, затем 10 − ${right - ones} = ${answer}.`;
}

for (let group = 1; group <= 10; group++) {
  const operation = group % 2 ? '+' : '−';
  const candidates: Candidate[] = [];
  for (let left = 0; left <= 20; left++) for (let right = 0; right <= 20; right++) {
    const answer = operation === '+' ? left + right : left - right;
    if (answer < 0 || answer > 20 || (left === 0 && right === 0)) continue;
    const expression = `${left} ${operation} ${right}`;
    if (seen.has(expression)) continue;
    const fits = group === 1 ? answer <= 5
      : group === 2 ? left <= 5
      : group === 3 ? answer <= 10
      : group === 4 ? left <= 10
      : group === 5 ? answer > 10 && answer <= 15 && left <= 10 && right <= 10
      : group === 6 ? left > 10 && left <= 15 && right <= 5
      : group === 7 ? answer > 15 && left <= 12 && right <= 12
      : group === 8 ? left > 15 && right <= 5 : true;
    if (fits) candidates.push({ left, right, operation });
  }
  // Deterministic order keeps groups and card colors stable between app launches.
  let seed = 2718 + group;
  for (let i = candidates.length - 1; i > 0; i--) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    const j = Math.floor(seed / 4294967296 * (i + 1));
    [candidates[i], candidates[j]] = [candidates[j], candidates[i]];
  }
  if (candidates.length < 20) throw new Error(`Not enough beginner problems in group ${group}`);
  for (const [index, candidate] of candidates.slice(0, 20).entries()) {
    const { left, right, operation } = candidate;
    const expression = `${left} ${operation} ${right}`, answer = operation === '+' ? left + right : left - right;
    seen.add(expression);
    pool.push({ id: `beginner-math-g${group}-${index + 1}`, expression, answer: String(answer), hint: explanation(candidate, answer), colorIndex: index });
  }
}

export const beginnerProblemPool: readonly Problem[] = pool;
