export type RootTask = { left: number[]; right: number[]; required: 'smallest' | 'largest' | 'all' };
// Coefficients are ordered by increasing power, including zero coefficients.
export const polynomialValue = (coefficients: readonly number[], x: number) => coefficients.reduceRight((sum, coefficient) => sum * x + coefficient, 0);
export function multiplyPolynomials(a: number[], b: number[]): number[] {
  const result = Array.from({ length: a.length + b.length - 1 }, () => 0);
  a.forEach((v, i) => b.forEach((w, j) => { result[i + j] += v * w; }));
  return result;
}
