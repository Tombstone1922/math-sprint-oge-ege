import type { Problem } from './engine.ts';
import { makeGridScene, type GridPoint, type GridScene, type GridTask } from './grid-geometry.ts';

export const gridGroups = [
  'Расстояния и высоты', 'Середины и медианы', 'Средняя линия треугольника',
  'Средняя линия трапеции', 'Площади треугольников', 'Площади четырёхугольников',
  'Ромбы и диагонали', 'Катеты и гипотенуза', 'Составные фигуры', 'Отношения длин и площадей',
] as const;
const prefix = 'На клетчатой бумаге с размером клетки 1×1 ';
const triples = [[3, 4, 5], [4, 3, 5], [6, 8, 10], [8, 6, 10], [5, 12, 13], [12, 5, 13], [9, 12, 15], [12, 9, 15], [6, 8, 10], [3, 4, 5]] as const;
const pool: Problem[] = [];
function add(group: number, slot: number, question: string, answer: number, hint: string, scene: GridScene, gridTask: GridTask) {
  if (!Number.isFinite(answer) || answer <= 0) throw new Error('Invalid grid answer');
  pool.push({ id: `oge-18-g${group + 1}-${slot + 1}`, expression: prefix + question, answer: String(answer), hint, colorIndex: slot, figure: { kind: 'grid-scene', scene }, gridTask });
}
const outline = (vertices: GridPoint[], shaded = false) => [{ vertices, shaded }];

