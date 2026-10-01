import type { Problem } from './engine.ts';
import { num, add, sub, mul, div, fraction as f, fractionAnswer, reducedFraction, type MathExpr, type NumericTask } from './numeric-expressions.ts';
export const arithmeticGroups = ['Сложение десятичных дробей', 'Вычитание и отрицательный ответ', 'Умножение десятичных дробей', 'Деление десятичных дробей', 'Сложение и вычитание дробей', 'Умножение и деление дробей', 'Смешанные числа', 'Дробь с дробным знаменателем', 'Заданный знаменатель', 'Числитель несократимой дроби'];
export const arithmeticProblemPool: readonly Problem[] = Array.from({ length: 200 }, (_, i) => {
  const g = Math.floor(i / 20), j = i % 20, k = j + 2;
  let formula: MathExpr, n: number, d: number, hint: string, target: NumericTask['target'];
  if (g === 0) { const a = 17 + j, b = 53 + 2 * j; formula = add(num(a / 10), num(b / 10)); n = a + b; d = 10; hint = 'Складывай разряды: десятые с десятыми. Запятая остаётся под запятой.'; }
  else if (g === 1) { const a = 32 + j, b = 65 + 2 * j; formula = j % 2 ? sub(num(b / 10), num(a / 10)) : sub(num(a / 10), num(b / 10)); n = j % 2 ? b - a : a - b; d = 10; hint = 'Сравни числа до вычитания. Если уменьшаемое меньше, ответ отрицательный.'; }
  else if (g === 2) { const a = 13 + j, b = 21 + j; formula = mul(num(a / 10), num(b / 10)); n = a * b; d = 100; hint = 'Умножь без запятых. В произведении отдели две цифры справа.'; }
  else if (g === 3) { const b = 11 + j; formula = div(num(k * b / 10), num(b / 10)); n = k; d = 1; hint = 'Умножь делимое и делитель на 10: отношение не изменится.'; }
  else if (g === 4) { formula = j % 2 ? sub(f(k, 4), f(3, 5)) : add(f(k, 4), f(3, 5)); n = 5 * k + (j % 2 ? -12 : 12); d = 20; hint = 'Приведи обе дроби к знаменателю 20, затем сложи или вычти числители.'; }
  else if (g === 5) { formula = j % 2 ? div(f(k, 5), f(3, 7)) : mul(f(k, 7), f(14, 5)); n = j % 2 ? k * 7 : k * 2; d = j % 2 ? 15 : 5; hint = 'При делении переверни вторую дробь. Сократи множители перед умножением.'; }
  else if (g === 6) { formula = sub({ kind: 'mixed', whole: k, numerator: 1, denominator: 2 }, f(k + 3, 5)); n = 10 * k + 5 - 2 * (k + 3); d = 10; hint = 'Переведи смешанное число в неправильную дробь. Общий знаменатель — 10.'; }
  else if (g === 7) { formula = div(num(1), j % 2 ? sub(f(1, k + 2), f(1, k + 5)) : add(f(1, k + 2), f(1, k + 5))); n = (k + 2) * (k + 5); d = j % 2 ? 3 : 2 * k + 7; hint = 'Сначала вычисли знаменатель, затем раздели 1 на полученную дробь.'; }
  else if (g === 8) { formula = sub(f(k, 5), f(k + 3, 7)); n = (7 * k - 5 * (k + 3)) * 2; d = 70; target = 'scaledNumerator'; hint = 'Приведи обе дроби именно к 70: числители умножь на 14 и 10. Вводи только разность числителей.'; }
  else { formula = mul(f(k, 6), f(k + 3, 14)); n = k * (k + 3); d = 84; target = 'numerator'; hint = 'Перемножь дроби, сократи результат до несократимой дроби. Вводи только её числитель.'; }
  const answer = target === 'scaledNumerator' ? String(n) : target === 'numerator' ? String(reducedFraction(n, d)[0]) : g < 4 ? String(n / d) : fractionAnswer(n, d);
  const expression = target === 'scaledNumerator' ? 'Представь результат дробью со знаменателем 70. Введи её числитель.' : target === 'numerator' ? 'Вычисли и сократи дробь. Введи числитель несократимой дроби.' : 'Найди значение выражения. Точную дробь можно ввести через /.';
  return { id: `oge-6-g${g + 1}-${j + 1}`, colorIndex: j, expression, answer, answerDisplay: answer.replace('.', ',').replace('-', '−'), numericTask: { formula, target, ...(target === 'scaledNumerator' ? { denominator: 70 } : {}) }, hint: `${hint} ${target ? 'Ответ' : 'Значение'}: ${answer.replace('.', ',').replace('-', '−')}.` };
});
