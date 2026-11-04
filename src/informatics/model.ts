import { sourceCategories, sourceExamples } from './sources.ts';
export type InformaticsCourseId = `informatics-oge-${number}`;
export type InfoTable = { kind: 'table'; headers: string[]; rows: string[][]; caption: string };
export type InfoGraph = { kind: 'graph'; labels: string[]; edges: { from: number; to: number; weight?: number }[]; directed: boolean; caption: string };
export type Expression = { op: 'cmp'; variable: 'x' | 's' | 't'; sign: '<' | '<=' | '>' | '>=' | '==' | '!='; value: number } | { op: 'mod'; variable: 'x' | 's' | 't'; divisor: number; remainder: number; equal: boolean } | { op: 'not'; a: Expression } | { op: 'and'; a: Expression; b: Expression } | { op: 'or'; a: Expression; b: Expression };
export type InformaticsTask = {
 id: string; number: number; group: number; colorIndex: number; kind: 'number' | 'text';
 prompt: string; answer: string; format: string; keys: string[]; options: { id: string }[];
 steps: string[]; hint: string; firstStep: string; category: number; sourceIds: number[];
 figures: (InfoTable | InfoGraph)[]; code?: string;
 model: { rule: string; data: Record<string, unknown> };
};
export type InformaticsCourse = { id: InformaticsCourseId; number: number; title: string; tasks: readonly InformaticsTask[]; groups: { number: number; title: string }[]; lesson: { title: string; text: string; example: string }[] };
export const rng = (seed: number) => { let n = seed >>> 0; return () => { n = (Math.imul(n, 1664525) + 1013904223) >>> 0; return n / 4294967296; }; };
export const shuffled = <T>(items: readonly T[], random: () => number) => { const a = [...items]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
export const table = (headers: string[], rows: (string | number)[][], caption = ''): InfoTable => ({ kind: 'table', headers, rows: rows.map(r => r.map(String)), caption });
export function evaluate(e: Expression, vars: Partial<Record<'x' | 's' | 't', number>>): boolean {
 if (e.op === 'not') return !evaluate(e.a, vars);
 if (e.op === 'and') return evaluate(e.a, vars) && evaluate(e.b, vars);
 if (e.op === 'or') return evaluate(e.a, vars) || evaluate(e.b, vars);
 if (e.op === 'mod') return ((vars[e.variable]! % e.divisor) === e.remainder) === e.equal;
 const a = vars[e.variable]!, b = e.value; switch (e.sign) { case '<': return a < b; case '<=': return a <= b; case '>': return a > b; case '>=': return a >= b; case '==': return a === b; case '!=': return a !== b; }
}
export function expressionText(e: Expression, python = false): string {
 if (e.op === 'cmp') return `${e.variable} ${e.sign} ${e.value}`;
 if (e.op === 'mod') return `${e.variable} % ${e.divisor} ${e.equal ? '==' : '!='} ${e.remainder}`;
 if (e.op === 'not') return `${python ? 'not' : 'НЕ'} (${expressionText(e.a, python)})`;
 return `(${expressionText(e.a, python)}) ${python ? e.op : e.op === 'and' ? 'И' : 'ИЛИ'} (${expressionText(e.b, python)})`;
}
export const cmp = (variable: 'x' | 's' | 't', sign: Extract<Expression, { op: 'cmp' }>['sign'], value: number): Expression => ({ op: 'cmp', variable, sign, value });
export const and = (a: Expression, b: Expression): Expression => ({ op: 'and', a, b });
export const or = (a: Expression, b: Expression): Expression => ({ op: 'or', a, b });
export const not = (a: Expression): Expression => ({ op: 'not', a });
export function decodeAll(stream: string, codes: [string, string][], noRepeat = false, limit = 2): string[] {
 const found: string[] = [];
 const visit = (at: number, word: string, used: Set<string>) => {
  if (found.length >= limit) return;
  if (at === stream.length) { found.push(word); return; }
  for (const [letter, code] of codes) if ((!noRepeat || !used.has(letter)) && stream.startsWith(code, at)) visit(at + code.length, word + letter, new Set([...used, letter]));
 };
 visit(0, '', new Set()); return found;
}
export function permutations<T>(a: T[]): T[][] { return a.length ? a.flatMap((x, i) => permutations(a.filter((_, j) => j !== i)).map(rest => [x, ...rest])) : [[]]; }
export const validIPv4 = (s: string) => { const p = s.split('.'); return p.length === 4 && p.every(x => /^(0|[1-9]\d{0,2})$/.test(x) && Number(x) <= 255); };
export function allPaths(graph: InfoGraph, start: number, end: number, blocked: number[] = []): number[][] {
 const found: number[][] = [];
 const visit = (path: number[]) => { const last = path.at(-1)!; if (blocked.includes(last)) return; if (last === end) { found.push(path); return; } for (const e of graph.edges) { const next = e.from === last ? e.to : !graph.directed && e.to === last ? e.from : -1; if (next >= 0 && !path.includes(next)) visit([...path, next]); } };
 visit([start]); return found;
}
export const pathWeight = (g: InfoGraph, path: number[]) => path.slice(1).reduce((s, v, i) => s + g.edges.find(e => e.from === path[i] && e.to === v || !g.directed && e.from === v && e.to === path[i])!.weight!, 0);
export type Command = { op: 'add' | 'sub' | 'mul' | 'div'; arg: number | 'b' };
export function execute(start: number, commands: Command[], program: string, b = 0): number[] {
 const trace = [start]; for (const code of program) { const c = commands[Number(code) - 1], arg = c.arg === 'b' ? b : c.arg, last = trace.at(-1)!; trace.push(c.op === 'add' ? last + arg : c.op === 'sub' ? last - arg : c.op === 'mul' ? last * arg : last / arg); } return trace;
}
export type TaskBody = Omit<InformaticsTask, 'id' | 'number' | 'group' | 'colorIndex' | 'kind' | 'options' | 'keys' | 'hint' | 'firstStep' | 'figures' | 'format' | 'category' | 'sourceIds'> & Partial<Pick<InformaticsTask, 'kind' | 'hint' | 'firstStep' | 'figures' | 'format' | 'category' | 'sourceIds'>>;
export function task(number: number, group: number, index: number, b: TaskBody): InformaticsTask {
 const kind = b.kind ?? 'number', category = sourceCategories[number][group - 1]; return { id: `informatics${number}-v1-g${group}-${index + 1}`, number, group, colorIndex: index, category, sourceIds: sourceExamples[category], options: [], keys: [...b.answer], hint: 'Выдели исходные данные и условия. Не подменяй единицы или порядок действий.', firstStep: b.steps[0], figures: [], format: kind === 'number' ? 'Целое число' : 'Ответ без пробелов', ...b, kind };
}
