import type { Problem } from './engine.ts';
import { cards, labelOrder, type Question } from './practical-shared.ts';
import { fmt, rounded, type PracticalBlock, type RouteScene } from './practical-models.ts';

function routes(i: number, grid: boolean): Problem[] {
  const mode = Math.floor(i / 4), k = 1 + Math.floor(i / 6) % 3;
  const [W, H, E] = [[16, 12, 9], [16, 12, 5], [20, 15, 8], [15, 8, 6], [21, 20, 15], [32, 24, 7]][i % 6];
  const unit = grid ? [0.5, 1, 2][Math.floor(i / 6) % 3] : k, mirror = i % 2 === 1, long = Math.hypot(W, H), short = Math.hypot(E, H);
  const labels = labelOrder(5, i + (grid ? 100 : 200));
  const names = [['Лесное', 'Речное', 'Озёрное', 'Сосновое', 'Луговое'], ['Ясное', 'Берёзово', 'Светлое', 'Дубки', 'Поляны'], ['Мирное', 'Ключи', 'Рябиновка', 'Вишнёвое', 'Садки']][i % 3];
  const scene: RouteScene = { kind: 'route', grid, unit, width: W, height: H, nodes: [
    { role: 'A', label: labels[0], x: 0, y: H }, { role: 'B', label: labels[1], x: 0, y: 0 },
    { role: 'C', label: labels[2], x: W, y: 0 }, { role: 'D', label: labels[3], x: W, y: H }, { role: 'E', label: labels[4], x: E, y: H },
  ], roads: [
    { from: 'A', to: 'B', surface: 'highway', length: H * unit }, { from: 'B', to: 'C', surface: 'highway', length: W * unit },
    { from: 'C', to: 'D', surface: 'highway', length: H * unit }, { from: 'D', to: 'E', surface: 'highway', length: (W - E) * unit },
    { from: 'E', to: 'A', surface: 'highway', length: E * unit }, { from: 'B', to: 'D', surface: 'track', length: long * unit },
    { from: 'B', to: 'E', surface: 'track', length: short * unit },
  ] };
  if (mirror) scene.nodes = scene.nodes.map(n => ({ ...n, x: W - n.x }));
  const vh = [30, 40, 60][i % 3], vt = [12, 15, 20, 25][i % 4], highway = (W + H) * unit, via = short * unit / vt + (W - E) * unit / vh;
  const prefix = grid ? 'oge-routes-grid' : 'oge-routes', title = grid ? 'Путешествие по клеткам' : 'Дороги между деревнями';
  const block: PracticalBlock = { id: `${prefix}-${i + 1}`, title: `${title} · вариант ${i + 1}`, scene, facts: { mode, vh, vt }, text: `На плане показаны пять населённых пунктов. Шоссе обозначены сплошными линиями, прямые грунтовые дороги — пунктиром. Можно двигаться в обе стороны. Пересадок, остановок и задержек нет.\n\nДеревня «${names[0]}» обозначена цифрой ${labels[0]}. Из неё путешественник едет по шоссе на север до «${names[1]}», там поворачивает ${mirror ? 'налево' : 'направо'} под прямым углом и доезжает до «${names[2]}». Следующий поворот ${mirror ? 'налево' : 'направо'} ведёт в «${names[3]}». Если возвращаться оттуда в «${names[0]}» по нижнему шоссе, по пути будет «${names[4]}». Из «${names[1]}» есть прямые грунтовые дороги в «${names[3]}» и «${names[4]}».\n\n${grid ? `Сторона клетки равна ${fmt(unit)} км. Все населённые пункты находятся в узлах сетки; расстояния определяются по клеткам.` : `Длины участков шоссе подписаны на схеме в километрах. Все повороты шоссе прямые. Схема дана без масштаба: измерять отрезки линейкой нельзя.`} Скорость по шоссе ${vh} км/ч, по грунтовой дороге ${vt} км/ч. Все дороги показаны на плане.` };
  const q: Question[] = [
    { text: `Определите номера пунктов «${names[1]}», «${names[2]}», «${names[4]}», «${names[3]}» в указанном порядке. Запишите четыре цифры без пробелов.`, value: [1, 2, 4, 3].map(j => labels[j]).join(''), sequence: true, skill: 'route-labels', solution: `Старт — ${labels[0]}. По шоссе на север: ${labels[1]}, после поворота ${mirror ? 'налево' : 'направо'}: ${labels[2]}. Внизу ${mirror ? 'слева' : 'справа'} — ${labels[3]}, промежуточный пункт нижнего шоссе — ${labels[4]}.` },
    { text: `Найдите расстояние по шоссе из «${names[1]}» в «${names[3]}» через «${names[2]}». Ответ дайте в километрах.`, value: highway, skill: 'route-highway', solution: `Складываем два участка шоссе: ${fmt(W * unit)} + ${fmt(H * unit)} = ${fmt(highway)} км.` },
    { text: `Найдите длину прямой грунтовой дороги из «${names[1]}» в «${names[mode % 2 ? 4 : 3]}». Ответ дайте в километрах.`, value: (mode % 2 ? short : long) * unit, skill: mode % 2 ? 'route-short-diagonal' : 'route-long-diagonal', solution: `Катеты прямоугольного треугольника ${fmt(H * unit)} и ${fmt((mode % 2 ? E : W) * unit)} км. По Пифагору: √(${fmt(H * unit)}² + ${fmt((mode % 2 ? E : W) * unit)}²) = ${fmt((mode % 2 ? short : long) * unit)} км.` },
    { text: `Сколько минут займёт путь из «${names[1]}» в «${names[3]}» по грунтовой дороге до «${names[4]}» и затем по шоссе? Ответ округлите до десятых.`, value: rounded(via * 60), skill: 'route-time', solution: `Время каждого участка считаем со своей скоростью: (${fmt(short * unit)} : ${vt} + ${fmt((W - E) * unit)} : ${vh}) × 60 ≈ ${fmt(rounded(via * 60))} мин.` },
  ];
  if (mode % 3 === 0) {
    const times = [highway / vh * 60, via * 60, long * unit / vt * 60];
    q.push({ text: `За какое наименьшее время можно добраться из «${names[1]}» в «${names[3]}»? Рассмотрите все дороги схемы. Ответ дайте в минутах и округлите до десятых.`, value: rounded(Math.min(...times)), skill: 'route-fastest', solution: `Маршруты: по шоссе вдоль периметра — ${fmt(rounded(times[0]))} мин; через «${names[4]}» — ${fmt(rounded(times[1]))}; напрямую — ${fmt(rounded(times[2]))}. Объезды с повторным посещением пункта дольше. Минимум ${fmt(rounded(Math.min(...times)))} мин.` });
  } else if (mode % 3 === 1) {
    const highwayFuel = 6 + i % 4, trackFuel = 8 + Math.floor(i / 3) % 4, totals = [highway * highwayFuel / 100, (short * unit * trackFuel + (W - E) * unit * highwayFuel) / 100, long * unit * trackFuel / 100];
    block.facts.highwayFuel = highwayFuel; block.facts.trackFuel = trackFuel;
    q.push({ text: `Автомобиль расходует ${highwayFuel} л на 100 км по шоссе и ${trackFuel} л на 100 км по грунтовой дороге. Найдите наименьший расход топлива для поездки из «${names[1]}» в «${names[3]}». Ответ дайте в литрах, округлив до сотых.`, value: rounded(Math.min(...totals), 2), skill: 'route-fuel', solution: `Расход = путь × норма / 100. По трём маршрутам: ${totals.map(n => fmt(n)).join('; ')} л. Выбираем минимум и округляем до сотых: ${fmt(rounded(Math.min(...totals), 2))} л.` });
  } else {
    q.push({ text: `На сколько процентов прямая грунтовая дорога из «${names[1]}» в «${names[3]}» короче пути по шоссе через «${names[2]}»? Ответ округлите до десятых.`, value: rounded((highway - long * unit) / highway * 100), skill: 'route-percent', solution: `Сравниваем с исходным путём по шоссе: (${fmt(highway)} − ${fmt(long * unit)}) : ${fmt(highway)} × 100% ≈ ${fmt(rounded((highway - long * unit) / highway * 100))}%.` });
  }
  return cards(block, q, i);
}

