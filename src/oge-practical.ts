import type { Problem } from './engine.ts';

export type PracticalKind = 'apartment' | 'plot' | 'tyres';
export type PlanRoom = { label: string; x: number; y: number; w: number; h: number };
export type PracticalScene = { kind: 'plan'; width: number; height: number; unit: number; rooms: PlanRoom[] } | { kind: 'tyre'; width: number; ratio: number; rim: number };
export type PracticalBlock = { id: string; title: string; text: string; scene: PracticalScene; table?: { headers: string[]; rows: string[][] } };
export type PracticalQuestion = { block: PracticalBlock; number: number };
export const isPracticalModule = (id: string) => ['oge-apartment', 'oge-plot', 'oge-tyres'].includes(id);
const fmt = (n: number) => String(Number(n.toFixed(6))).replace('.', ',');
const answer = (n: number) => String(Number(n.toFixed(6)));

function build(kind: PracticalKind): Problem[] {
  const pool: Problem[] = [];
  for (let i = 0; i < 40; i++) {
    const id = `oge-${kind}-${i + 1}`;
    const colorIndex = i % 20;
    let block: PracticalBlock;
    let questions: [string, string | number, string, boolean?][];
    if (kind === 'apartment') {
      const w = 5 + i % 5, h = 6 + Math.floor(i / 5) % 4, right = 6 + Math.floor(i / 20), unit = i % 2 ? 0.5 : 0.4;
      const labels = Array.from({ length: 4 }, (_, j) => String((j + i) % 4 + 1));
      const kitchen = w * h * unit ** 2, bedroom = right * h * unit ** 2;
      const tile = unit * 100, pack = 6 + i % 5, cost = 400 + i * 25;
      block = { id, title: `Квартира · вариант ${i + 1}`, text: `На плане показана квартира. Сторона клетки соответствует ${fmt(unit)} м. В верхнем ряду слева находится кухня, справа — спальня. В нижнем ряду слева находится санузел, справа — коридор. Границы помещений проходят по линиям сетки; размеры считаются между границами. Для кухни используют плитку ${fmt(tile)} × ${fmt(tile)} см, в упаковке ${pack} штук. Запас и потери при укладке не учитываются. Покрытие для спальни стоит ${cost} рублей за м².`, scene: { kind: 'plan', width: w + right, height: h + 3, unit, rooms: [ { label: labels[0], x: 0, y: 0, w, h }, { label: labels[1], x: w, y: 0, w: right, h }, { label: labels[2], x: 0, y: h, w, h: 3 }, { label: labels[3], x: w, y: h, w: right, h: 3 } ] } };
      questions = [
        ['Запиши номера кухни, спальни, санузла и коридора именно в этом порядке, без пробелов.', labels.join(''), `По описанию: кухня — ${labels[0]}, спальня — ${labels[1]}, санузел — ${labels[2]}, коридор — ${labels[3]}.`, true],
        ['Найди площадь кухни в м².', answer(kitchen), `Размеры кухни: ${fmt(w * unit)} × ${fmt(h * unit)} м. Площадь = ${fmt(kitchen)} м².`],
        ['Сколько целых упаковок плитки нужно для кухни?', Math.ceil(w * h / pack), `Одна плитка занимает одну клетку. Нужно ${w * h} плиток. Делим на ${pack} и округляем вверх: ${Math.ceil(w * h / pack)}.`],
        ['Найди периметр спальни в метрах.', answer(2 * (right + h) * unit), `P = 2 × (${fmt(right * unit)} + ${fmt(h * unit)}) = ${fmt(2 * (right + h) * unit)} м.`],
        ['Сколько рублей стоит покрытие для всей спальни?', answer(bedroom * cost), `Площадь спальни ${fmt(bedroom)} м². ${fmt(bedroom)} × ${cost} = ${fmt(bedroom * cost)} руб.`],
      ];
    } else if (kind === 'plot') {
      const width = 16 + i % 5, height = 12 + Math.floor(i / 5) % 4, unit = 2, houseW = 4 + i % 3, houseH = 3 + Math.floor(i / 3) % 3;
      const garageW = 3 + i % 2, garageH = 2 + Math.floor(i / 2) % 2, labels = Array.from({ length: 3 }, (_, j) => String((j + i) % 3 + 1));
      const gate = 2 + i % 3, packArea = 3 + i % 4, price = 500 + i * 20;
      block = { id, title: `Участок · вариант ${i + 1}`, text: `Прямоугольный участок изображён на клетчатой сетке: сторона клетки ${unit} м. Дом находится вверху слева, гараж — внизу слева, теплица — вверху справа. Границы объектов идут по линиям сетки. В ограждении предусмотрены ворота шириной ${gate} м. Весь пол гаража покрывают плиткой: упаковки хватает на ${packArea} м². Запас и потери не учитываются. Ограждение стоит ${price} рублей за метр, ворота оплачиваются отдельно.`, scene: { kind: 'plan', width, height, unit, rooms: [ { label: labels[0], x: 1, y: 1, w: houseW, h: houseH }, { label: labels[1], x: 1, y: height - garageH - 1, w: garageW, h: garageH }, { label: labels[2], x: width - 4, y: 1, w: 3, h: 2 } ] } };
      const fence = 2 * (width + height) * unit - gate, garageArea = garageW * garageH * unit ** 2;
      questions = [
        ['Запиши номера дома, гаража и теплицы в этом порядке, без пробелов.', labels.join(''), `Дом — ${labels[0]}, гараж — ${labels[1]}, теплица — ${labels[2]}.`, true],
        ['Найди площадь дома в м².', houseW * houseH * unit ** 2, `В доме ${houseW * houseH} клеток, площадь клетки ${unit ** 2} м².`],
        ['Найди площадь всего участка в м².', width * height * unit ** 2, `S = (${width} × ${unit}) × (${height} × ${unit}) = ${width * height * unit ** 2} м².`],
        ['Сколько целых упаковок плитки нужно для гаража?', Math.ceil(garageArea / packArea), `Площадь гаража ${garageArea} м². ${garageArea} ÷ ${packArea}, округляем вверх: ${Math.ceil(garageArea / packArea)}.`],
        ['Сколько рублей стоит ограждение без ворот?', fence * price, `Периметр ${2 * (width + height) * unit} м. Вычитаем ${gate} м ворот: ${fence} м. Стоимость ${fence} × ${price} = ${fence * price} руб.`],
      ];
    } else {
      const width = 175 + i % 8 * 10, ratio = 50 + Math.floor(i / 8) % 5 * 5, rim = 14 + i % 4;
      const side = width * ratio / 100, diameter = rim * 25.4 + 2 * side, wider = width + 20;
      const widths = [width - 10, width, wider];
      block = { id, title: `Шины · вариант ${i + 1}`, text: `Заводская маркировка шины: ${width}/${ratio} R${rim}. Первое число — ширина B в мм. Второе — высота боковины H в процентах от B. Число после R — диаметр диска d в дюймах, 1 дюйм = 25,4 мм. Внешний диаметр колеса D = d × 25,4 + 2H. На схеме показано сечение колеса, размеры условные: измерять рисунок линейкой не нужно. Таблица перечисляет все разрешённые в этом варианте замены.`, scene: { kind: 'tyre', width, ratio, rim }, table: { headers: ['Ширина, мм', 'Профиль, %', 'Диск, дюймы'], rows: widths.map((b, j) => [String(b), String(ratio - j * 5), String(rim + 1)]) } };
      questions = [
        [`Какова наименьшая разрешённая ширина шины для диска ${rim + 1} дюймов? Ответ в мм.`, widths[0], `Все строки таблицы относятся к диску ${rim + 1} дюймов; минимальная ширина ${widths[0]} мм.`],
        ['Найди высоту боковины заводской шины в мм.', answer(side), `H = ${width} × ${ratio} ÷ 100 = ${fmt(side)} мм.`],
        ['Найди диаметр заводского диска в мм.', answer(rim * 25.4), `${rim} × 25,4 = ${fmt(rim * 25.4)} мм.`],
        ['Найди внешний диаметр заводского колеса в мм.', answer(diameter), `D = ${fmt(rim * 25.4)} + 2 × ${fmt(side)} = ${fmt(diameter)} мм.`],
        [`На сколько мм увеличится внешний диаметр, если поставить шину ${wider}/${ratio} R${rim}? Такая замена рассматривается только для расчёта.`, answer(2 * (wider - width) * ratio / 100), `Диск тот же. Увеличение D = 2 × (${wider} − ${width}) × ${ratio} ÷ 100 = ${fmt(2 * (wider - width) * ratio / 100)} мм.`],
      ];
    }
    questions.forEach(([expression, value, hint, sequence], q) => pool.push({ id: `${id}-q${q + 1}`, expression: `Вариант ${i + 1} · №${q + 1}. ${expression}`, answer: String(value), hint, colorIndex, practical: { block, number: q + 1 }, ...(sequence ? { answerMode: 'sequence' as const } : {}) }));
  }
  return pool;
}
export const practicalPools = { 'oge-apartment': build('apartment'), 'oge-plot': build('plot'), 'oge-tyres': build('tyres') };
