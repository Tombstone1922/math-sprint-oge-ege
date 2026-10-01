import type { Problem } from './engine.ts';
import { num, variable as v, sqrt, power as p, add, sub, mul, div, fractionAnswer, type MathExpr, type NumericTask } from './numeric-expressions.ts';
export const expressionGroups = ['Степени с одинаковым основанием', 'Степень степени и подстановка', 'Произведение оснований', 'Отрицательные показатели', 'Корень из степени и модуль', 'Произведение и частное корней', 'Разность квадратов', 'Раскрытие квадрата суммы', 'Полный квадрат под корнем', 'Корни в дробях и варианты ответа'];
export const expressionProblemPool: readonly Problem[] = Array.from({ length: 200 }, (_, i) => {
  const g = Math.floor(i / 20), j = i % 20, k = j + 2, b = 2 + j % 4, n = 3 + Math.floor(j / 4);
  let formula: MathExpr, answer: string, hint: string, variables: NumericTask['variables'], choices: MathExpr[] | undefined;
  if (g === 0) { const r = 1 + j % 3; formula = div(p(num(b), n + r), p(num(b), n)); answer = String(b ** r); hint = `При делении степеней вычти показатели: ${n + r} − ${n} = ${r}.`; }
  else if (g === 1) { formula = div(p(p(v('a'), n), 2), p(v('a'), 2 * n - 1)); variables = { a: b }; answer = String(b); hint = `Степень степени: a^${2 * n}. После деления остаётся a.`; }
  else if (g === 2) {
    if (j % 2) { formula = div(mul(p(v('a'), n + 1), p(p(v('b'), 2), n)), p(mul(v('a'), v('b')), 2 * n)); variables = { a: b, b: Math.SQRT2 }; answer = fractionAnswer(1, b ** (n - 1)); hint = `Раскрой степень произведения. Степени b сокращаются, остаётся a^${1 - n}.`; }
    else { formula = div(p(mul(num(2), num(b)), n), mul(p(num(2), n - 1), p(num(b), n - 2))); answer = String(2 * b ** 2); hint = 'Раскрой степень произведения. После сокращения остаётся 2 · b².'; }
  }
  else if (g === 3) { formula = div(p(p(num(b), n), -2), p(num(b), -2 * n - 1)); answer = String(b); hint = `Показатель числителя равен ${-2 * n}. Вычти показатель знаменателя: получается 1.`; }
  else if (g === 4) { const a = j % 2 ? -k : k; formula = sqrt(div(mul(num(16), p(v('a'), 10)), p(v('a'), 4))); variables = { a }; answer = String(4 * Math.abs(a ** 3)); hint = 'Под корнем 16a⁶ = (4a³)². Арифметический корень неотрицателен: 4|a³|.'; }
  else if (g === 5) { formula = div(mul(sqrt(num(5 * k)), sqrt(num(7 * k))), sqrt(num(35))); answer = String(k); hint = `Объедини корни: √(${5 * k} · ${7 * k} / 35) = √(${k * k}).`; }
  else if (g === 6) { const r = j % 2 ? 3 : k, rad = j % 2 ? k * k + 9 : k * k + 1; formula = mul(sub(sqrt(num(rad)), num(r)), add(sqrt(num(rad)), num(r))); answer = String(rad - r * r); hint = `(u − v)(u + v) = u² − v². Вычти ${r * r} из ${rad}.`; }
  else if (g === 7) { const rad = k + 2; formula = sub(p(add(sqrt(num(rad)), num(k)), 2), mul(num(2 * k), sqrt(num(rad)))); answer = String(rad + k * k); hint = 'Раскрой квадрат суммы. Слагаемые с корнем сокращаются; остаются два квадрата.'; }
  else if (g === 8) { const a = k - 10, bv = 2 + j % 4, c = 2 + j % 3; formula = sqrt(add(add(p(v('a'), 2), mul(num(2 * c), mul(v('a'), v('b')))), mul(num(c * c), p(v('b'), 2)))); variables = { a, b: bv }; answer = String(Math.abs(a + c * bv)); hint = `Под корнем (a + ${c}b)². Ответ равен |a + ${c}b|, даже если сумма отрицательна.`; }
  else if (j < 10) { const c = 2 + j % 3, rad = 3 + j % 4, d = 5 + j; formula = div(p(mul(num(c * k), sqrt(num(rad))), 2), num(d * rad)); answer = fractionAnswer((c * k) ** 2, d); hint = 'Возведи в квадрат коэффициент и корень, затем сократи общий множитель подкоренного числа.'; }
  else { formula = div(mul(sqrt(num(k)), sqrt(num(2 * k))), sqrt(num(k))); const correct = sqrt(num(2 * k)), wrong = [sqrt(num(2 * k + 1)), num(2 * k), num(2 * k + 1)]; choices = [...wrong]; choices.splice(j % 4, 0, correct); answer = String(j % 4 + 1); hint = `Сократи одинаковые ненулевые корни. Остаётся √(${2 * k}). Введи номер этого варианта.`; }
  const condition = variables ? ' При ' + Object.entries(variables).map(([name, value]) => `${name} = ${name === 'b' && g === 2 ? '√2' : String(value).replace('-', '−')}`).join(', ') + '.' : '';
  return { id: `oge-8-g${g + 1}-${j + 1}`, colorIndex: j, expression: (choices ? 'Укажи номер верного значения выражения.' : 'Найди значение выражения. Дробь можно ввести через /.') + condition, answer, numericTask: { formula, variables, choices }, ...(choices ? { answerMode: 'choice' as const } : {}), hint: `${hint} Ответ: ${answer}.` };
});