// Billing rules are explicit: internet overage is sold in indivisible packages.
export function tariffCost(row: string[], minutes: number, gb: number, sms: number): number {
  const n = (j: number) => Number(row[j].replace(',', '.'));
  return n(1) + Math.max(0, minutes - n(2)) * n(5) + Math.ceil(Math.max(0, gb - n(3)) / n(6)) * n(7) + Math.max(0, sms - n(4)) * n(8);
}
function tariffs(i: number): Problem[] {
  const mode = Math.floor(i / 4), rotate = (j: number) => (j + i) % 12;
  const minutes = Array.from({ length: 12 }, (_, j) => [200, 350, 500, 450, 600, 250, 400, 300, 550, 150, 400, 500][rotate(j)] + (i % 2) * 50);
  const internet = Array.from({ length: 12 }, (_, j) => [8, 12, 18, 15, 25, 10, 20, 14, 22, 6, 16, 24][rotate(j)] + i % 3 * 2);
  const sms = 80, rows = [
    ['Лайт', String(350 + i * 10), '300', '12', '50', '2,5', '1', '120', '1,5'],
    ['Баланс', String(550 + i * 10), '450', '20', '100', '2', '2', '170', '1'],
    ['Про', String(780 + i * 10), '600', '30', '150', '1,5', '5', '250', '0,5'],
  ];
  const month = 1 + i % 12, cost = tariffCost(rows[0], minutes[month - 1], internet[month - 1], sms), annual = rows.map(row => minutes.reduce((sum, m, j) => sum + tariffCost(row, m, internet[j], sms), 0));
  const block: PracticalBlock = { id: `oge-tariffs-${i + 1}`, title: `Мобильная связь · вариант ${i + 1}`, scene: { kind: 'tariff', minutes, internet }, facts: { mode, month, sms }, table: { caption: 'Стоимость тарифов: каждый столбец указывает отдельное правило', headers: ['Тариф', 'Плата, руб./мес.', 'Минуты', 'ГБ', 'SMS', 'Сверх, руб./мин', 'Доп. пакет, ГБ', 'Пакет, руб.', 'Сверх, руб./SMS'], rows }, text: `На двух графиках показаны исходящие звонки и расход интернета одного абонента за 12 месяцев. Под точками указаны месяцы от 1 (январь) до 12 (декабрь); у точек подписаны точные значения. Шкалы графиков разные: минуты и гигабайты. Каждый месяц абонент отправлял ${sms} SMS.\n\nВесь год действовал тариф «Лайт». Абонентская плата включает пакеты минут, интернета и SMS из таблицы. Сверх лимита минуты и SMS оплачиваются поштучно. Интернет сверх лимита предоставляется только целыми дополнительными пакетами: даже при частичном использовании оплачивается весь пакет. Если превышения нет, дополнительный пакет не подключается. Неиспользованные остатки в следующий месяц не переносятся. Входящие звонки бесплатны, других услуг и платежей нет.` };
  const sum = internet.reduce((s, v) => s + v, 0), max = Math.max(...internet), q: Question[] = [
    { text: 'В скольких месяцах расход минут не превышал включённый лимит тарифа «Лайт»?', value: minutes.filter(v => v <= 300).length, skill: 'tariff-count', solution: `Сравниваем все 12 значений с 300. Равенство входит в условие: месяцы ${minutes.flatMap((v, j) => v <= 300 ? [j + 1] : []).join(', ')}. Всего ${minutes.filter(v => v <= 300).length}.` },
    { text: `Сколько рублей составила полная плата по тарифу «Лайт» за месяц №${month}?`, value: cost, skill: 'tariff-bill', solution: `По графикам ${minutes[month - 1]} мин и ${internet[month - 1]} ГБ; SMS — ${sms}. К ${rows[0][1]} руб. прибавляем ${Math.max(0, minutes[month - 1] - 300)} × 2,5 руб., ${Math.ceil(Math.max(0, internet[month - 1] - 12))} пакетов по 120 руб. и 30 × 1,5 руб. за SMS. Итого ${fmt(cost)} руб.` },
    mode % 2 ? { text: 'Найдите средний месячный расход интернета за год. Ответ дайте в ГБ, округлив до десятых.', value: rounded(sum / 12), skill: 'tariff-average', solution: `Сумма 12 месячных значений ${sum} ГБ. ${sum} : 12 ≈ ${fmt(rounded(sum / 12))} ГБ.` } : { text: 'Укажите номер месяца с наибольшим расходом интернета.', value: internet.indexOf(max) + 1, skill: 'tariff-peak', solution: `Наибольшее значение ${max} ГБ, оно соответствует месяцу №${internet.indexOf(max) + 1}.` },
    { text: 'Со следующего года абонентская плата тарифа «Лайт» увеличится на 12%. Сколько рублей составит новая абонентская плата без дополнительных услуг?', value: Number(rows[0][1]) * 1.12, skill: 'tariff-percent', solution: `Повышение на 12%: ${rows[0][1]} × 1,12 = ${fmt(Number(rows[0][1]) * 1.12)} руб.` },
    { text: 'Какова наименьшая полная стоимость связи за весь год, если заранее выбрать один из трёх тарифов и не менять его 12 месяцев? Расход звонков и интернета остаётся по графикам, SMS — 80 каждый месяц.', value: Math.min(...annual), skill: 'tariff-year', solution: `Считаем каждый месяц отдельно: остатки не переносятся, дополнительные ГБ покупаются целыми пакетами. Итоги за год: ${rows.map((r, j) => `${r[0]} — ${fmt(annual[j])} руб.`).join('; ')}. Минимум ${fmt(Math.min(...annual))} руб.` },
  ];
  return cards(block, q, i);
}

