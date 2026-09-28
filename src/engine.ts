export type Problem = { id: string; expression: string; answer: number; hint: string };

const templates: Omit<Problem, 'id'>[] = [
  { expression: '48 + 27', answer: 75, hint: '50 + 27 − 2' },
  { expression: '36 + 19', answer: 55, hint: '36 + 20 − 1' },
  { expression: '67 + 28', answer: 95, hint: '67 + 30 − 2' },
  { expression: '83 − 29', answer: 54, hint: '83 − 20 − 9' },
  { expression: '72 − 38', answer: 34, hint: '72 − 40 + 2' },
  { expression: '94 − 47', answer: 47, hint: '94 − 40 − 7' },
  { expression: '7 × 9', answer: 63, hint: '7 × 10 − 7' },
  { expression: '8 × 9', answer: 72, hint: '8 × 10 − 8' },
  { expression: '12 × 5', answer: 60, hint: '12 × 10 ÷ 2' },
  { expression: '14 × 5', answer: 70, hint: '14 × 10 ÷ 2' },
  { expression: '56 + 39', answer: 95, hint: '56 + 40 − 1' },
  { expression: '91 − 19', answer: 72, hint: '91 − 20 + 1' },
  { expression: '6 × 9', answer: 54, hint: '6 × 10 − 6' },
  { expression: '18 × 5', answer: 90, hint: '18 × 10 ÷ 2' },
];

export const guided: Problem[] = templates.slice(0, 6).map((problem, index) => ({ ...problem, id: `guide-${index}` }));

export function makeRound(random: () => number = Math.random): Problem[] {
  const pool = templates.map((problem, index) => ({ ...problem, id: `round-${index}` }));
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  return pool.slice(0, 10);
}

export function checkAnswer(input: string, problem: Problem): boolean {
  const normalized = input.trim().replace(',', '.');
  return normalized !== '' && Number.isFinite(Number(normalized)) && Number(normalized) === problem.answer;
}
