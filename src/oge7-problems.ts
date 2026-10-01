import type { Problem } from './engine.ts';
import type { AxisScene, OrderTask } from './order-models.ts';
import { displayNumber as f } from './function-graphs.ts';
export const comparisonGroups = ['Порядок дробей и десятичных чисел', 'Отрицательные числа на прямой', 'Корень между целыми числами', 'Число в заданном промежутке', 'Точка для дроби', 'Точка для квадратного корня', 'Число между двумя дробями', 'Знак разности', 'Верные и неверные утверждения', 'Степени числа от 0 до 1'];
const labels = ['A', 'B', 'C', 'D'];
const numbered = (options: string[]) => options.map((text, i) => `${i + 1}) ${text}`).join('\n');
const rotate = <T,>(arr: T[], j: number) => arr.slice(j % arr.length).concat(arr.slice(0, j % arr.length));
const integerAxis = (lo: number, hi: number, points: AxisScene['points']): AxisScene => ({ lo: lo - 0.35, hi: hi + 0.35, ticks: Array.from({ length: hi - lo + 1 }, (_, j) => ({ value: lo + j, label: f(lo + j) })), points });
export const comparisonProblemPool: readonly Problem[] = Array.from({ length: 200 }, (_, i) => {
  const g = Math.floor(i / 20), j = i % 20, k = j + 2;
  let values: number[], options: string[], question: string, task: Omit<OrderTask, 'values'>, axis: AxisScene | undefined, hint: string;
  if (g === 0 || g === 1) {
    const ns = g === 0 ? [k / 7, k / 5, (k + 1) / 5, (k + 2) / 5] : [-(k + 5) / 100, -(k + 1) / 100, k / 100, (k + 4) / 100];
    const texts = g === 0 ? [`${k}/7`, `${k}/5`, f(ns[2]), f(ns[3])] : ns.map(f); const targetIndex = j % 4; values = rotate(ns, j + 1); options = rotate(texts, j + 1); task = { rule: 'equals', target: ns[targetIndex] };
    question = `Точки A, B, C, D соответствуют числам ${rotate(texts, j + 1).join('; ')}. Какое число соответствует точке ${labels[targetIndex]}?`;
    axis = { lo: ns[0] - (ns[3] - ns[0]) * 0.2, hi: ns[3] + (ns[3] - ns[0]) * 0.2, ticks: g === 1 ? [{ value: 0, label: '0' }] : [], points: ns.map((value, t) => ({ value, label: labels[t] })) }; hint = g === 0 ? 'Сравни дроби и десятичные числа. Слева направо числа возрастают.' : 'Из отрицательных чисел левее то, у которого модуль больше. Справа от нуля — положительные.';
  } else if (g === 2) {
    const n = k * k + 1 + j % k; values = rotate([k, k - 2, k + 1, k + 3], j); options = values.map(a => `${a} и ${a + 1}`); task = { rule: 'between', target: Math.sqrt(n) }; question = `Между какими последовательными целыми числами находится √${n}?`; hint = `${k}² < ${n} < ${k + 1}². Сравни подкоренное число с квадратами целых чисел.`;
  } else if (g === 3) {
    const lo = k, hi = k + 1; values = rotate([lo + 0.5, lo - 0.5, hi + 0.5, hi + 1.5], j); options = values.map(a => j % 2 ? `√${f(a * a)}` : `${Math.round(a * 2)}/2`); task = { rule: 'between', lo, hi, closed: true }; question = `Какое число принадлежит отрезку [${lo}; ${hi}]?`; hint = 'Проверь обе границы. Для корней можно сравнить подкоренное число с квадратами границ.';
  } else if (g === 4) {
    const d = 5 + j % 5, n = d + k, value = n / d; const ns = Array.from({ length: 4 }, (_, t) => value + (t - j % 4) * 0.2); values = ns; options = labels; task = { rule: 'equals', target: value }; question = `Какая точка соответствует числу ${n}/${d}?`;
    axis = integerAxis(Math.floor(value) - 1, Math.ceil(value) + 1, ns.map((a, t) => ({ value: a, label: labels[t] }))); hint = `Выдели целую часть дроби ${n}/${d}. Сравни оставшуюся долю единицы с положением точек.`;
  } else if (g === 5) {
    const base = 2 + j, r = Math.sqrt(base * base + base), ns = Array.from({ length: 4 }, (_, t) => r + (t - j % 4) * 0.13); values = ns; options = labels; task = { rule: 'equals', target: r }; question = `Какая точка соответствует √${base * base + base}?`;
    axis = integerAxis(base, base + 1, ns.map((a, t) => ({ value: a, label: labels[t] }))); hint = `${base}² < ${base * base + base} < ${base + 1}². Уточни положение корня между соседними целыми числами.`;
  } else if (g === 6) {
    const center = (j + 2) / 10, lo = center - 0.04, hi = center + 0.04; values = rotate([center, center - 0.1, center + 0.1, center + 0.2], j); options = values.map(f); task = { rule: 'between', lo, hi }; question = `Какое число находится строго между ${Math.round(lo * 100)}/100 и ${Math.round(hi * 100)}/100?`; hint = 'Приведи дроби к десятичной записи и проверь два строгих неравенства.';
  } else if (g === 7) {
    const xs = [k, k + 1, k + 3], positive = j % 2 === 0; const pairs = positive ? [[2, 1], [0, 1], [0, 2], [1, 2]] : [[0, 1], [2, 1], [2, 0], [1, 0]]; const names = ['x', 'y', 'z']; values = rotate(pairs.map(([a, b]) => xs[a] - xs[b]), j); options = rotate(pairs.map(([a, b]) => `${names[a]} − ${names[b]}`), j); task = { rule: positive ? 'positive' : 'negative' }; question = `Какая из разностей ${positive ? 'положительна' : 'отрицательна'}?`; axis = integerAxis(k - 1, k + 4, xs.map((a, t) => ({ value: a, label: names[t] }))); hint = 'Если первое число правее второго, разность положительна; если левее — отрицательна.';
  } else if (g === 8) {
    const a = -(k + 1), b = k / 2, wrong = j % 2 === 1; const statements = ['ab < 0', 'a − b < 0', 'a² > 0', 'a > b']; const truths = [1, 1, 1, 0]; values = rotate(wrong ? truths : [1, 0, 0, 0], j); options = rotate(wrong ? statements : ['ab < 0', 'a − b > 0', 'a² < 0', 'a > b'], j); task = { rule: wrong ? 'false' : 'true' }; question = `Какое утверждение ${wrong ? 'неверно' : 'верно'}?`; axis = { lo: a - 1, hi: b + 1, ticks: [{ value: 0, label: '0' }], points: [{ value: a, label: 'a' }, { value: b, label: 'b' }] }; hint = 'Здесь a < 0 < b. Произведение отрицательно, квадрат положителен, а разность a − b отрицательна.';
  } else {
    const a = (j + 2) / 25; values = rotate([a ** 2, a ** 3, a ** 4, a ** 5], j); options = rotate(['a²', 'a³', 'a⁴', 'a⁵'], j); task = { rule: 'max' }; question = 'Какое из этих чисел наибольшее?'; axis = { lo: -0.1, hi: 1.1, ticks: [{ value: 0, label: '0' }, { value: 1, label: '1' }], points: [{ value: a, label: 'a' }] }; hint = 'При 0 < a < 1 каждое умножение на a уменьшает положительное число. Наибольшая степень — с наименьшим показателем.';
  }
  const match = values.map((value, t) => task.rule === 'equals' ? Math.abs(value - task.target!) < 1e-9 : task.rule === 'between' ? task.target !== undefined ? value < task.target && task.target < value + 1 : task.closed ? task.lo! <= value && value <= task.hi! : task.lo! < value && value < task.hi! : task.rule === 'positive' ? value > 0 : task.rule === 'negative' ? value < 0 : task.rule === 'max' ? value === Math.max(...values) : task.rule === 'true' ? value === 1 : value === 0).map((hit, t) => hit ? t : -1).filter(t => t >= 0);
  if (match.length !== 1) throw new Error(`Ambiguous comparison ${i}`);
  const answer = String(match[0] + 1);
  return { id: `oge-7-g${g + 1}-${j + 1}`, colorIndex: j, expression: `${question}\n${numbered(options)}\nВведи номер варианта.`, answer, answerMode: 'choice' as const, orderTask: { ...task, values }, axisScene: axis, hint: `${hint} Верный вариант: ${answer}.` };
});
