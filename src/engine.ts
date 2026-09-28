export type Problem = { id: string; expression: string; answer: number; hint: string };
export const POOL_SIZE = 100;
export const ROUND_SIZE = 10;

// Stable pool: each session samples from the same one hundred distinct problems.
function buildPool(): Problem[] {
  let seed = 2026;
  const next = () => {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
  const problems: Problem[] = [];
  const seen = new Set<string>();
  function add(left: number, right: number, operation: '+' | '−') {
    const expression = `${left} ${operation} ${right}`;
    if (seen.has(expression)) return;
    seen.add(expression);
    problems.push({
      id: `problem-${problems.length + 1}`,
      expression,
      answer: operation === '+' ? left + right : left - right,
      hint: operation === '+'
        ? `${left} + ${Math.floor(right / 10) * 10} + ${right % 10}`
        : `${left} − ${Math.floor(right / 10) * 10} − ${right % 10}`,
    });
  }
  add(15, 11, '+');
  add(19, 22, '+');
  while (problems.length < 50) {
    const left = 11 + Math.floor(next() * 90);
    const right = 10 + Math.floor(next() * Math.min(90, 201 - left - 10));
    add(left, right, '+');
  }
  while (problems.length < POOL_SIZE) {
    const left = 21 + Math.floor(next() * 180);
    const right = 10 + Math.floor(next() * Math.min(90, left - 10));
    add(left, right, '−');
  }
  return problems;
}
export const problemPool: readonly Problem[] = buildPool();

export function shuffleProblems(problems: readonly Problem[], random: () => number = Math.random): Problem[] {
  const shuffled = [...problems];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
export function makeRound(random: () => number = Math.random): Problem[] {
  return shuffleProblems(problemPool, random).slice(0, ROUND_SIZE);
}
export function restoreRound(ids: string): Problem[] {
  const requested = ids.split(',');
  if (requested.length !== ROUND_SIZE || new Set(requested).size !== ROUND_SIZE) throw new Error('Invalid round');
  const byId = new Map(problemPool.map(problem => [problem.id, problem]));
  return requested.map(id => {
    const problem = byId.get(id);
    if (!problem) throw new Error('Unknown problem');
    return problem;
  });
}
export function shuffleForPractice(problems: readonly Problem[], random: () => number = Math.random): Problem[] {
  const shuffled = shuffleProblems(problems, random);
  if (shuffled.length > 1 && shuffled.every((problem, index) => problem.id === problems[index].id)) {
    shuffled.push(shuffled.shift()!);
  }
  return shuffled;
}
export function checkAnswer(input: string, problem: Problem): boolean {
  const normalized = input.trim().replace(',', '.');
  return normalized !== '' && Number.isFinite(Number(normalized)) && Number(normalized) === problem.answer;
}
