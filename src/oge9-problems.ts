import type { Problem } from './engine.ts';
import { multiplyPolynomials as mul, type RootTask } from './equation-models.ts';
import { displayNumber as f } from './function-graphs.ts';
export const equationGroups = ['Линейные: перенос слагаемых', 'Неизвестное в обеих частях', 'Одна скобка', 'Несколько скобок', 'Квадрат и два корня', 'Выносим x за скобку', 'Квадратные: формула и Виет', 'Произведение множителей', 'Квадратные с коэффициентом', 'Общие множители и три корня'] as const;
const pool: Problem[] = [];
const term = (n: number) => `${n < 0 ? ' − ' : ' + '}${f(Math.abs(n))}`;
const factor = (root: number) => `(x${term(-root)})`;
function add(group: number, equation: string, roots: number[], left: number[], right: number[], hint: string, required: RootTask['required']) {
  const sorted = [...new Set(roots)].sort((a, b) => a - b);
  const chosen = required === 'all' ? sorted : [required === 'smallest' ? sorted[0] : sorted[sorted.length - 1]];
  const answer = chosen.map(n => String(n)).join('');
  const instruction = required === 'all' ? 'Запишите все корни без пробелов и разделителей в порядке возрастания.' : `Запишите ${required === 'smallest' ? 'меньший' : 'больший'} корень, если их несколько.`;
  pool.push({ id: `oge-9-g${group}-${pool.length % 20 + 1}`, colorIndex: pool.length % 20, expression: `Решите уравнение: ${equation}.\n${instruction}`, answer, hint: `${hint} Корни: ${sorted.map(f).join('; ')}.${required === 'all' ? ` Запись ответа: ${answer.replaceAll('-', '−')}.` : ''}`, rootTask: { left, right, required }, ...(required === 'all' ? { answerMode: 'roots' as const, answerDisplay: chosen.map(f).join('; ') } : {}) });
}
for (let group = 1; group <= 10; group++) for (let j = 0; j < 20; j++) {
  const k = j + 1, pick = j % 3 === 0 ? 'smallest' : j % 3 === 1 ? 'largest' : 'all';
  if (group === 1) {
    const root = (j - 9) / 4, b = j + 3, c = 4 * root + b;
    add(group, `4x + ${b} = ${f(c)}`, [root], [b, 4], [c], `4x=${f(c)}−${b}=${f(4 * root)}. Делим обе части на 4: x=${f(root)}.`, 'smallest');
  } else if (group === 2) {
    const root = (j - 10) / 10, a = 12 + j, c = a - 10, b = j + 5, d = 10 * root + b;
    add(group, `${a}x + ${b} = ${c}x + ${f(d)}`, [root], [b, a], [d, c], `Переносим x влево, числа вправо: (${a}−${c})x=${f(d)}−${b}. 10x=${f(10 * root)}, x=${f(root)}.`, 'smallest');
  } else if (group === 3) {
    const root = (j - 7) / 4, shift = k, c = 4 * (root + shift);
    add(group, `4(x + ${shift}) = ${f(c)}`, [root], [4 * shift, 4], [c], `Делим на 4: x+${shift}=${f(c / 4)}. Вычитаем ${shift}: x=${f(root)}.`, 'smallest');
  } else if (group === 4) {
    if (j % 2 === 0) add(group, `3(x + ${k}) − 2(x − ${k}) = ${k}`, [-4 * k], [5 * k, 1], [k], `Раскрываем скобки: 3x+${3 * k}−2x+${2 * k}=${k}. x+${5 * k}=${k}, x=${-4 * k}.`, 'smallest');
    else {
      const root = (j - 8) / 2, c = 2 - 3 * k + 2 * root;
      add(group, `2 − 3(${k} − 2x) = 4x${term(c)}`, [root], [2 - 3 * k, 6], [c, 4], `Минус перед скобкой меняет знаки: 2−${3 * k}+6x=4x${term(c)}. 2x=${f(2 * root)}, x=${f(root)}.`, 'smallest');
    }
  } else if (group === 5) add(group, `x² − ${k * k} = 0`, [-k, k], [-k * k, 0, 1], [0], `x²=${k * k}. Не теряем отрицательный корень: x=−${k} или x=${k}.`, j % 2 ? 'largest' : 'smallest');
  else if (group === 6) {
    const r = j % 2 ? -k : k, a = 2 + j % 4;
    add(group, `${a}x²${term(-a * r)}x = 0`, [0, r], [0, -a * r, a], [0], `Выносим x: ${a}x·${factor(r)}=0. Либо x=0, либо x=${f(r)}. Делить на x нельзя: потеряется нулевой корень.`, pick);
  } else if (group === 7) {
    const r = -k - (j % 4 === 1 ? 3 : 0), s = j % 4 === 1 ? -k : k + 3;
    add(group, `x²${term(-r - s)}x${term(r * s)} = 0`, [r, s], [r * s, -r - s, 1], [0], `По Виету сумма корней ${f(r + s)}, произведение ${r * s}. Подходят ${f(r)} и ${f(s)}.`, pick);
  } else if (group === 8) {
    const r = -k / 4, s = k / 2;
    add(group, `(4x + ${k})(2x − ${k}) = 0`, [r, s], mul([k, 4], [-k, 2]), [0], `Произведение равно нулю: 4x+${k}=0 или 2x−${k}=0. x=${f(r)} или x=${f(s)}.`, j % 2 ? 'largest' : 'smallest');
  } else if (group === 9) {
    const r = k / 2, s = k + 2, a = 2, b = -2 * (r + s), c = 2 * r * s, discriminant = b * b - 4 * a * c;
    add(group, `2x²${term(b)}x${term(c)} = 0`, [r, s], [c, b, a], [0], `D=b²−4ac=${discriminant}, √D=${Math.sqrt(discriminant)}. x=(−b±√D)/(2a), то есть ${f(r)} и ${f(s)}.`, j % 2 ? 'largest' : 'smallest');
  } else {
    const a = [-3 * k, 3], b = [-k - 4, 1];
    add(group, `(3x − ${3 * k})²(x − ${k + 4}) = (3x − ${3 * k})(x − ${k + 4})²`, [k - 2, k, k + 4], mul(mul(a, a), b), mul(a, mul(b, b)), `Переносим вправо стоящее произведение влево и выносим общие множители: (3x−${3 * k})(x−${k + 4})(2x${term(4 - 2 * k)})=0. Каждый множитель может равняться нулю. Сокращение на общий множитель потеряло бы корни.`, 'all');
  }
}
export const equationProblemPool: readonly Problem[] = pool;
