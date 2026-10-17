import { extraPracticalPools } from './oge-practical-extra.ts';
import { cards, labelOrder, type Question } from './practical-shared.ts';
import type { Problem } from './engine.ts';
import { area, perimeter, mirroredScene, rectangleDistance, fmt, rounded, type PlanRoom, type PlanScene, type PracticalBlock } from './practical-models.ts';
export type { PracticalBlock, PracticalScene, PracticalQuestion, PlanRoom } from './practical-models.ts';
export const isPracticalModule = (id: string) => id in practicalPools;

function apartment(i: number): Problem[] {
  const a = 6 + 2 * (i % 2), b = a + 4, c = a + 2, t = 10 + 2 * (Math.floor(i / 2) % 2), bottom = 4, unit = i % 5 === 4 ? 0.4 : 0.5;
  const W = a + b + c, H = t + bottom, labels = labelOrder(8, i), mirror = Math.floor(i / 4) % 2 === 1;
  const raw: PlanScene = { kind: 'plan', theme: 'apartment', width: W, height: H, unit, mirrored: mirror, paving: [], rooms: [
    { role: 'kitchen', label: labels[0], x: 0, y: 2, w: a, h: t - 2 }, { role: 'bedroom', label: labels[1], x: a + b, y: 2, w: c, h: t - 2 },
    { role: 'living', label: labels[2], x: a, y: 0, w: b, h: t }, { role: 'corridor', label: labels[3], x: a, y: t, w: b, h: bottom },
    { role: 'bathroom', label: labels[4], x: 0, y: t, w: a, h: bottom }, { role: 'storage', label: labels[5], x: a + b, y: t, w: c, h: bottom },
    { role: 'kitchen-balcony', label: labels[6], x: 0, y: 0, w: a, h: 2 }, { role: 'bedroom-balcony', label: labels[7], x: a + b, y: 0, w: c, h: 2 },
  ], openings: [
    { x: a + b / 2 - 1, y: H, length: 2, axis: 'h', from: 'outside', to: 'corridor', kind: 'door' },
    { x: a, y: t + 1, length: 2, axis: 'v', from: 'corridor', to: 'bathroom', kind: 'door' },
    { x: a + b, y: t + 1, length: 2, axis: 'v', from: 'corridor', to: 'storage', kind: 'door' },
    { x: a + b / 2 - 1, y: t, length: 2, axis: 'h', from: 'corridor', to: 'living', kind: 'door' },
    { x: a, y: 5, length: 2, axis: 'v', from: 'living', to: 'kitchen', kind: 'door' },
    { x: a + b, y: 5, length: 2, axis: 'v', from: 'living', to: 'bedroom', kind: 'door' },
    { x: a / 2 - 1, y: 2, length: 2, axis: 'h', from: 'kitchen', to: 'kitchen-balcony', kind: 'door' },
    { x: a + b + c / 2 - 1, y: 2, length: 2, axis: 'h', from: 'bedroom', to: 'bedroom-balcony', kind: 'door' },
    { x: 1, y: 0, length: a - 2, axis: 'h', from: 'kitchen-balcony', to: 'outside', kind: 'window' },
    { x: a + 2, y: 0, length: b - 4, axis: 'h', from: 'living', to: 'outside', kind: 'window' },
    { x: a + b + 1, y: 0, length: c - 2, axis: 'h', from: 'bedroom-balcony', to: 'outside', kind: 'window' },
  ] };
  const scene = mirroredScene(raw), byRole = (role: string) => scene.rooms.find(r => r.role === role)!;
  const mode = Math.floor(i / 4), tileRoles = ['kitchen', 'bathroom', 'corridor'], tileNames = ['кухни', 'санузла', 'коридора'];
  const tileRole = tileRoles[mode % 3], tileName = tileNames[mode % 3], tileSide = i % 2 ? 40 : 50, pack = 8 + i % 5;
  const tileArea = area(byRole(tileRole)) * unit ** 2, tileCount = Math.ceil(rounded(tileArea / (tileSide / 100) ** 2, 8));
  const areaRoles = ['bedroom', 'living', 'kitchen-balcony'], areaNames = ['спальни', 'гостиной', 'лоджии, в которую можно попасть из кухни'];
  const areaRole = areaRoles[mode % 3], areaName = areaNames[mode % 3], s = area(byRole(areaRole)) * unit ** 2;
  const block: PracticalBlock = { id: `oge-apartment-${i + 1}`, title: `Квартира · вариант ${i + 1}`, scene, facts: { tileSide, pack, mode, tileRoleIndex: mode % 3, areaRoleIndex: mode % 3 }, text: `На рисунке изображён план двухкомнатной квартиры. Сторона каждой клетки соответствует ${fmt(unit)} м. Толщиной стен и площадью дверных проёмов при вычислениях пренебрегайте.\n\nВход в квартиру находится в коридоре и показан стрелкой. Если войти в квартиру, ${mirror ? 'справа' : 'слева'} находится санузел, а на другом конце коридора — кладовая. Из коридора можно пройти в гостиную — самое большое помещение квартиры. Из гостиной двери ведут в кухню и спальню; кухня имеет меньшую площадь, чем спальня. Из кухни и спальни можно выйти на отдельные застеклённые лоджии.\n\nНа плане обозначены все двери и окна. Пол ${tileName} планируется покрыть квадратной плиткой ${tileSide} × ${tileSide} см, которая продаётся в упаковках по ${pack} штук. Плитку можно резать, обрезки использовать повторно; запас плитки не требуется.` };
  const q: Question[] = [
    { text: 'Определите номера помещений: кухня, спальня, кладовая, гостиная. Запишите четыре цифры в указанном порядке без пробелов.', value: ['kitchen', 'bedroom', 'storage', 'living'].map(r => byRole(r).label).join(''), skill: 'apartment-labels', sequence: true, solution: `Вход ведёт в коридор ${byRole('corridor').label}. На его концах — санузел и кладовая ${byRole('storage').label}. Самое большое помещение — гостиная ${byRole('living').label}. Из неё выходят в меньшую кухню ${byRole('kitchen').label} и спальню ${byRole('bedroom').label}.` },
    { text: `Сколько целых упаковок плитки необходимо купить для пола ${tileName}?`, value: Math.ceil(tileCount / pack), skill: 'apartment-tiles', solution: `Площадь пола ${fmt(tileArea)} м², одной плитки ${fmt((tileSide / 100) ** 2)} м². Нужно ${tileCount} плиток. Упаковок: ${tileCount} : ${pack}, округляем вверх → ${Math.ceil(tileCount / pack)}.` },
    { text: `Найдите площадь ${areaName}. Ответ дайте в квадратных метрах.`, value: s, skill: 'apartment-area', solution: `На плане ${byRole(areaRole).w} × ${byRole(areaRole).h} клеток. Площадь клетки ${fmt(unit ** 2)} м². S = ${byRole(areaRole).w} × ${byRole(areaRole).h} × ${fmt(unit ** 2)} = ${fmt(s)} м².` },
  ];
  if (mode % 3 === 0) {
    const percent = rounded((area(byRole('bedroom')) / area(byRole('kitchen')) - 1) * 100);
    q.push({ text: 'На сколько процентов площадь спальни больше площади кухни? Ответ округлите до десятых.', value: percent, skill: 'apartment-percent', solution: `Разность площадей делим на площадь кухни — именно с ней сравнивают. (${fmt(area(byRole('bedroom')) * unit ** 2)} − ${fmt(area(byRole('kitchen')) * unit ** 2)}) : ${fmt(area(byRole('kitchen')) * unit ** 2)} × 100% ≈ ${fmt(percent)}%.` });
  } else if (mode % 3 === 1) {
    const r = byRole('bedroom'), diagonal = rounded(Math.hypot(r.w, r.h) * unit);
    q.push({ text: 'Найдите длину диагонали спальни в метрах. Ответ округлите до десятых.', value: diagonal, skill: 'apartment-diagonal', solution: `Размеры спальни ${fmt(r.w * unit)} и ${fmt(r.h * unit)} м. По теореме Пифагора d = √(${fmt(r.w * unit)}² + ${fmt(r.h * unit)}²) ≈ ${fmt(diagonal)} м.` });
  } else {
    const r = byRole('living');
    q.push({ text: 'В гостиной устанавливают плинтус вдоль всех стен, кроме дверных проёмов. Ширина каждого из трёх проёмов — две клетки. Сколько метров плинтуса потребуется?', value: (perimeter(r) - 6) * unit, skill: 'apartment-skirting', solution: `Периметр гостиной ${fmt(perimeter(r) * unit)} м. Вычитаем три проёма по ${fmt(2 * unit)} м: ${fmt((perimeter(r) - 6) * unit)} м.` });
  }
  if (mode % 2 === 0) {
    const usage = 35 + (i % 8) * 5, fees = [450 + 5 * i, 650 + 5 * i, 900 + 5 * i], limits = [30, 60, 100], rates = [20, 10, 0];
    const costs = fees.map((fee, j) => fee + Math.max(0, usage - limits[j]) * rates[j]);
    q.push({ text: `В квартиру подключают интернет. При расходе ${usage} ГБ в месяц выберите самый дешёвый тариф по таблице. Сколько рублей составит плата за месяц?`, value: Math.min(...costs), skill: 'apartment-tariff', table: { headers: ['Тариф', 'Плата, руб./мес.', 'Включено, ГБ', 'Сверх лимита, руб./ГБ'], rows: fees.map((f, j) => [['Старт', 'Дом', 'Максимум'][j], String(f), String(limits[j]), String(rates[j])]) }, solution: `Полная плата = абонентская плата + превышение лимита × цена за ГБ. При ${usage} ГБ получаем: ${costs.join('; ')} руб. Минимум ${Math.min(...costs)} руб.` });
    block.facts.usage = usage;
  } else {
    const cover = [1.8, 2.4, 3], prices = [1100 + i * 20, 1450 + i * 20, 1900 + i * 20], delivery = [600, 0, 300], target = area(byRole('bedroom')) * unit ** 2;
    const costs = cover.map((v, j) => Math.ceil(rounded(target / v, 8)) * prices[j] + delivery[j]);
    q.push({ text: 'Для спальни покупают ламинат. Выберите самое дешёвое предложение с учётом целых упаковок и разовой доставки. Сколько рублей нужно заплатить? Запас и отходы не учитывайте.', value: Math.min(...costs), skill: 'apartment-laminate', table: { headers: ['Магазин', 'В упаковке, м²', 'Упаковка, руб.', 'Доставка, руб.'], rows: cover.map((v, j) => [String(j + 1), fmt(v), String(prices[j]), String(delivery[j])]) }, solution: `Площадь спальни ${fmt(target)} м². Для каждого магазина округляем число упаковок вверх и прибавляем доставку. Итоги: ${costs.join('; ')} руб. Выбираем ${Math.min(...costs)} руб.` });
  }
  return cards(block, q, i);
}

