import type { Problem } from './engine.ts';
import type { SequenceTask } from './calculation-models.ts';
import { displayNumber as fmt } from './function-graphs.ts';
export const sequenceGroups = ['Места в заданном ряду', 'Общее число мест', 'Обратные задачи на прогрессию', 'Температура и равномерные изменения', 'Разгон: сумма расстояний', 'Торможение: сумма расстояний', 'Рост колонии', 'Распад: оставшаяся масса', 'Распад: образовавшаяся масса', 'Отскоки и строгая граница'] as const;
const pool: Problem[] = [];
const clean = (n: number) => Number(n.toFixed(8));
function add(group: number, expression: string, answer: number, hint: string, sequenceTask: SequenceTask) {
  pool.push({ id: `oge-14-g${group}-${pool.length % 20 + 1}`, expression, answer: String(clean(answer)), hint, sequenceTask, colorIndex: pool.length % 20 });
}
for (let group = 1; group <= 10; group++) for (let j = 0; j < 20; j++) {
  const k = j + 1, second = j % 2 === 1;
  if (group === 1 || group === 2) {
    const a = 14 + j, d = 2 + j % 3, n = 6 + j % 7, last = a + (n - 1) * d, sum = (a + last) * n / 2;
    add(group, group === 1 ? `В зале ${n + 3} рядов. В первом ${a} мест, в каждом следующем на ${d} больше. Сколько мест в ${n}-м ряду?` : `В зале ${n} рядов. В первом ${a} мест, в каждом следующем на ${d} больше. Сколько всего мест?`, group === 1 ? last : sum, group === 1 ? `До ${n}-го ряда нужно ${n - 1} прибавлений. aₙ=${a}+(${n}−1)·${d}=${last}.` : `Последний ряд: ${last}. Сумма Sₙ=n(a₁+aₙ)/2=${n}·(${a}+${last})/2=${sum}.`, { kind: 'arithmetic', first: a, change: d, count: n, target: group === 1 ? 'term' : 'sum' });
  } else if (group === 3) {
    if (!second) {
      const a = 12 + j, d = 2 + j % 3, n = 8, u = a + 2 * d, v = a + 6 * d;
      add(group, `Число мест в рядах зала растёт на одно и то же число. В третьем ряду ${u} мест, в седьмом ${v}. Сколько мест в первом ряду?`, a, `Разность d=(${v}−${u})/(7−3)=${d}. До третьего ряда два увеличения: a₁=${u}−2·${d}=${a}.`, { kind: 'arithmetic', first: a, change: d, count: n, target: 'first' });
    } else {
      const a = 10 + j, d = 2, n = 4 + j % 5, last = a + (n - 1) * d, sum = (a + last) * n / 2;
      add(group, `Бригада красила забор длиной ${sum} м, каждый день увеличивая норму на одно и то же число метров. За первый и последний дни вместе покрасили ${a + last} м. Сколько дней длилась работа?`, n, `Sₙ=n(a₁+aₙ)/2. Число дней n=2Sₙ/(a₁+aₙ)=2·${sum}/${a + last}=${n}.`, { kind: 'arithmetic', first: a, change: d, count: n, target: 'count' });
    }
  } else if (group === 4) {
    const n = 5 + j % 6;
    if (!second) {
      const a = -k, d = -(2 + j % 4), answer = a + n * d;
      add(group, `В начале опыта температура вещества ${fmt(a)} °C. Его равномерно охлаждают на ${-d} °C каждую минуту. Найдите температуру через ${n} минут (°C).`, answer, `Начальный момент — 0 минут. Нужно вычесть ${n}·${-d}: T=${fmt(a)}−${n}·${-d}=${fmt(answer)} °C.`, { kind: 'arithmetic', first: a, change: d, count: n + 1, target: 'term' });
    } else {
      const rate = k / 10, answer = clean(rate * n);
      add(group, `Реакция началась без осадка. Каждую минуту образуется ${fmt(rate)} г осадка. Найдите массу осадка через ${n} минут (г).`, answer, `При постоянной скорости масса равна скорости, умноженной на время: ${fmt(rate)}·${n}=${fmt(answer)} г.`, { kind: 'constant', first: rate, change: 0, count: n, target: 'sum' });
    }
  } else if (group === 5 || group === 6) {
    const n = 4 + j % 5, a = group === 5 ? (2 + j) / 10 : 30 + j, d = group === 5 ? (1 + j % 3) / 10 : -(2 + j % 3), last = clean(a + (n - 1) * d), sum = clean(n * (a + last) / 2);
    add(group, group === 5 ? `Поезд за первую секунду прошёл ${fmt(a)} м. За каждую следующую — на ${fmt(d)} м больше. Сколько метров он прошёл за первые ${n} секунд?` : `При торможении автомобиль за первую секунду проехал ${a} м. За каждую следующую — на ${-d} м меньше. Сколько метров он проехал за первые ${n} секунд?`, sum, `Расстояния за секунды образуют арифметическую прогрессию: последний член ${fmt(last)} м. Sₙ=${n}·(${fmt(a)}+${fmt(last)})/2=${fmt(sum)} м.`, { kind: 'arithmetic', first: a, change: d, count: n, target: 'sum' });
  } else if (group === 7) {
    const m = 3 + j, ratio = second ? 3 : 2, steps = 3 + j % 3, period = 10 + 5 * (j % 3), answer = m * ratio ** steps;
    add(group, `Начальная масса колонии ${m} мг. За каждые ${period} минут она увеличивается в ${ratio} раза. Найдите массу через ${period * steps} минут (мг).`, answer, `Прошло ${period * steps}/${period}=${steps} периодов. Масса m=${m}·${ratio}^${steps}=${answer} мг. Начальную массу не считаем первым увеличением.`, { kind: 'geometric', first: m, change: ratio, count: steps + 1, target: 'term' });
  } else if (group === 8 || group === 9) {
    const steps = 2 + j % 4, period = 6 + j % 5, initial = group === 8 ? 20 + j : (20 + j) * 2 ** steps, remaining = initial / 2 ** steps, answer = group === 8 ? remaining : initial - remaining;
    add(group, group === 8 ? `Масса изотопа уменьшается вдвое каждые ${period} минут. В начале ${initial} мг. Сколько миллиграммов останется через ${period * steps} минут?` : `Изотоп А превращается в стабильный Б без потери массы. Каждые ${period} минут превращается половина оставшегося А. В начале А: ${initial} мг, Б: 0 мг. Найдите массу Б через ${period * steps} минут (мг).`, answer, `Число периодов: ${period * steps}/${period}=${steps}. Осталось А: ${initial}/2^${steps}=${fmt(remaining)} мг.${group === 9 ? ` Масса Б=${initial}−${fmt(remaining)}=${fmt(answer)} мг.` : ''}`, { kind: 'geometric', first: initial, change: 0.5, count: steps + 1, target: group === 8 ? 'term' : 'converted' });
  } else {
    const ratio = second ? 2 : 3, threshold = 10 + j, n = 3 + j % 3, first = threshold * ratio ** (n - 1);
    add(group, `После первого отскока мяч поднялся на ${fmt(first / 100)} м. Каждый следующий отскок в ${ratio} раза ниже. При каком по счёту отскоке высота впервые будет строго меньше ${threshold} см?`, n + 1, `Переводим первую высоту в сантиметры: ${first} см. hₙ=${first}/${ratio}^(n−1). При отскоке ${n} высота ровно ${threshold} см, что ещё не меньше границы. При следующем, ${n + 1}-м, она меньше.`, { kind: 'geometric', first, change: 1 / ratio, count: n + 1, target: 'threshold', threshold });
  }
}
export const sequenceProblemPool: readonly Problem[] = pool;