function stoves(i: number): Problem[] {
  const mode = Math.floor(i / 4), length = 3 + (i % 5) * .2, width = 2 + (Math.floor(i / 5) % 4) * .2, height = i % 2 ? 2.2 : 2, doorWidth = i % 3 ? .7 : .6, doorHeight = 1.8;
  const volume = rounded(length * width * height, 6), ranges = [[6, volume - 1], [volume - 2, volume + 4], [volume - 1, volume + 3]];
  const prices = [16000 + i * 100, 21000 + i * 100, 17000 + i * 100], masses = [35 + i, 50 + i, 18 + i], labels = labelOrder(3, i + 300);
  const rows = ranges.map((r, j) => [labels[j], j === 2 ? 'Электрическая' : 'Дровяная', fmt(r[0]), fmt(r[1]), String(masses[j]), String(prices[j])]);
  const [half, archHeight] = [[30, 40], [24, 32], [21, 28], [36, 48], [27, 36]][i % 5], archWidth = half * 2, cable = 6000 + i * 50, delivery = 1000 + i * 20, discount = 10 + i % 3 * 5;
  const block: PracticalBlock = { id: `oge-stoves-${i + 1}`, title: `Печь для бани · вариант ${i + 1}`, scene: { kind: 'stove', length, width, height, doorWidth, doorHeight, archWidth, archHeight }, facts: { mode, cable, delivery, discount }, table: { caption: 'Объём помещения должен входить в диапазон, включая границы', headers: ['№ печи', 'Тип', 'Мин. объём, м³', 'Макс. объём, м³', 'Масса, кг', 'Цена, руб.'], rows }, text: `Хозяин строит парную в форме прямоугольного параллелепипеда: длина ${fmt(length)} м, ширина ${fmt(width)} м, высота ${fmt(height)} м. Окон нет. Дверной проём имеет ширину ${fmt(doorWidth)} м и высоту ${fmt(doorHeight)} м. На рисунке размеры парной даны в метрах. При подсчёте объёма место, занимаемое печью, не вычитают.\n\nВыбрать можно только печь, для которой объём парной находится между минимальным и максимальным значениями таблицы включительно. Для дровяной печи дополнительных затрат на установку нет. Для электрической требуется кабель за ${cable} руб. Доставка любой выбранной печи стоит ${delivery} руб. один раз. Скидки из отдельного вопроса действуют только в этом вопросе и не распространяются на доставку и кабель.\n\nСправа показан кожух топки. Верхний край — дуга окружности с центром O в середине нижнего основания. Ширина основания ${archWidth} см, высота прямых вертикальных боковин ${archHeight} см. Это высота до начала дуги, а не до её вершины. Все размеры кожуха даны в сантиметрах.` };
  const walls = 2 * (length + width) * height - doorWidth * doorHeight;
  const q: Question[] = [
    { text: `Установите соответствие массам ${masses[2]}, ${masses[0]}, ${masses[1]} кг и номерам печей. Запишите три цифры в указанном порядке.`, value: [2, 0, 1].map(j => labels[j]).join(''), sequence: true, skill: 'stove-labels', solution: `По строкам таблицы: ${masses[2]} кг — №${labels[2]}, ${masses[0]} кг — №${labels[0]}, ${masses[1]} кг — №${labels[1]}.` },
    { text: 'Найдите объём парной. Ответ дайте в кубических метрах.', value: volume, skill: 'stove-volume', solution: `V = длина × ширина × высота = ${fmt(length)} × ${fmt(width)} × ${fmt(height)} = ${fmt(volume)} м³.` },
    mode % 2 ? { text: 'Найдите суммарную площадь четырёх стен парной без дверного проёма. Потолок и пол не учитывайте. Ответ дайте в м².', value: walls, skill: 'stove-walls', solution: `S = 2(${fmt(length)} + ${fmt(width)}) × ${fmt(height)} − ${fmt(doorWidth)} × ${fmt(doorHeight)} = ${fmt(walls)} м².` } : { text: 'Сколько рублей стоит покупка подходящей по объёму дровяной печи с доставкой?', value: prices[1] + delivery, skill: 'stove-purchase', solution: `Объём ${fmt(volume)} м³ не входит в диапазон печи №${labels[0]}. Подходит дровяная печь №${labels[1]}. Цена с доставкой ${prices[1]} + ${delivery} = ${prices[1] + delivery} руб.` },
    mode % 3 === 2 ? { text: 'На сколько рублей подходящая дровяная печь с доставкой дешевле подходящей электрической с кабелем и доставкой? Скидки не учитывайте.', value: prices[2] + cable - prices[1], skill: 'stove-compare', solution: `Обе печи подходят. Электрическая: ${prices[2]} + ${cable} + ${delivery}; дровяная: ${prices[1]} + ${delivery}. Разность ${prices[2] + cable - prices[1]} руб.` } : { text: `На дровяную печь массой ${masses[1]} кг предоставлена скидка ${discount}%. Сколько рублей стоит сама печь после скидки?`, value: prices[1] * (1 - discount / 100), skill: 'stove-discount', solution: `Находим цену по массе: ${prices[1]} руб. После скидки ${prices[1]} × ${fmt(1 - discount / 100)} = ${fmt(prices[1] * (1 - discount / 100))} руб.` },
    { text: 'Найдите радиус R дуги кожуха топки. Ответ дайте в сантиметрах.', value: Math.hypot(half, archHeight), skill: 'stove-arch', solution: `Соединяем O с концом дуги. Катеты — половина основания ${archWidth} : 2 = ${half} см и вертикальная боковина ${archHeight} см. R = √(${half}² + ${archHeight}²) = ${fmt(Math.hypot(half, archHeight))} см.` },
  ];
  return cards(block, q, i);
}

