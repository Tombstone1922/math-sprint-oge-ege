import type { Problem } from './engine.ts';
export const fractionDenominators = [2, 4, 8, 16, 5, 10, 3, 6, 7, 9, 11, 12, 13, 14, 15] as const;
export type FractionConversion = { numerator: number; denominator: number };

/** Exact decimal long division; repeated remainders identify the minimal period. */
export function decimalExpansion(numerator: number, denominator: number): string {
  if (!Number.isInteger(numerator) || !Number.isInteger(denominator) || numerator < 0 || denominator < 1) throw new Error('Invalid fraction');
  const whole = Math.floor(numerator / denominator);
  let remainder = numerator % denominator;
  if (!remainder) return String(whole);
  const positions = new Map<number, number>();
  let digits = '';
  while (remainder && !positions.has(remainder)) {
    positions.set(remainder, digits.length);
    remainder *= 10;
    digits += Math.floor(remainder / denominator);
    remainder %= denominator;
  }
  if (!remainder) return `${whole},${digits}`;
  const start = positions.get(remainder)!;
  return `${whole},${digits.slice(0, start)}(${digits.slice(start)})`;
}

/** Accept decimal notation only, comparing rational values with integer arithmetic. */
export function matchesDecimal(input: string, n: number, d: number): boolean {
  const raw = input.trim().replace('.', ',');
  if (raw.length > 64) return false;
  const match = /^(\d+)(?:,(\d*)(?:\((\d+)\))?)?$/.exec(raw);
  if (!match || raw.endsWith(',') || (raw.includes(',') && !match[2] && !match[3])) return false;
  const whole = BigInt(match[1]), prefix = match[2] ?? '', period = match[3];
  const scale = 10n ** BigInt(prefix.length);
  let top = whole * scale + BigInt(prefix || '0'), bottom = scale;
  if (period) {
    const cycle = 10n ** BigInt(period.length) - 1n;
    top = top * cycle + BigInt(period);
    bottom *= cycle;
  }
  return top * BigInt(d) === BigInt(n) * bottom;
}

export const fractionDecimalPool: readonly Problem[] = fractionDenominators.flatMap(d =>
  Array.from({ length: Math.floor(17 * d / 8) }, (_, i) => {
    const n = i + 1, decimal = decimalExpansion(n, d);
    return { id: `fraction-decimal-${n}-${d}`, expression: `Переведи дробь в десятичную.`, answer: `${n}/${d}`, answerDisplay: decimal, hint: `${n} ÷ ${d} = ${decimal}.${decimal.includes('(') ? ' В скобках записывается повторяющаяся часть — период.' : ' Делим числитель на знаменатель.'}`, colorIndex: 0, conversion: { numerator: n, denominator: d } };
  })
).map((p, i) => ({ ...p, colorIndex: i % 20 }));
export const fractionDecimalGroups = Array.from({ length: fractionDecimalPool.length / 20 }, (_, i) => {
  const denominators = [...new Set(fractionDecimalPool.slice(i * 20, i * 20 + 20).map(p => p.conversion!.denominator))];
  return `Знаменатели: ${denominators.join(', ')}`;
});
