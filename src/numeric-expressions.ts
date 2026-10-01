export type MathExpr = { kind: 'mixed'; whole: number; numerator: number; denominator: number } | { kind: 'number'; value: number } | { kind: 'variable'; name: string } | { kind: 'sqrt'; arg: MathExpr } | { kind: 'power'; base: MathExpr; exponent: number } | { kind: 'add' | 'subtract' | 'multiply' | 'divide'; left: MathExpr; right: MathExpr };
export type NumericTask = { formula: MathExpr; variables?: Record<string, number>; target?: 'numerator' | 'scaledNumerator'; denominator?: number; choices?: MathExpr[] };
export const num = (value: number): MathExpr => ({ kind: 'number', value });
export const variable = (name: string): MathExpr => ({ kind: 'variable', name });
export const sqrt = (arg: MathExpr): MathExpr => ({ kind: 'sqrt', arg });
export const power = (base: MathExpr, exponent: number): MathExpr => ({ kind: 'power', base, exponent });
export const add = (left: MathExpr, right: MathExpr): MathExpr => ({ kind: 'add', left, right });
export const sub = (left: MathExpr, right: MathExpr): MathExpr => ({ kind: 'subtract', left, right });
export const mul = (left: MathExpr, right: MathExpr): MathExpr => ({ kind: 'multiply', left, right });
export const div = (left: MathExpr, right: MathExpr): MathExpr => ({ kind: 'divide', left, right });
export const fraction = (n: number, d: number) => div(num(n), num(d));
export function evaluateMath(expr: MathExpr, variables: Record<string, number> = {}): number {
  if (expr.kind === 'mixed') return expr.whole + expr.numerator / expr.denominator;
  if (expr.kind === 'number') return expr.value;
  if (expr.kind === 'variable') return variables[expr.name];
  if (expr.kind === 'sqrt') return Math.sqrt(evaluateMath(expr.arg, variables));
  if (expr.kind === 'power') return evaluateMath(expr.base, variables) ** expr.exponent;
  const a = evaluateMath(expr.left, variables), b = evaluateMath(expr.right, variables);
  return expr.kind === 'add' ? a + b : expr.kind === 'subtract' ? a - b : expr.kind === 'multiply' ? a * b : a / b;
}
export function mathText(expr: MathExpr): string {
  if (expr.kind === 'mixed') return `(${expr.whole} + ${expr.numerator}/${expr.denominator})`;
  if (expr.kind === 'number') return String(expr.value).replace('.', ',').replace('-', '−');
  if (expr.kind === 'variable') return expr.name;
  if (expr.kind === 'sqrt') return `√(${mathText(expr.arg)})`;
  if (expr.kind === 'power') return `(${mathText(expr.base)})^${expr.exponent}`;
  return `(${mathText(expr.left)} ${ { add: '+', subtract: '−', multiply: '·', divide: '/' }[expr.kind]} ${mathText(expr.right)})`;
}
export function reducedFraction(n: number, d: number): [number, number] {
  n = Math.round(n); d = Math.round(d);
  if (d < 0) { n = -n; d = -d; }
  let a = Math.abs(n), b = d;
  while (b) [a, b] = [b, a % b];
  return [n / a, d / a];
}
export function fractionAnswer(n: number, d: number): string {
  const [a, b] = reducedFraction(n, d);
  return b === 1 ? String(a) : `${a}/${b}`;
}
