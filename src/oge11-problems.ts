import type { Problem } from './engine.ts';
import { displayNumber, functionFormula, type FunctionSpec, type GraphQuestion } from './function-graphs.ts';

export const functionGroups = ['Прямые через начало координат', 'Прямые со сдвигом', 'Знаки коэффициентов прямой', 'Параболы и направление ветвей', 'Параболы со сдвигом вершины', 'Знаки коэффициентов параболы', 'Гиперболы: y = k/x', 'Графики квадратного корня', 'Прямая, парабола и гипербола', 'Смешанные соответствия'] as const;
const permutations = [[0, 1, 2], [0, 2, 1], [1, 0, 2], [1, 2, 0], [2, 0, 1], [2, 1, 0]];
const letters = ['А', 'Б', 'В'];
const linear = (a: number, c = 0, coefficient?: string): FunctionSpec => ({ kind: 'linear', a, b: 0, c, ...(coefficient ? { coefficient } : {}) });
const quadratic = (a: number, b = 0, c = 0): FunctionSpec => ({ kind: 'quadratic', a, b, c });
const reciprocal = (a: number, coefficient?: string): FunctionSpec => ({ kind: 'reciprocal', a, b: 0, c: 0, ...(coefficient ? { coefficient } : {}) });
const root = (a: number, b = 0, c = 0): FunctionSpec => ({ kind: 'sqrt', a, b, c });
const pool: Problem[] = [];
for (let group = 1; group <= 10; group++) for (let j = 0; j < 20; j++) {
  const s = 1 + j / 10, offset = 1 + j / 20;
  let fns: FunctionSpec[];
  if (group === 1) fns = [linear(s + 1), linear(-s - 1), linear(1 / (j + 2), 0, `1/${j + 2}`)];
  else if (group === 2 || group === 3) fns = [linear(0.5, offset), linear(-0.5, offset), linear(0.5, -offset)];
  else if (group === 4) fns = [quadratic(0.5, 0, offset), quadratic(-0.5, 0, offset), quadratic(0.5, 0, -offset)];
  else if (group === 5) fns = [quadratic(0.5, -offset, offset * offset / 2 - 2), quadratic(0.5, offset, offset * offset / 2 + 1), quadratic(-0.5, offset, -offset * offset / 2 + 2)];
  else if (group === 6) fns = [quadratic(0.5, 0.5, offset), quadratic(-0.5, 0.5, offset), quadratic(0.5, -0.5, -offset)];
  else if (group === 7) fns = [reciprocal(s + 1), reciprocal(-s - 1), reciprocal(1 / (j + 2), `1/${j + 2}`)];
  else if (group === 8) fns = [root(1, 0, j / 20), root(-1, 0, offset), root(1, -2, -offset)];
  else if (group === 9) fns = [linear(0.5, -offset), quadratic(-0.5, 1, offset), reciprocal(-s - 1)];
  else fns = [root(1, 0, -offset), quadratic(0.5, 1, -offset), linear(-0.5, offset)];
  const permutation = permutations[(j + group) % permutations.length], signs = group === 3 ? 'linear' : group === 6 ? 'quadratic' : undefined;
  const direction = !signs && j % 2 ? 'options-to-graphs' : 'graphs-to-options';
  const options: GraphQuestion['options'] = fns.map(fn => signs ? { text: `${signs === 'linear' ? 'k' : 'a'} ${fn.a > 0 ? '>' : '<'} 0, ${signs === 'linear' ? 'b' : 'c'} ${fn.c > 0 ? '>' : '<'} 0`, signs: [Math.sign(fn.a), Math.sign(fn.c)] } : { text: functionFormula(fn), fn });
  const graphs: GraphQuestion = { panels: permutation.map((index, i) => ({ label: direction === 'graphs-to-options' ? letters[i] : String(i + 1), fn: fns[index] })), options, direction, ...(signs ? { signs } : {}) };
  const mapping = direction === 'graphs-to-options' ? permutation : fns.map((_, i) => permutation.indexOf(i));
  const answer = mapping.map(i => i + 1).join('');
  const question = signs ? `На рисунках графики ${signs === 'linear' ? 'y=kx+b' : 'y=ax²+bx+c'}. Сопоставьте графики А, Б, В со знаками коэффициентов.` : direction === 'graphs-to-options' ? 'Сопоставьте графики А, Б, В с формулами 1, 2, 3.' : 'Сопоставьте функции А, Б, В с графиками 1, 2, 3.';
  const expression = question + '\n' + options.map((o, i) => `${direction === 'graphs-to-options' ? i + 1 : letters[i]}) ${o.text}`).join('\n') + '\nЗапишите три цифры в порядке А, Б, В без пробелов.';
  const reasons = fns.map((fn, i) => {
    const text = signs ? `${fn.a > 0 ? signs === 'linear' ? 'возрастает' : 'ветви вверх' : signs === 'linear' ? 'убывает' : 'ветви вниз'}; пересечение Oy ${fn.c > 0 ? 'выше' : 'ниже'} нуля` : fn.kind === 'linear' ? `прямая: наклон ${displayNumber(fn.a)}, пересечение Oy ${displayNumber(fn.c)}` : fn.kind === 'quadratic' ? `парабола: ветви ${fn.a > 0 ? 'вверх' : 'вниз'}, y(0)=${displayNumber(fn.c)}` : fn.kind === 'reciprocal' ? `гипербола: ветви в ${fn.a > 0 ? 'I и III' : 'II и IV'} четвертях, k=${fn.coefficient ?? displayNumber(fn.a)}` : `корень: начало (${displayNumber(fn.b)}; ${displayNumber(fn.c)}), ${fn.a > 0 ? 'возрастает' : 'убывает'}`;
    return `${direction === 'graphs-to-options' ? `Формула ${i + 1}` : `Функция ${letters[i]}`}: ${text}.`;
  });
  pool.push({ id: `oge-11-g${group}-${j + 1}`, colorIndex: j, expression, answer, answerMode: 'sequence', graphs, hint: `${reasons.join(' ')} Соответствие А, Б, В: ${answer.split('').join(', ')}.` });
}
export const functionProblemPool: readonly Problem[] = pool;