for (let slot = 0; slot < 20; slot++) {
  // Group 1: distances between points, including the perpendicular to a line.
  if (slot < 10) {
    const [x, y, length] = triples[slot];
    add(0, slot, 'отмечены точки A и B. Найдите расстояние между ними.', length,
      `По клеткам: ${x} по одному направлению и ${y} по другому. AB = √(${x}² + ${y}²) = ${length}.`,
      makeGridScene({ A: [0, 0], B: [x, y] }, [], [], [], slot), 'distance');
  } else if (slot < 15) {
    const height = 2 + (slot - 10) % 5, width = 4 + Math.floor((slot - 10) / 5);
    add(0, slot, 'отмечены точки A, B и C. Найдите расстояние от A до прямой BC.', height,
      `Расстояние до прямой измеряют по перпендикуляру. От A до линии BC — ${height} клеток.`,
      makeGridScene({ A: [1, height], B: [0, 0], C: [width, 0] }, [], [], [], slot), 'point-line');
  } else {
    const height = 2 + slot % 5, base = 5 + slot % 3, topX = 1 + slot % 2;
    add(0, slot, 'изображён треугольник ABC. Найдите длину высоты, опущенной из B на AC.', height,
      `Высота перпендикулярна стороне AC. По сетке между B и AC — ${height} клеток.`,
      makeGridScene({ A: [0, 0], B: [topX, height], C: [base, 0] }, outline([[0, 0], [topX, height], [base, 0]]), [], [], slot), 'height');
  }

  // Group 2: read the midpoint from two grid points; the median of a right triangle.
  if (slot < 10) {
    const height = 2 + slot % 5, halfBase = 1 + Math.floor(slot / 5);
    const shift = slot % 2 ? 0 : 3;
    const h = shift ? 4 : height;
    const length = shift ? 5 : h;
    add(1, slot, 'отмечены точки A, B и C. Найдите расстояние от A до середины BC.', length,
      `Середина BC находится в ${halfBase} клетках от B. От A до неё сдвиг ${shift} и ${h}; расстояние √(${shift}² + ${h}²) = ${length}.`,
      makeGridScene({ A: [halfBase + shift, h], B: [0, 0], C: [2 * halfBase, 0] }, [], [], [], slot), 'midpoint');
  } else {
    const [x, y, hyp] = triples[slot - 10];
    add(1, slot, 'изображён прямоугольный треугольник ABC. Найдите длину медианы из вершины прямого угла A.', hyp / 2,
      `Катеты по клеткам ${x} и ${y}; гипотенуза ${hyp}. Медиана к гипотенузе равна её половине: ${hyp} ÷ 2 = ${hyp / 2}.`,
      makeGridScene({ A: [0, 0], B: [x, 0], C: [0, y] }, outline([[0, 0], [x, 0], [0, y]]), [], [], slot), 'median');
  }

  // Groups 3–5: the question contains no lengths; all data are in the figure.
  const base = 3 + slot % 10, height = 3 + Math.floor(slot / 10), apex = 1 + slot % 3;
  add(2, slot, 'изображён треугольник ABC. Найдите длину его средней линии, параллельной AC.', base / 2,
    `Сторона AC равна ${base} клеткам. Средняя линия параллельна AC и вдвое короче: ${base} ÷ 2 = ${base / 2}.`,
    makeGridScene({ A: [0, 0], B: [apex, height], C: [base, 0] }, outline([[0, 0], [apex, height], [base, 0]]), [], [], slot), 'triangle-midline');

  const short = 2 + slot % 5, long = 7 + Math.floor(slot / 5), trapHeight = 3 + slot % 3, shift = 1 + slot % 2;
  const trap: GridPoint[] = [[0, 0], [long, 0], [shift + short, trapHeight], [shift, trapHeight]];
  add(3, slot, 'изображена трапеция ABCD. Найдите длину её средней линии.', (short + long) / 2,
    `Основания по клеткам: ${short} и ${long}. Средняя линия = (${short} + ${long}) ÷ 2 = ${(short + long) / 2}.`,
    makeGridScene({ A: trap[0], B: trap[1], C: trap[2], D: trap[3] }, outline(trap), [], [], slot), 'trapezoid-midline');

  const triBase = 3 + slot % 5, triHeight = 2 + Math.floor(slot / 5), triApex = slot % 3 - 1;
  const tri: GridPoint[] = [[0, 0], [triBase, 0], [triApex, triHeight]];
  add(4, slot, 'изображён треугольник. Найдите его площадь.', triBase * triHeight / 2,
    `Основание ${triBase}, перпендикулярная высота ${triHeight}. S = ${triBase} × ${triHeight} ÷ 2 = ${triBase * triHeight / 2}.`,
    makeGridScene({}, outline(tri, true), [], [], slot), 'area');

  const w = 3 + slot % 5, h = 2 + Math.floor(slot / 5) % 2;
  if (slot < 10) {
    const shear = 1 + slot % 3, para: GridPoint[] = [[0, 0], [w, 0], [w + shear, h], [shear, h]];
    add(5, slot, 'изображён параллелограмм. Найдите его площадь.', w * h,
      `Основание ${w}, высота ${h}. Наклонная сторона не является высотой. S = ${w} × ${h} = ${w * h}.`,
      makeGridScene({}, outline(para, true), [], [], slot), 'area');
  } else {
    const upper = w - 1, lower = w + 2, vertices: GridPoint[] = [[0, 0], [lower, 0], [upper + 1, h], [1, h]];
    add(5, slot, 'изображена трапеция. Найдите её площадь.', (upper + lower) * h / 2,
      `Основания ${upper} и ${lower}, высота ${h}. S = (${upper} + ${lower}) × ${h} ÷ 2 = ${(upper + lower) * h / 2}.`,
      makeGridScene({}, outline(vertices, true), [], [], slot), 'area');
  }

  const rx = 3 + slot % 5, ry = 1 + Math.floor(slot / 5) % 2;
  const rhombus: GridPoint[] = [[-rx, 0], [0, ry], [rx, 0], [0, -ry]];
  add(6, slot, slot < 10 ? 'изображён ромб. Найдите его площадь.' : 'изображён ромб. Найдите длину его большей диагонали.',
    slot < 10 ? 2 * rx * ry : 2 * rx,
    slot < 10 ? `Диагонали ${2 * rx} и ${2 * ry}. S = ${2 * rx} × ${2 * ry} ÷ 2 = ${2 * rx * ry}.` : `Диагонали соединяют противоположные вершины: ${2 * rx} и ${2 * ry}. Большая равна ${2 * rx}.`,
    makeGridScene({ A: rhombus[0], B: rhombus[1], C: rhombus[2], D: rhombus[3] }, outline(rhombus, slot < 10), [], [], slot), slot < 10 ? 'area' : 'diagonal');

  const [leg1, leg2, hypotenuse] = triples[slot % 10];
  add(7, slot, slot < 10 ? 'изображён прямоугольный треугольник ABC. Найдите длину его большего катета.' : 'изображён прямоугольный треугольник ABC. Найдите длину его гипотенузы BC.',
    slot < 10 ? Math.max(leg1, leg2) : hypotenuse,
    slot < 10 ? `Катеты образуют прямой угол в A. Их длины по сетке ${leg1} и ${leg2}; больший — ${Math.max(leg1, leg2)}.` : `Катеты ${leg1} и ${leg2}. BC = √(${leg1}² + ${leg2}²) = ${hypotenuse}.`,
    makeGridScene({ A: [0, 0], B: [leg1, 0], C: [0, leg2] }, outline([[0, 0], [leg1, 0], [0, leg2]]), [], [], slot), slot < 10 ? 'larger-leg' : 'hypotenuse');

  const outerW = 5 + slot % 5, outerH = 4 + Math.floor(slot / 5), cutW = 1 + slot % 3, cutH = 1 + slot % 2;
  const composite: GridPoint[] = slot < 10
    ? [[0, 0], [outerW, 0], [outerW, outerH - cutH], [outerW - cutW, outerH - cutH], [outerW - cutW, outerH], [0, outerH]]
    : [[0, 0], [outerW, 0], [outerW, outerH - cutH], [outerW - cutW, outerH], [0, outerH]];
  const cut = slot < 10 ? cutW * cutH : cutW * cutH / 2;
  add(8, slot, 'изображена закрашенная фигура. Найдите её площадь.', outerW * outerH - cut,
    `Дострой до прямоугольника ${outerW} × ${outerH}, затем вычти ${slot < 10 ? 'прямоугольник' : 'треугольник'} площадью ${cut}. S = ${outerW * outerH} − ${cut} = ${outerW * outerH - cut}.`,
    makeGridScene({}, outline(composite, true), [], [], slot), 'area');

  if (slot < 10) {
    const smallR = 1 + slot % 2, ratio = 2 + Math.floor(slot / 2) % 2, bigR = smallR * ratio;
    add(9, slot, 'изображены два круга. Во сколько раз площадь большего круга больше площади меньшего?', ratio ** 2,
      `Радиусы по клеткам ${bigR} и ${smallR}. Площади относятся как квадраты радиусов: (${bigR} ÷ ${smallR})² = ${ratio ** 2}.`,
      makeGridScene({}, [], [], [{ center: [bigR, bigR], radius: bigR }, { center: [2 * bigR + 2 + smallR, smallR], radius: smallR }], slot), 'circle-ratio');
  } else {
    const ratio = 2 + (slot - 10) % 5, stepX = 1, stepY = 1 + Math.floor((slot - 10) / 5);
    const A: GridPoint = [0, 0], B: GridPoint = [(ratio + 1) * stepX, (ratio + 1) * stepY], M: GridPoint = [stepX, stepY], C: GridPoint = [(ratio + 1) * stepX + 2, 0];
    add(9, slot, 'изображён треугольник ABC и точка M на AB. Во сколько раз AM короче BM?', ratio,
      `A, M и B лежат на одной прямой. Проекции AM и BM на направление сетки относятся как ${stepX} к ${ratio * stepX}; BM ÷ AM = ${ratio}.`,
      makeGridScene({ A, B, C, M }, outline([A, B, C]), [], [], slot), 'segment-ratio');
  }
}

// Keep twenty tasks in each named group, rather than mixing the subtopics.
export const gridProblemPool: readonly Problem[] = pool.sort((a, b) => {
  const [ga, sa] = a.id.match(/g(\d+)-(\d+)$/)!.slice(1).map(Number);
  const [gb, sb] = b.id.match(/g(\d+)-(\d+)$/)!.slice(1).map(Number);
  return ga - gb || sa - sb;
});

// Invariants based on the complete drawing, not just the repeated question text.
const keys = gridProblemPool.map(p => JSON.stringify([p.expression, p.figure!.scene]));
if (gridProblemPool.length !== 200 || new Set(keys).size !== 200) throw new Error('Grid bank must contain 200 distinct illustrated tasks');