function plot(i: number): Problem[] {
  const W = 24 + 2 * (i % 3), H = 18 + 2 * (Math.floor(i / 3) % 3), hw = 6 + i % 3, unit = 2, labels = labelOrder(7, 50 + i), mode = Math.floor(i / 4), mirror = i % 2 === 1;
  const house: PlanRoom = { role: 'house', label: labels[0], x: 3, y: 3, w: hw, h: 6, polygon: [{ x: 3, y: 3 }, { x: 3 + hw, y: 3 }, { x: 3 + hw, y: 7 }, { x: 6, y: 7 }, { x: 6, y: 9 }, { x: 3, y: 9 }] };
  const scene = mirroredScene({ kind: 'plan', theme: 'plot', width: W, height: H, unit, mirrored: mirror, rooms: [house,
    { role: 'garage', label: labels[1], x: 2, y: H - 5, w: 4, h: 3 }, { role: 'shed', label: labels[2], x: W - 5, y: H - 4, w: 3, h: 2 },
    { role: 'bath', label: labels[3], x: W - 6, y: 3, w: 4, h: 3 }, { role: 'garden', label: labels[4], x: W - 12, y: 8, w: 7, h: 4 },
    { role: 'greenhouse', label: labels[5], x: W - 11, y: 9, w: 5, h: 2 }, { role: 'orchard', label: labels[6], x: 1, y: 10, w: 5, h: 3 },
  ], paving: [{ x: 6, y: H - 6, w: W - 9, h: 2 }, { x: W / 2 - 1, y: H - 4, w: 2, h: 4 }, { x: W - 4, y: 6, w: 1, h: H - 12 }, { x: hw + 2, y: 7, w: 1, h: H - 13 }], openings: [{ x: W / 2 - 1, y: H, length: 2, axis: 'h', kind: 'gate', from: 'outside', to: 'yard' }] });
  const role = (r: string) => scene.rooms.find(v => v.role === r)!;
  const tileSide = i % 2 ? 50 : 40, pack = 10 + i % 4 * 2;
  const pavedArea = scene.paving.reduce((sum, r) => sum + r.w * r.h, 0) * unit ** 2;
  const block: PracticalBlock = { id: `oge-plot-${i + 1}`, title: `Дачный участок · вариант ${i + 1}`, scene, facts: { tileSide, pack, mode }, text: `На плане изображён прямоугольный дачный участок. Сторона клетки равна ${unit} м. Вход и въезд возможны только через ворота, показанные стрелкой. Все границы проходят по линиям сетки.\n\nЕсли войти на участок, ${mirror ? 'справа' : 'слева'} от ворот находится гараж, а на другой стороне — сарай. В глубине участка напротив гаража стоит жилой дом с выступающей частью. По другую сторону в глубине находится баня. Перед домом расположены яблоневые посадки, обозначенные кружками. Огород обозначен цифрой ${role('garden').label}; внутри него построена теплица.\n\nСерым цветом выделены дорожки и площадка; они целиком покрыты квадратной плиткой ${tileSide} × ${tileSide} см. В упаковке ${pack} плиток. Запас и потери при укладке не учитывайте. К участку подведены электричество и газ.` };
  const q: Question[] = [
    { text: 'Определите номера объектов: жилой дом, баня, гараж, теплица. Запишите четыре цифры в указанном порядке.', value: ['house', 'bath', 'garage', 'greenhouse'].map(r => role(r).label).join(''), skill: 'plot-labels', sequence: true, solution: `От ворот находим гараж ${role('garage').label} и сарай. Напротив гаража стоит дом ${role('house').label}; с другой стороны в глубине — баня ${role('bath').label}. Внутри огорода ${role('garden').label} находится теплица ${role('greenhouse').label}.` },
    { text: 'Сколько целых упаковок плитки нужно для всех дорожек и площадки, выделенных серым цветом?', value: Math.ceil(rounded(pavedArea / (tileSide / 100) ** 2 / pack, 8)), skill: 'plot-tiles', solution: `Площадь серых прямоугольников: ${scene.paving.map(r => `${r.w} × ${r.h}`).join(' + ')} = ${pavedArea / unit ** 2} клеток, то есть ${pavedArea} м². Делим на ${fmt((tileSide / 100) ** 2)} м² и на ${pack}, затем округляем вверх.` },
    { text: mode % 2 ? 'Найдите периметр фундамента жилого дома. Ответ дайте в метрах.' : 'Найдите площадь, которую занимает жилой дом. Ответ дайте в квадратных метрах.', value: mode % 2 ? perimeter(role('house')) * unit : area(role('house')) * unit ** 2, skill: mode % 2 ? 'plot-perimeter' : 'plot-area', solution: mode % 2 ? `Складываем длины всех шести сторон контура: ${perimeter(role('house'))} клеток. Периметр ${perimeter(role('house'))} × ${unit} = ${perimeter(role('house')) * unit} м.` : `Разбиваем дом на прямоугольник ${hw} × 4 клетки и выступ 3 × 2 клетки. S = (${hw} × 4 + 3 × 2) × ${unit ** 2} = ${area(role('house')) * unit ** 2} м².` },
  ];
  if (mode % 2 === 0) {
    const distance = (H - 5 - 9) * unit;
    q.push({ text: 'Найдите наименьшее расстояние по прямой между домом и гаражом — между ближайшими точками их контуров. Ответ дайте в метрах.', value: distance, skill: 'plot-house-garage', solution: `Выступ дома и гараж перекрываются по горизонтали. Между ближайшими горизонтальными границами ${H - 14} клеток. Расстояние ${H - 14} × ${unit} = ${distance} м.` });
  } else {
    const distance = rounded(rectangleDistance(role('garage'), role('bath')) * unit);
    q.push({ text: 'Найдите наименьшее расстояние по прямой между гаражом и баней — между ближайшими точками их контуров. Ответ дайте в метрах, округлив до десятых.', value: distance, skill: 'plot-garage-bath', solution: `Горизонтальный промежуток ${W - 12} клеток, вертикальный ${H - 11} клеток. По теореме Пифагора d = 2√(${W - 12}² + ${H - 11}²) ≈ ${fmt(distance)} м.` });
  }
  if (mode % 2 === 0) {
    const gasFlow = 1.5 + i % 3 * 0.1, gasRate = 8, power = 6, electricRate = 6, saving = power * electricRate - gasFlow * gasRate, hours = 500 + i * 20;
    const electricBoiler = 18000 + i * 100, electricInstall = 10000, gasInstall = 14000, gasBoiler = electricBoiler + electricInstall + saving * hours - gasInstall;
    q.push({ text: 'Хозяин выбирает отопление по таблице. Через сколько часов работы экономия на топливе полностью возместит более высокую стоимость покупки и монтажа газового отопления?', value: hours, skill: 'plot-heating', table: { headers: ['Отопление', 'Котёл, руб.', 'Монтаж, руб.', 'Расход за час', 'Цена единицы'], rows: [['Газ', fmt(gasBoiler), String(gasInstall), `${fmt(gasFlow)} м³`, `${gasRate} руб./м³`], ['Электричество', String(electricBoiler), String(electricInstall), `${power} кВт·ч`, `${electricRate} руб./(кВт·ч)`]] }, solution: `За час газ стоит ${fmt(gasFlow * gasRate)} руб., электричество — ${power * electricRate} руб. Экономия ${fmt(saving)} руб./ч. Разность затрат на оборудование с монтажом ${fmt(saving * hours)} руб. Срок окупаемости ${fmt(saving * hours)} : ${fmt(saving)} = ${hours} ч.` });
  } else {
    const length = 2 * (W + H) * unit - 4, rate = [900 + i * 10, 1050 + i * 10, 980 + i * 10], delivery = [8000, 0, 3000], totals = rate.map((p, j) => p * length + delivery[j]);
    q.push({ text: 'Участок ограждают забором, кроме ворот шириной 4 м. Выберите самую дешёвую фирму по таблице, учитывая разовую доставку. Сколько рублей будет стоить заказ? Ворота оплачиваются отдельно.', value: Math.min(...totals), skill: 'plot-fence', table: { headers: ['Фирма', 'Забор с монтажом, руб./м', 'Доставка, руб.'], rows: rate.map((p, j) => [String(j + 1), String(p), String(delivery[j])]) }, solution: `Периметр участка ${2 * (W + H) * unit} м. Без ворот нужно ${length} м забора. Считаем для каждой фирмы длина × цена + доставка: ${totals.join('; ')} руб. Минимум ${Math.min(...totals)} руб.` });
  }
  return cards(block, q, i);
}

