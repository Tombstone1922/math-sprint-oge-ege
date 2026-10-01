import type { Problem } from './engine.ts';
import { chanceRatio, ratioAnswer, setEventText, type ChanceModel, type DiceEvent, type SetEvent, type TreeModel } from './chance-models.ts';
import { displayNumber as f } from './function-graphs.ts';
export const probabilityGroups = ['Случайный выбор: доля исходов', 'Противоположное событие', 'Несовместные события и остаток', 'Выбор без возвращения', 'Кубик и монета: несколько бросков', 'Частоты и известное число орлов', 'Диаграммы Эйлера: числа и точки', 'Диаграммы Эйлера: вероятности', 'Дерево: полная вероятность', 'Дерево: пути и условие'] as const;
const pool: Problem[] = [];
function add(group: number, expression: string, chance: ChanceModel, explanation: string) {
  const [n, d] = chance.kind === 'frequency' ? [0, 1] : chanceRatio(chance);
  const answer = chance.kind === 'frequency' ? String(chance.rows.reduce((best, row, i, rows) => row[1] / row[0] > rows[best][1] / rows[best][0] ? i : best, 0) + 1) : ratioAnswer(n, d);
  pool.push({ id: `oge-10-g${group}-${pool.length % 20 + 1}`, colorIndex: pool.length % 20, expression, answer, chance, hint: `${explanation} ${chance.kind === 'frequency' ? `Ответ: стрелок ${answer}.` : `P=${f(n)}/${f(d)}=${answer.replace('.', ',')}. Дробь можно ввести через /.`}`, ...(chance.kind === 'frequency' ? { answerMode: 'choice' as const } : {}) });
}
const events: SetEvent[] = ['A', 'B', 'union', 'intersection', 'notUnion', 'notAorB', 'Aonly', 'notIntersection'];
const diceEvents: DiceEvent[] = [{ kind: 'sum', values: [4] }, { kind: 'sum', values: [5, 8] }, { kind: 'max', value: 5 }, { kind: 'min', value: 2 }, { kind: 'bothBelow', value: 4 }, { kind: 'anyBelow', value: 4 }, { kind: 'parity', even: true }, { kind: 'parity', even: false }, { kind: 'max', value: 3 }, { kind: 'bothAbove', value: 4 }];
const diceTexts = ['сумма равна 4', 'сумма равна 5 или 8', 'наибольшее число равно 5', 'наименьшее число равно 2', 'оба числа меньше 4', 'хотя бы одно число меньше 4', 'сумма чётная', 'сумма нечётная', 'наибольшее число равно 3', 'оба числа больше 4'];
for (let group = 1; group <= 10; group++) for (let j = 0; j < 20; j++) {
  const k = j + 1;
  if (group === 1) {
    const total = 20 + 5 * j, good = k + 2, kind = j % 4;
    const text = kind === 0 ? `Из ${total} подарков ${good} — пазлы с машинами. Подарки раздают случайно. Найдите вероятность получить пазл с машиной.` : kind === 1 ? `В коробке ${good} пакетиков зелёного чая и ${total - good} чёрного. Один выбирают наугад. Найдите вероятность выбрать зелёный чай.` : kind === 2 ? `Для заказа случайно выбирают одну из ${total} свободных машин такси; ${good} из них жёлтые. Найдите вероятность выбора жёлтой машины.` : `На жеребьёвке ${total} спортсменов, ${good} из Швеции. Все порядки равновероятны. Найдите вероятность, что последним стартует спортсмен из Швеции.`;
    add(group, text, { kind: 'finite', weights: [good, total - good], selected: [0] }, `У каждого участника или предмета одинаковый шанс: благоприятных исходов ${good}, всего ${total}.`);
  } else if (group === 2) {
    const bad = k + 2;
    add(group, j % 2 ? `Из 100 экзаменационных билетов ученик не выучил ${bad}. Билет выбирают случайно. Найдите вероятность получить выученный билет.` : `Вероятность неисправности новой ручки равна ${f(bad / 100)}. Найдите вероятность, что случайно выбранная ручка исправна.`, { kind: 'finite', weights: [bad, 100 - bad], selected: [1] }, `Исправность и неисправность (выученный и невыученный билет) — противоположные события. P=1−${f(bad / 100)}.`);
  } else if (group === 3) {
    const red = k + 2, green = k + 3, violet = k + 4, blue = k + 10, total = red + green + violet + 2 * blue;
    const selected = j % 2 ? [3, 4] : [0, 4];
    add(group, `В магазине ${total} ручек: ${red} красных, ${green} зелёных, ${violet} фиолетовых. Остальные синие и чёрные, их поровну. Ручку выбирают случайно. Найдите вероятность выбрать ${j % 2 ? 'синюю или чёрную' : 'красную или чёрную'}.`, { kind: 'finite', weights: [red, green, violet, blue, blue], selected }, `Осталось ${total}−${red}−${green}−${violet}=${2 * blue} ручек, каждого из двух цветов по ${blue}. Нужные цвета не пересекаются, поэтому складываем их количества.`);
  } else if (group === 4) {
    const yellow = k + 3, green = k + 5;
    add(group, `В ящике ${yellow} жёлтых и ${green} зелёных карандашей. Два выбирают случайно без возвращения. Известно, что первый зелёный. Найдите вероятность, что второй ${j % 2 ? 'жёлтый' : 'зелёный'}.`, { kind: 'urn', counts: [yellow, green], first: 1, target: j % 2 ? 0 : 1 }, `После первого выбора осталось ${yellow + green - 1} карандашей: ${yellow} жёлтых и ${green - 1} зелёных. Вероятность считаем по оставшимся предметам.`);
  } else if (group === 5) {
    if (j < 10) add(group, `Симметричный шестигранный кубик бросают дважды. Найдите вероятность события «${diceTexts[j]}».`, { kind: 'dice', event: diceEvents[j] }, 'Есть 36 равновероятных упорядоченных пар. Первый и второй броски различаются: например, (1; 3) и (3; 1) — разные исходы. Считаем подходящие пары.');
    else {
      const i = j - 10, n = 3 + Math.floor(i / 2), heads = 1 + Math.floor(i / 2), atLeast = i % 2 === 1;
      add(group, `Симметричную монету бросают ${n} раза. Найдите вероятность, что орёл выпадет ${atLeast ? 'не менее' : 'ровно'} ${heads} раза.`, { kind: 'coins', n, heads, atLeast }, `Каждая последовательность имеет одинаковый шанс. Всего 2^${n}=${2 ** n} последовательностей; считаем те, где орлов ${atLeast ? 'не меньше' : 'ровно'} ${heads}.`);
    }
  } else if (group === 6) {
    if (j < 10) {
      const winner = j % 4, shots = 40 + 4 * j;
      const rows: [number, number][] = Array.from({ length: 4 }, (_, i) => [shots + 4 * i, (shots + 4 * i) * (i === winner ? 0.75 : i % 2 ? 0.5 : 0.25)]);
      add(group, 'В таблице результаты четырёх стрелков. Тренер выбирает стрелка с наибольшей относительной частотой попаданий. Запишите его номер (1–4).', { kind: 'frequency', rows }, `Для каждого стрелка делим попадания на число выстрелов: ${rows.map((r, i) => `${i + 1}) ${r[1]}/${r[0]}=${f(r[1] / r[0])}`).join('; ')}. Сравниваем доли, а не число попаданий.`);
    } else {
      const n = 20 + 5 * (j - 10), heads = j - 5, position = 3 + j - 10;
      add(group, `Симметричную монету бросили ${n} раз. Известно, что орёл выпал ровно ${heads} раз. Найдите вероятность решки в ${position}-м броске при этом условии. Все последовательности с указанным числом орлов равновероятны.`, { kind: 'finite', weights: [heads, n - heads], selected: [1] }, `При условии заданного числа орлов все позиции равноправны. Решек ${n - heads} из ${n}, поэтому условная вероятность равна их доле.`);
    }
  } else if (group === 7 || group === 8) {
    const event = events[j % events.length];
    const display = group === 7 ? j < 10 ? 'counts' : 'points' : j < 10 ? 'probabilities' : 'weighted-points';
    const counts = j < 10 ? [k + 1, 2 + j % 4, 3 + j % 5, 5 + j] : [2 + j % 4, 1 + j % 3, 3 + j % 5, 2 + j % 4];
    const probabilities = [5 + j, 15 + j, 10 + j, 70 - 3 * j].map(n => n / 100);
    const regions = (group === 7 ? counts.map(n => display === 'points' ? Array.from({ length: n }, () => 1) : [n]) : probabilities.map(n => display === 'weighted-points' ? [n / 2, n / 2] : [n])) as [number[], number[], number[], number[]];
    const description = display === 'counts' ? 'Числа обозначают количество равновероятных исходов в каждой области.' : display === 'points' ? 'Каждая точка — один равновероятный исход.' : display === 'probabilities' ? 'В областях указаны их вероятности.' : 'Рядом с каждой точкой указана вероятность этого исхода. Исходы не обязаны быть равновероятными.';
    add(group, `На диаграмме события A и B. ${description} Найдите вероятность события «${setEventText[event]}».`, { kind: 'venn', display, regions, event }, `Выбираем области, удовлетворяющие условию «${setEventText[event]}». Пересечение A и B учитывается один раз. ${group === 7 ? 'Складываем нужные количества и делим на общее число исходов, включая внешнюю область.' : 'Складываем вероятности нужных областей или точек; сумма вероятностей всех исходов равна 1.'}`);
  } else {
    const first = (j + 2) / 25, afterA = (j + 3) / 25, afterNotA = (j + 5) / 50;
    const event: TreeModel['event'] = group === 9 ? j % 2 ? 'notB' : 'B' : (['AandB', 'notAandB', 'AgivenB', 'AgivenNotB'] as const)[j % 4];
    const query = { B: 'P(B)', notB: 'P(не B)', AandB: 'P(A и B)', notAandB: 'P(не A и B)', AgivenB: 'P(A при условии B)', AgivenNotB: 'P(A при условии не B)' }[event];
    add(group, `На рисунке дерево случайного опыта. Числа на ветвях — вероятности соответствующих переходов. Найдите ${query}.`, { kind: 'tree', first, afterA, afterNotA, event }, `Вероятность пути — произведение вероятностей на его ветвях. P(A и B)=${f(first)}·${f(afterA)}, P(не A и B)=${f(1 - first)}·${f(afterNotA)}. ${event === 'AgivenB' ? 'P(A|B)=P(A и B)/P(B), где P(B) — сумма двух путей к B.' : event === 'AgivenNotB' ? 'P(A|не B)=P(A и не B)/P(не B). В числителе: P(A)·(1−P(B после A)); в знаменателе — сумма путей к не B.' : event === 'AandB' || event === 'notAandB' ? 'Для указанного совместного события берём один соответствующий путь.' : 'Для события B складываем два ведущих к B пути; для не B используем противоположное событие.'}`);
  }
}
export const probabilityProblemPool: readonly Problem[] = pool;