const paperSizes = [[841, 1189], [594, 841], [420, 594], [297, 420], [210, 297], [148, 210], [105, 148]];
function paper(i: number): Problem[] {
  const mode = Math.floor(i / 4), from = i % 4, to = from + 1 + Math.floor(i / 4) % (6 - from), density = [70, 80, 90, 100, 120][i % 5], sheets = [250, 500, 100, 200][i % 4], packets = 2 + i % 4;
  const target = 2 + i % 5, missingWidth = mode % 2 === 0 || target === 5, [w, h] = paperSizes[target], count = 2 ** (to - from);
  const block: PracticalBlock = { id: `oge-paper-${i + 1}`, title: `Форматы бумаги · вариант ${i + 1}`, scene: { kind: 'paper' }, facts: { mode, from, to, target, density, sheets, packets }, table: { caption: 'Стандартные размеры листов, мм. В одной строке пропущен размер для задания №3.', headers: ['Формат', 'Меньшая сторона, мм', 'Большая сторона, мм'], rows: paperSizes.map(([a, b], j) => [`A${j}`, j === target && missingWidth ? '?' : String(a), j === target && !missingWidth ? '?' : String(b)]) }, text: `Листы серии A получают последовательным разрезанием: A1 — половина A0, A2 — половина A1 и так далее. Каждый раз разрез проходит через середины длинных сторон. Все форматы подобны, отношение длинной стороны к короткой в идеальной модели равно √2. Схема показывает раскрой A0; разные прямоугольники на ней — отдельные куски бумаги.\n\nВ таблице указаны стандартные размеры в миллиметрах. Из-за округления миллиметров они могут немного отличаться от идеальной модели. В вопросах про площадь и массу используйте идеальную площадь A0 = 1 м² и точное деление пополам, а не произведение округлённых сторон. В вопросе про пропущенный размер используйте отношение √2 и указанное округление. Потери при разрезании отсутствуют. Плотность бумаги ${density} г/м², в каждой пачке ${sheets} листов. Массу упаковки не учитывайте.` };
  const needed = 350 + i * 75, perPack = sheets * count, price = 260 + i * 5;
  const q: Question[] = [
    { text: `Сколько листов A${to} получится при разрезании одного листа A${from}?`, value: count, skill: 'paper-count', solution: `От A${from} до A${to} — ${to - from} разрезаний пополам. Число листов 2^${to - from} = ${count}.` },
    { text: `Найдите площадь одного листа A${target} в квадратных сантиметрах по идеальной модели.`, value: 10000 / 2 ** target, skill: 'paper-area', solution: `1 м² = 10 000 см². После ${target} делений пополам: 10 000 : 2^${target} = ${fmt(10000 / 2 ** target)} см².` },
    { text: `В таблице для A${target} пропущена ${missingWidth ? 'меньшая' : 'большая'} сторона. Вычислите её по отношению √2, используя другую сторону этой строки. Ответ дайте в миллиметрах и округлите до ближайшего целого.`, value: Math.round(missingWidth ? h / Math.SQRT2 : w * Math.SQRT2), skill: missingWidth ? 'paper-short-side' : 'paper-long-side', solution: `${missingWidth ? `${h} : √2` : `${w} × √2`} ≈ ${fmt(missingWidth ? h / Math.SQRT2 : w * Math.SQRT2, 3)} мм. После округления ${Math.round(missingWidth ? h / Math.SQRT2 : w * Math.SQRT2)} мм.` },
    { text: `Найдите массу ${packets} пачек бумаги A${target}, в каждой ${sheets} листов. Ответ дайте в килограммах по идеальной модели.`, value: packets * sheets * density / 2 ** target / 1000, skill: 'paper-mass', solution: `Масса = число листов × площадь листа × плотность. ${packets} × ${sheets} × (1 : 2^${target}) × ${density} : 1000 = ${fmt(packets * sheets * density / 2 ** target / 1000)} кг.` },
    { text: `Нужно получить не менее ${needed} листов A${to}. Покупают только целые пачки A${from} по ${sheets} листов за ${price} руб. пачка. Каждый лист разрезают на A${to}. Сколько рублей стоит минимальная покупка?`, value: Math.ceil(needed / perPack) * price, skill: 'paper-purchase', solution: `Один лист A${from} даёт ${count} листов A${to}, одна пачка — ${sheets} × ${count} = ${perPack}. Нужно ⌈${needed} : ${perPack}⌉ = ${Math.ceil(needed / perPack)} пачек. Стоимость ${Math.ceil(needed / perPack)} × ${price} = ${Math.ceil(needed / perPack) * price} руб.` },
  ];
  block.facts.needed = needed; block.facts.price = price;
  return cards(block, q, i);
}
export const extraPracticalPools = {
  'oge-routes-grid': Array.from({ length: 40 }, (_, i) => routes(i, true)).flat(),
  'oge-routes': Array.from({ length: 40 }, (_, i) => routes(i, false)).flat(),
  'oge-tariffs': Array.from({ length: 40 }, (_, i) => tariffs(i)).flat(),
  'oge-stoves': Array.from({ length: 40 }, (_, i) => stoves(i)).flat(),
  'oge-paper': Array.from({ length: 40 }, (_, i) => paper(i)).flat(),
};