function tyres(i: number): Problem[] {
  const bases = [[185, 60, 15], [195, 65, 15], [205, 55, 16], [215, 60, 16], [225, 55, 17], [235, 55, 18], [245, 45, 18], [205, 60, 16]];
  const [width, ratio, rim] = bases[i % bases.length], side = width * ratio / 100, disk = rim * 25.4, diameter = disk + 2 * side, mode = Math.floor(i / 4);
  const widths = Array.from({ length: 5 }, (_, j) => width - 20 + j * 10), rims = [rim - 1, rim, rim + 1, rim + 2];
  const allowed: { width: number; ratio: number; rim: number }[] = [];
  const rows = widths.map(w => [String(w), ...rims.map(r => {
    const profile = w === width && r === rim ? ratio : Math.round((diameter - r * 25.4) / (2 * w) * 100 / 5) * 5;
    const D = r * 25.4 + 2 * w * profile / 100;
    if (profile < 30 || profile > 80 || Math.abs(D - diameter) > 19 || (w === widths[0] && r === rims[3])) return '—';
    allowed.push({ width: w, ratio: profile, rim: r });
    return `${w}/${profile}`;
  })]);
  const choices = allowed.filter(v => v.rim === rim + 1), minWidth = Math.min(...choices.map(v => v.width)), maxWidth = Math.max(...choices.map(v => v.width));
  const replacement = [...allowed].filter(v => v.width !== width || v.ratio !== ratio || v.rim !== rim).sort((a, b) => (b.rim * 25.4 + 2 * b.width * b.ratio / 100) - (a.rim * 25.4 + 2 * a.width * a.ratio / 100))[0];
  const newD = replacement.rim * 25.4 + 2 * replacement.width * replacement.ratio / 100, marking = `${replacement.width}/${replacement.ratio} R${replacement.rim}`;
  const block: PracticalBlock = { id: `oge-tyres-${i + 1}`, title: `Автомобильные шины · вариант ${i + 1}`, scene: { kind: 'tyre', width, ratio, rim }, table: { caption: 'Разрешённые сочетания ширины, профиля и диаметра диска', headers: ['Ширина, мм', ...rims.map(r => `Диск ${r}″`)], rows }, facts: { mode, newWidth: replacement.width, newRatio: replacement.ratio, newRim: replacement.rim }, text: `Автомобильное колесо состоит из диска и шины. Для маркировки используют запись вида ${width}/${ratio} R${rim}. Первое число — ширина B в миллиметрах, второе — отношение высоты боковины H к ширине B в процентах. Буква R обозначает радиальную конструкцию шины, а число после неё — диаметр диска d в дюймах. Один дюйм равен 25,4 мм.\n\nЗавод устанавливает шины ${width}/${ratio} R${rim}. Внешний диаметр колеса D складывается из диаметра диска в миллиметрах и двух высот боковины. На рисунке отдельно показаны вид колеса сбоку и поперечное сечение. Рисунок схематический: нужные размеры вычисляют по маркировке.\n\nТаблица содержит все разрешённые производителем размеры для этого учебного варианта. В ячейках указаны ширина и профиль; диаметр диска задан заголовком столбца. Прочерк означает, что сочетание не разрешено.` };
  const q: Question[] = [
    { text: `Какова ${mode % 2 ? 'наибольшая' : 'наименьшая'} разрешённая ширина шины для диска ${rim + 1} дюймов? Ответ дайте в миллиметрах.`, value: mode % 2 ? maxWidth : minWidth, skill: mode % 2 ? 'tyre-max' : 'tyre-min', solution: `В столбце «Диск ${rim + 1}″» исключаем прочерки. Разрешённые ширины: ${choices.map(v => v.width).join(', ')} мм. Выбираем ${mode % 2 ? maxWidth : minWidth} мм.` },
    { text: 'Найдите высоту боковины заводской шины. Ответ дайте в миллиметрах.', value: side, skill: 'tyre-side', solution: `H = B × профиль / 100 = ${width} × ${ratio} / 100 = ${fmt(side)} мм.` },
    { text: mode % 2 ? 'Найдите внешний диаметр заводского колеса. Ответ дайте в миллиметрах.' : 'Найдите диаметр заводского диска. Ответ дайте в миллиметрах.', value: mode % 2 ? diameter : disk, skill: mode % 2 ? 'tyre-diameter' : 'tyre-disk', solution: mode % 2 ? `D = ${rim} × 25,4 + 2 × ${fmt(side)} = ${fmt(diameter)} мм. Высота боковины учитывается дважды.` : `Диаметр диска ${rim} дюймов. ${rim} × 25,4 = ${fmt(disk)} мм.` },
  ];
  if (mode % 2 === 0) {
    const percent = rounded((newD / diameter - 1) * 100);
    q.push({ text: `На сколько процентов увеличится внешний диаметр колеса при замене заводской шины на ${marking}? Ответ округлите до десятых.`, value: percent, skill: 'tyre-percent', solution: `Новый диаметр ${fmt(newD)} мм, исходный ${fmt(diameter)} мм. (${fmt(newD)} − ${fmt(diameter)}) : ${fmt(diameter)} × 100% ≈ ${fmt(percent)}%.` });
  } else {
    const turns = Math.round(1000000 / (3.14 * diameter));
    q.push({ text: 'Сколько оборотов совершит заводское колесо на пути 1 км? Примите π = 3,14. Ответ округлите до ближайшего целого числа.', value: turns, skill: 'tyre-turns', solution: `Длина окружности 3,14 × ${fmt(diameter)} мм. В километре 1 000 000 мм. Делим путь на длину окружности и округляем: ${turns} оборотов.` });
  }
  if (mode % 3 === 0) {
    const cost = [650 + 10 * i, 720 + 10 * i, 590 + 10 * i], discount = [0, 10, 0], extra = [0, 0, 400];
    const totals = cost.map((price, j) => 4 * price * (100 - discount[j]) / 100 + extra[j]);
    q.push({ text: 'Нужно выполнить шиномонтаж четырёх колёс. По таблице выберите самый дешёвый сервис. Скидка действует на весь шиномонтаж четырёх колёс, доплата взимается один раз и не участвует в скидке. Сколько рублей стоит заказ?', value: Math.min(...totals), skill: 'tyre-service', table: { headers: ['Сервис', 'За колесо, руб.', 'Скидка за 4, %', 'Доплата, руб.'], rows: cost.map((p, j) => [String(j + 1), String(p), String(discount[j]), String(extra[j])]) }, solution: `Считаем 4 × цена × (1 − скидка/100) + разовая доплата. Получаем ${totals.map(v => fmt(v)).join('; ')} руб. Минимум ${fmt(Math.min(...totals))} руб.` });
  } else if (mode % 3 === 1) {
    const speed = 90 + i % 3 * 10, actual = rounded(speed * newD / diameter);
    block.facts.speed = speed;
    q.push({ text: `Спидометр настроен на заводские колёса. После установки ${marking} он показывает ${speed} км/ч. Фактическая скорость пропорциональна диаметру колеса. Найдите её в км/ч, округлив до десятых.`, value: actual, skill: 'tyre-speed', solution: `За оборот новое колесо проходит в ${fmt(newD / diameter, 4)} раза больше. Фактическая скорость ${speed} × ${fmt(newD)} : ${fmt(diameter)} ≈ ${fmt(actual)} км/ч.` });
  } else {
    const clearance = rounded((newD - diameter) / 2);
    q.push({ text: `На сколько миллиметров увеличится дорожный просвет после установки шин ${marking}? Считайте, что дорожный просвет увеличивается на разность радиусов колёс. Ответ округлите до десятых.`, value: clearance, skill: 'tyre-clearance', solution: `Радиус равен половине диаметра. (${fmt(newD)} − ${fmt(diameter)}) : 2 ≈ ${fmt(clearance)} мм.` });
  }
  return cards(block, q, i);
}
export const practicalPools = { ...extraPracticalPools, 'oge-apartment': Array.from({ length: 40 }, (_, i) => apartment(i)).flat(), 'oge-plot': Array.from({ length: 40 }, (_, i) => plot(i)).flat(), 'oge-tyres': Array.from({ length: 40 }, (_, i) => tyres(i)).flat() };
