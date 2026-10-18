import { fmt, interval, intervalText, sq, sub, sum, taskBank, type Interval, type TaskBody } from './model.ts';

export const algebraGroups = ['Линейные уравнения со скобками', 'Квадратные уравнения', 'Уравнения с общим множителем', 'Дробно-рациональные уравнения и ОДЗ', 'Системы линейных уравнений', 'Системы: сумма и произведение', 'Квадратные неравенства', 'Дробно-рациональные неравенства', 'Системы линейных неравенств', 'Биквадратные уравнения'];
const check = ['Все преобразования равносильны или проверены.', 'Учтены ограничения и все возможные решения.', 'Результат проверен подстановкой или знаками на промежутках.'];
const body = (condition: string, values: number[], steps: TaskBody['steps'], clues: [string, string], model: TaskBody['model'], pitfall = 'Проверяй каждый перенос и не теряй решения при делении на выражение с переменной.'): TaskBody => ({ condition, answer: values.length ? values.map(fmt).join('; ') : 'Решений нет', answerSpec: values.length ? { kind: 'numbers', values } : undefined, steps, clues, checklist: check, pitfall, model });
function inequality(condition: string, intervals: Interval[], steps: TaskBody['steps'], model: TaskBody['model'], clues: [string, string], pitfall: string): TaskBody {
  return { condition, answer: intervalText(intervals), answerSpec: { kind: 'intervals', intervals }, steps, model, clues, checklist: ['Отмечены все нули и точки, где выражение не определено.', 'Проверен знак на каждом промежутке.', 'Правильно включены или исключены граничные точки.'], pitfall };
}
export const algebraTasks = taskBank(20, [
  i => {
    const a = 3 + i % 4, c = 1 + i % 2, b = 2 + i % 5, d = 1 + Math.floor(i / 5), root = i - 8, rhs = (a - c) * root - a * b - c * d;
    return body(`Решите уравнение ${a}(${sub('x', b)}) − ${c}(${sum('x', d)}) = ${fmt(rhs)}. Приведите все преобразования.`, [root], [
      { title: 'Раскрываем скобки', text: `${a}x − ${a * b} − ${c}x − ${c * d} = ${fmt(rhs)}.` },
      { title: 'Собираем подобные', text: `${a - c}x = ${fmt(rhs + a * b + c * d)}; x = ${fmt(root)}.` },
      { title: 'Проверяем', text: `В левой части при x = ${fmt(root)} получаем ${fmt(a * (root - b) - c * (root + d))}, как и справа.` },
    ], ['Сначала раскрой обе скобки, особенно скобку после минуса.', `После приведения подобных коэффициент при x равен ${a - c}.`], { family: 'linear', data: { a, b, c, d, rhs }, polynomials: [[a - c, -a * b - c * d - rhs]] });
  },
  i => {
    const r = i - 10, s = 2 + i % 7, b = -r - s, c = r * s;
    return body(`Решите уравнение x² ${b < 0 ? '−' : '+'} ${Math.abs(b)}x ${c < 0 ? '−' : '+'} ${Math.abs(c)} = 0.`, [...new Set([r, s])], [
      { title: 'Находим дискриминант', text: `D = ${sq(b)} − 4 · ${fmt(c)} = ${sq(r - s)} = ${(r - s) ** 2}.` },
      { title: 'Вычисляем корни', text: `x = (${fmt(-b)} ± ${Math.abs(r - s)})/2. Получаем ${[...new Set([r, s])].sort((a, b) => a - b).map(fmt).join(' и ')}.` },
      { title: 'Проверяем', text: `Сумма корней ${r + s}, произведение ${r * s}; при совпавших корнях записываем один корень.` },
    ], ['Используй дискриминант или теорему Виета.', `Коэффициенты: a = 1, b = ${fmt(b)}, c = ${fmt(c)}.`], { family: 'quadratic', data: { b, c }, polynomials: [[1, b, c]] });
  },
  i => {
    const a = i - 9, b = a + 2 + i % 4, c = 1 + i % 3;
    return body(`Решите уравнение (${sub('x', a)})(${sub('x', b)}) = ${c}(${sub('x', a)}).`, [...new Set([a, b + c])], [
      { title: 'Переносим влево', text: `(${sub('x', a)})[(${sub('x', b)}) − ${c}] = 0.` },
      { title: 'Решаем два уравнения', text: `${sub('x', a)} = 0 или ${sub('x', b + c)} = 0. Отсюда x = ${fmt(a)} или x = ${fmt(b + c)}.` },
      { title: 'Обосновываем полноту', text: 'Произведение равно нулю тогда и только тогда, когда хотя бы один множитель равен нулю. Оба случая рассмотрены.' },
    ], ['Сохрани общий множитель: не дели на него.', `Вынеси (${sub('x', a)}) после переноса правой части влево.`], { family: 'factor', data: { a, b, c }, polynomials: [[1, -a - b - c, a * (b + c)]] }, `Если разделить на ${sub('x', a)}, можно потерять корень ${fmt(a)}.`);
  },
  i => {
    const a = i - 8, b = a + 2 + i % 5, c = i % 4 === 0 ? a - b : a - 2 - i % 3;
    return { ...body(`Решите уравнение ((${sub('x', a)})(${sub('x', b)}))/(${sub('x', a)}) = ${fmt(c)}.`, b + c === a ? [] : [b + c], [
      { title: 'Записываем ОДЗ', text: `Знаменатель не равен нулю: x ≠ ${fmt(a)}.` },
      { title: 'Сокращаем при выполненной ОДЗ', text: `${sub('x', b)} = ${fmt(c)}; x = ${fmt(b + c)}.` },
      { title: 'Проверяем кандидата', text: `Кандидат ${fmt(b + c)} ${b + c === a ? `совпадает с запрещённым значением ${fmt(a)} и исключается. Решений нет.` : `не равен ${fmt(a)} и подходит. Ответ: ${fmt(b + c)}.`}` },
    ], ['Сначала запрети нуль знаменателя.', `Сократить (${sub('x', a)}) можно только при x ≠ ${fmt(a)}.`], { family: 'rational', data: { a, b, c }, polynomials: [[1, -b - c]], domains: [a] }, 'После сокращения исходное ограничение продолжает действовать.'), fractionDisplay: { top: `(${sub('x', a)})(${sub('x', b)})`, bottom: sub('x', a), tail: `= ${fmt(c)}` } };
  },
  i => {
    const x = i - 7, y = 1 + i % 6, a = 2 + i % 3, b = 1 + i % 2, c = 1, d = -2 - i % 4, u = a * x + b * y, v = c * x + d * y;
    return { ...body(`Решите систему:\n${a}x + ${b}y = ${fmt(u)},\nx − ${-d}y = ${fmt(v)}.`, [x, y], [
      { title: 'Выражаем неизвестное', text: `Из второго уравнения x = ${sum(`${-d}y`, v)}.` },
      { title: 'Подставляем в первое', text: `${a}(${sum(`${-d}y`, v)}) + ${b}y = ${fmt(u)}. Отсюда ${b - a * d}y = ${fmt(u - a * v)}; y = ${y}.` },
      { title: 'Находим пару и проверяем', text: `x = ${fmt(x)}. Подстановка даёт ${fmt(u)} в первом уравнении и ${fmt(v)} во втором.` },
    ], ['Систему удобно решить подстановкой.', 'Вырази x из второго уравнения, затем подставь в первое.'], { family: 'linear-system', data: { a, b, c, d, u, v, x, y } }), answer: `(x; y) = (${fmt(x)}; ${fmt(y)})`, answerSpec: undefined };
  },
  i => {
    const a = 1 + i % 5, b = a + 2 + Math.floor(i / 5), s = a + b, p = a * b;
    return { ...body(`Решите систему:\nx + y = ${s},\nxy = ${p}.`, [], [
      { title: 'Выражаем y', text: `y = ${s} − x.` },
      { title: 'Получаем квадратное уравнение', text: `x(${s} − x) = ${p}, то есть x² − ${s}x + ${p} = 0. Его корни ${a} и ${b}.` },
      { title: 'Записываем все пары', text: `При x = ${a} имеем y = ${b}; при x = ${b} имеем y = ${a}. Обе пары удовлетворяют системе.` },
    ], ['Сумма позволяет выразить одну переменную через другую.', `Подставь y = ${s} − x в уравнение произведения.`], { family: 'sum-product', data: { s, p, a, b } }), answer: `(${a}; ${b}) и (${b}; ${a})`, answerSpec: undefined };
  },
  i => {
    const a = i - 11, b = a + 3 + i % 5, closed = i % 2 === 0, outside = i % 4 >= 2, op = outside ? closed ? '≥' : '>' : closed ? '≤' : '<';
    const parts = outside ? [interval(null, a, false, closed), interval(b, null, closed)] : [interval(a, b, closed, closed)];
    return inequality(`Решите неравенство (${sub('x', a)})(${sub('x', b)}) ${op} 0. Обоснуйте выбор промежутков.`, parts, [
      { title: 'Находим нули', text: `Границы: x = ${fmt(a)} и x = ${fmt(b)}, причём ${fmt(a)} < ${fmt(b)}.` },
      { title: 'Определяем знаки', text: `При x < ${fmt(a)} оба множителя отрицательны — произведение положительно. Между корнями знак отрицателен. Правее ${fmt(b)} знак положителен.` },
      { title: 'Выбираем промежутки', text: `Нужен ${outside ? 'положительный' : 'отрицательный'} знак${closed ? ' или нуль; корни включаем' : '; корни не включаем'}. Ответ: ${intervalText(parts)}.` },
    ], { family: 'quadratic-inequality', data: { a, b, closed: Number(closed), outside: Number(outside) } }, ['Раздели прямую нулями множителей.', 'Проверь знак произведения на каждом из трёх промежутков.'], 'Нестрогий знак включает корни; строгий — исключает.');
  },
  i => {
    const a = i - 9, b = a + 2 + i % 4, c = a - 2 - i % 3, closed = i % 2 === 0, positive = i % 4 >= 2;
    const parts = positive ? [interval(c, a, false, closed), interval(b, null, closed)] : [interval(null, c), interval(a, b, closed, closed)];
    const op = positive ? closed ? '≥' : '>' : closed ? '≤' : '<';
    return { ...inequality(`Решите неравенство ((${sub('x', a)})(${sub('x', b)}))/(${sub('x', c)}) ${op} 0.`, parts, [
      { title: 'Находим критические точки', text: `ОДЗ: x ≠ ${fmt(c)}. Нули числителя: ${fmt(a)} и ${fmt(b)}. Порядок: ${fmt(c)} < ${fmt(a)} < ${fmt(b)}.` },
      { title: 'Проверяем знаки', text: `Слева направо знаки выражения: −, +, −, +. Это можно проверить подстановкой одной точки из каждого промежутка.` },
      { title: 'Записываем ответ', text: `Точку ${fmt(c)} исключаем всегда, нули числителя ${closed ? 'включаем' : 'исключаем'}. ${intervalText(parts)}.` },
    ], { family: 'rational-inequality', data: { a, b, c, closed: Number(closed), positive: Number(positive) } }, ['Не умножай неравенство на знаменатель с неизвестным знаком.', 'Отметь нули числителя и отдельно нуль знаменателя.'], 'При умножении на выражение с неизвестным знаком нужно рассматривать случаи. Метод интервалов сохраняет все ограничения.'), fractionDisplay: { top: `(${sub('x', a)})(${sub('x', b)})`, bottom: sub('x', c), tail: `${op} 0`, inequality: true } };
  },
  i => {
    const lo = i - 10, hi = lo + 3 + i % 4, a = 2 + i % 3, b = 1 + i % 4, left = i % 2 === 0, right = i % 3 === 0, parts = [interval(lo, hi, left, right)];
    return inequality(`Решите систему:\n−${a}x ${left ? '≤' : '<'} ${fmt(-a * lo)},\n${b}x ${right ? '≤' : '<'} ${fmt(b * hi)}.`, parts, [
      { title: 'Первое неравенство', text: `Делим на −${a} и меняем знак: x ${left ? '≥' : '>'} ${fmt(lo)}.` },
      { title: 'Второе неравенство', text: `Делим на положительное ${b}; знак сохраняется: x ${right ? '≤' : '<'} ${fmt(hi)}.` },
      { title: 'Пересечение', text: `Оба условия выполняются одновременно на ${intervalText(parts)}.` },
    ], { family: 'linear-inequalities', data: { lo, hi, a, b, left: Number(left), right: Number(right) } }, ['Реши каждое неравенство отдельно, затем найди пересечение.', `При делении первого неравенства на −${a} знак меняется.`], 'В системе берут пересечение, а не объединение решений.');
  },
  i => {
    const a = 1 + i % 5, b = a + 1 + Math.floor(i / 5), s = a * a + b * b, p = a * a * b * b;
    return body(`Решите уравнение x⁴ − ${s}x² + ${p} = 0.`, [-b, -a, a, b], [
      { title: 'Вводим замену', text: 'Пусть t = x². Тогда t ≥ 0 и t² − ' + s + 't + ' + p + ' = 0.' },
      { title: 'Решаем квадратное уравнение', text: `(${sub('t', a * a)})(${sub('t', b * b)}) = 0. Поэтому t = ${a * a} или t = ${b * b}; оба значения неотрицательны.` },
      { title: 'Возвращаемся к x', text: `Из x² = ${a * a} получаем x = ±${a}; из x² = ${b * b} — x = ±${b}. Все четыре корня подходят.` },
    ], ['Это квадратное уравнение относительно x².', 'Введи t = x² и обязательно запиши t ≥ 0.'], { family: 'biquadratic', data: { s, p }, polynomials: [[1, 0, -s, 0, p]] }, 'Из x² = a² получаются два корня, а не только положительный.');
  },
]);
