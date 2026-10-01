import type { Problem } from './engine.ts';
import { displayNumber as fmt } from './function-graphs.ts';
import { interval, solutionText, type Inequality, type SolutionSet } from './number-lines.ts';
export const inequalityGroups = ['Линейные: положительный коэффициент', 'Линейные: отрицательный коэффициент', 'Неравенства со скобками', 'Неизвестное в обеих частях', 'Дробные и десятичные границы', 'Системы: ограниченный промежуток', 'Системы: пересечение лучей', 'Системы без решений', 'Квадратные: между корнями', 'Квадратные: вне корней'] as const;
const pool: Problem[] = [];
const linear = (b: number, op: Inequality['op'], coefficient = 1): Inequality => ({ a: 0, b: coefficient, c: -coefficient * b, op });
const reverse = (op: Inequality['op']): Inequality['op'] => ({ '<': '>', '≤': '≥', '>': '<', '≥': '≤' })[op] as Inequality['op'];
const signed = (n: number) => n >= 0 ? ` + ${fmt(n)}` : ` − ${fmt(-n)}`;
for (let group = 1; group <= 10; group++) for (let j = 0; j < 20; j++) {
  const closed = j % 2 === 0, bound = (j - 9) / 2;
  let expression: string, constraints: Inequality[], choices: SolutionSet[], hint: string;
  if (group <= 5) {
    const left = j % 4 < 2, op: Inequality['op'] = left ? closed ? '≤' : '<' : closed ? '≥' : '>';
    if (group === 1 || group === 2) {
      const coefficient = group === 1 ? 2 : -2, written = coefficient > 0 ? op : reverse(op), constant = 3 + j;
      expression = `${coefficient < 0 ? '−' : ''}2x${signed(constant)} ${written} ${fmt(coefficient * bound + constant)}`;
      constraints = [{ a: 0, b: coefficient, c: -coefficient * bound, op: written }];
      hint = `Перенесите ${constant} и разделите на ${coefficient}.${coefficient < 0 ? ' При делении на отрицательное число знак меняется.' : ''} Получится x ${op} ${fmt(bound)}.`;
    } else if (group === 3) {
      const d = j + 1, rhs = bound - 2 * d;
      expression = `3x − 2(x + ${d}) ${op} ${fmt(rhs)}`;
      constraints = [linear(bound, op)]; hint = `Раскрываем скобки: 3x−2x−${2 * d} ${op} ${fmt(rhs)}. Значит x ${op} ${fmt(bound)}.`;
    } else if (group === 4) {
      const extra = j + 2;
      expression = `5x + ${extra} ${op} 3x${signed(2 * bound + extra)}`;
      constraints = [linear(bound, op, 2)]; hint = `Переносим 3x влево, числа вправо: 2x ${op} ${fmt(2 * bound)}. Делим на 2: x ${op} ${fmt(bound)}.`;
    } else {
      const shift = j + 1;
      expression = `(x − ${shift})/2 ${op} ${fmt((bound - shift) / 2)}`;
      constraints = [linear(bound, op)]; hint = `Умножаем обе части на положительное число 2, прибавляем ${shift}: x ${op} ${fmt(bound)}.`;
    }
    choices = [left ? [interval(null, bound, false, closed)] : [interval(bound, null, closed)], left ? [interval(bound, null, closed)] : [interval(null, bound, false, closed)], left ? [interval(null, -bound - 1, false, closed)] : [interval(-bound - 1, null, closed)], left ? [interval(null, bound, false, !closed)] : [interval(bound, null, !closed)]];
    // If the reflected boundary coincides, move it so every distractor is distinct.
    if (-bound - 1 === bound) choices[2] = left ? [interval(null, bound + 1, false, closed)] : [interval(bound + 1, null, closed)];
  } else if (group === 6) {
    const lo = j - 12, hi = lo + 3;
    const lop = closed ? '≥' : '>', hop = closed ? '≤' : '<';
    expression = `Система:\nx ${lop} ${lo};\nx ${hop} ${hi}`;
    constraints = [linear(lo, lop), linear(hi, hop)];
    choices = [[interval(lo, hi, closed, closed)], [interval(null, lo, false, closed), interval(hi, null, closed)], [interval(lo, hi, !closed, !closed)], []];
    hint = `Нужно выполнить оба условия: взять пересечение лучей от ${lo} до ${hi}. ${closed ? 'Границы включены.' : 'Границы не включены.'}`;
  } else if (group === 7) {
    const lo = j - 12, hi = lo + 3, op = closed ? '≥' : '>';
    expression = `Система:\nx ${op} ${lo};\nx ${op} ${hi}`;
    constraints = [linear(lo, op), linear(hi, op)];
    choices = [[interval(hi, null, closed)], [interval(lo, null, closed)], [interval(lo, hi, closed, closed)], [interval(null, hi, false, closed)]];
    hint = `Оба луча направлены вправо. Пересечение начинается с большей границы ${hi}; получаем x ${op} ${hi}.`;
  } else if (group === 8) {
    const lo = j - 12, hi = lo + 3;
    expression = `Система:\nx ≥ ${hi};\nx ≤ ${lo}`;
    constraints = [linear(hi, '≥'), linear(lo, '≤')];
    choices = [[], [interval(lo, hi, true, true)], [interval(null, lo, false, true), interval(hi, null, true)], [interval(null, null)]];
    hint = `Число не может одновременно быть не меньше ${hi} и не больше ${lo}. Общей части нет.`;
  } else {
    const lo = j - 12, hi = lo + 4, outside = group === 10, op = outside ? closed ? '≥' : '>' : closed ? '≤' : '<';
    expression = `(x${signed(-lo)})(x${signed(-hi)}) ${op} 0`;
    constraints = [{ a: 1, b: -lo - hi, c: lo * hi, op }];
    const inner = [interval(lo, hi, closed, closed)], outer = [interval(null, lo, false, closed), interval(hi, null, closed)];
    choices = [outside ? outer : inner, outside ? inner : outer, outside ? [interval(null, lo, false, !closed), interval(hi, null, !closed)] : [interval(lo, hi, !closed, !closed)], []];
    hint = `Нули произведения: ${lo} и ${hi}. Между корнями знак минус, вне корней плюс. Выбираем ${outside ? 'два внешних промежутка' : 'промежуток между корнями'}; границы ${closed ? 'включаем' : 'исключаем'}.`;
  }
  const rotation = (j + group) % 4;
  choices = [...choices.slice(rotation), ...choices.slice(0, rotation)];
  const answer = String((4 - rotation) % 4 + 1);
  pool.push({ id: `oge-13-g${group}-${j + 1}`, expression: `Решите ${group >= 6 && group <= 8 ? 'систему неравенств' : 'неравенство'}.\n${expression}\nУкажите номер правильного варианта (1–4).`, answer, answerMode: 'choice', colorIndex: j, numberLines: { choices, constraints }, hint: `${hint} Ответ: вариант ${answer} — ${solutionText(choices[Number(answer) - 1])}.` });
}
export const inequalityProblemPool: readonly Problem[] = pool;
