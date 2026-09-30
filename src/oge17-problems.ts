import type { FigureSpec, Problem } from './engine.ts';
import { drawing, midpoint, parallelogram, polar, rad, rhombus, splitTrapezoid, trapezoid, type Drawing, type GeometryMeasure } from './analytic-geometry.ts';
import type { GridPoint } from './grid-geometry.ts';

export const quadrilateralGroups = ['Диагонали и точка пересечения', 'Прямоугольник и квадрат', 'Углы ромба и диагонали', 'Ромб: перпендикуляры и высоты', 'Параллелограмм: площадь и высоты', 'Площади частей и диагонали ромба', 'Трапеция: площадь и средняя линия', 'Углы равнобедренной трапеции', 'Трапеция: диагональ и углы', 'Параллелограмм: диагональ и биссектриса'] as const;
const pool: Problem[] = [];
function add(group: number, expression: string, answer: number, hint: string, d: Drawing, measure: GeometryMeasure, kind: FigureSpec['kind'] = 'rectangle') {
  pool.push({ id: `oge-17-g${group}-${pool.length % 20 + 1}`, expression, answer: String(answer), hint, colorIndex: pool.length % 20, figure: { kind, scene: d.scene, unit: d.unit }, geometryMeasure: measure });
}
const length = (a: string, b: string): GeometryMeasure => ({ kind: 'length', points: [a, b] });
const angle = (a: string, b: string, c: string): GeometryMeasure => ({ kind: 'angle', points: [a, b, c] });
const area = (...points: string[]): GeometryMeasure => ({ kind: 'area', points });
for (let group = 1; group <= 10; group++) for (let j = 0; j < 20; j++) {
  const k = j + 1, second = j % 2 === 1;
  if (group === 1) {
    if (!second) {
      const A: GridPoint = [-3 * k, 0], C: GridPoint = [3 * k, 0], B = polar(4 * k, 65), D: GridPoint = [-B[0], -B[1]], O: GridPoint = [0, 0];
      add(group, `Диагонали AC и BD параллелограмма ABCD пересекаются в O. AC=${6 * k}, BD=${8 * k}. Найдите DO.`, 4 * k, `Диагонали параллелограмма делятся точкой пересечения пополам. DO=BD/2=${8 * k}/2=${4 * k}. Длина AC для этого вычисления не нужна.`, drawing({ A, B, C, D, O }, ['A', 'B', 'C', 'D'], [['A', 'C'], ['B', 'D']]), length('D', 'O'));
    } else {
      const A: GridPoint = [0, 0], B: GridPoint = [0, 1.2 * k], C: GridPoint = [1.6 * k, 1.2 * k], D: GridPoint = [1.6 * k, 0], O = midpoint(A, C);
      add(group, `Диагонали AC и BD прямоугольника ABCD пересекаются в точке O. BO=${k}. Найдите AC.`, 2 * k, `Диагонали прямоугольника равны и делятся пополам. AC=BD=2BO=${2 * k}.`, drawing({ A, B, C, D, O }, ['A', 'B', 'C', 'D'], [['A', 'C'], ['B', 'D']]), length('A', 'C'));
    }
  } else if (group === 2) {
    if (!second) {
      const alpha = 24 + 2 * j, A: GridPoint = [0, 0], B: GridPoint = [0, 4 * Math.tan(rad(alpha))], C: GridPoint = [4, B[1]], D: GridPoint = [4, 0], O = midpoint(A, C);
      const answer = 2 * Math.min(alpha, 90 - alpha);
      add(group, `Диагональ AC прямоугольника ABCD образует со стороной AD угол ${alpha}°. Найдите острый угол между диагоналями в градусах.`, answer, `Углы между диагоналями равны 2α и 180−2α. Берём меньший: min(${2 * alpha}, ${180 - 2 * alpha})=${answer}°.`, drawing({ A, B, C, D, O }, ['A', 'B', 'C', 'D'], [['A', 'C'], ['B', 'D']]), alpha <= 45 ? angle('A', 'O', 'B') : angle('A', 'O', 'D'));
    } else {
      const side = k * Math.sqrt(2), A: GridPoint = [0, 0], B: GridPoint = [0, side], C: GridPoint = [side, side], D: GridPoint = [side, 0];
      add(group, `Сторона квадрата ABCD равна ${k}√2. Найдите диагональ AC.`, 2 * k, `По теореме Пифагора d=a√2=${k}√2·√2=${2 * k}.`, drawing({ A, B, C, D }, ['A', 'B', 'C', 'D'], [['A', 'C']]), length('A', 'C'));
    }
  } else if (group === 3) {
    const acute = 32 + 2 * j;
    if (!second) add(group, `Острый угол BAD ромба ABCD равен ${acute}°. Найдите угол между стороной AB и меньшей диагональю BD в градусах.`, 90 - acute / 2, `Соседний угол ABC=180−${acute}. Диагональ BD делит его пополам: ∠ABD=(180−${acute})/2=${90 - acute / 2}°.`, rhombus(4, acute), angle('A', 'B', 'D'), 'rhombus');
    else add(group, `Один из углов ромба ABCD равен ${180 - acute}°. DH — высота к прямой AB. Найдите угол между DH и большей диагональю AC в градусах.`, 90 - acute / 2, `Острый угол равен ${acute}°. Большая диагональ делит его пополам. Угол с перпендикуляром к стороне: 90−${acute}/2=${90 - acute / 2}°.`, rhombus(4, acute, true), angle('H', 'T', 'A'), 'rhombus');
  } else if (group === 4) {
    if (!second) {
      const beta = 12 + j;
      add(group, `Диагонали ромба ABCD пересекаются в O. OH⊥AB, H лежит на AB. Угол между OH и меньшей диагональю BD равен ${beta}°. Найдите острый угол ромба в градусах.`, 2 * beta, `Диагонали ромба перпендикулярны и делят его углы пополам. Угол между двумя перпендикулярами OH и BD равен половине острого угла: 2·${beta}=${2 * beta}°.`, rhombus(4, 2 * beta, true, true), angle('B', 'A', 'D'), 'rhombus');
    } else {
      const A: GridPoint = [0, 0], B = polar(2 * k, 30), C: GridPoint = [2 * k + B[0], B[1]], D: GridPoint = [2 * k, 0], H: GridPoint = [B[0], 0];
      add(group, `Сторона ромба ABCD равна ${2 * k}, ∠BAD=30°. BH — высота к AD. Найдите BH.`, k, `Высота равна a·sin30°=a/2=${2 * k}/2=${k}.`, drawing({ A, B, C, D, H }, ['A', 'B', 'C', 'D'], [['B', 'H']]), length('B', 'H'), 'rhombus');
    }
  } else if (group === 5) {
    if (!second) {
      const a = 6 + j, h = 3 + j, A: GridPoint = [0, 0], B: GridPoint = [2, h], C: GridPoint = [a + 2, h], D: GridPoint = [a, 0], H: GridPoint = [2, 0];
      add(group, `В параллелограмме ABCD основание AD=${a}, высота BH=${h}, BH⊥AD. Найдите площадь.`, a * h, `S=основание·высота=${a}·${h}=${a * h}. Высота должна быть перпендикулярна выбранному основанию.`, drawing({ A, B, C, D, H }, ['A', 'B', 'C', 'D'], [['B', 'H']]), area('A', 'B', 'C', 'D'));
    } else {
      const A: GridPoint = [0, 0], B: GridPoint = [1.8 * k, 2.4 * k], C: GridPoint = [6.8 * k, 2.4 * k], D: GridPoint = [5 * k, 0];
      add(group, `Площадь параллелограмма ABCD равна ${12 * k * k}, стороны AB=${3 * k} и AD=${5 * k}. Найдите большую высоту.`, 4 * k, `h₁=S/AB=${12 * k * k}/${3 * k}=${4 * k}; h₂=S/AD=${12 * k * k}/${5 * k}=${Number((2.4 * k).toFixed(1))}. Большая высота относится к меньшей стороне.`, drawing({ A, B, C, D }, ['A', 'B', 'C', 'D'], [['D', 'B']]), length('D', 'B'));
    }
  } else if (group === 6) {
    if (!second) {
      const A: GridPoint = [0, 0], B: GridPoint = [2, 4 * k], C: GridPoint = [6, 4 * k], D: GridPoint = [4, 0], E = midpoint(A, B);
      add(group, `Площадь параллелограмма ABCD равна ${16 * k}. E — середина AB. Найдите площадь трапеции EBCD.`, 12 * k, `Треугольник AED занимает четверть площади параллелограмма. S(EBCD)=3S/4=3·${16 * k}/4=${12 * k}.`, drawing({ A, B, C, D, E }, ['A', 'B', 'C', 'D'], [['E', 'D']]), area('E', 'B', 'C', 'D'));
    } else {
      const A: GridPoint = [-4 * k, 0], B: GridPoint = [0, 3 * k], C: GridPoint = [4 * k, 0], D: GridPoint = [0, -3 * k], O: GridPoint = [0, 0];
      add(group, `Диагонали AC и BD ромба ABCD равны ${8 * k} и ${6 * k}. Найдите площадь ромба.`, 24 * k * k, `Диагонали ромба перпендикулярны. S=d₁d₂/2=${8 * k}·${6 * k}/2=${24 * k * k}.`, drawing({ A, B, C, D, O }, ['A', 'B', 'C', 'D'], [['A', 'C'], ['B', 'D']]), area('A', 'B', 'C', 'D'), 'rhombus');
    }
  } else if (group === 7) {
    const small = 3 + j, large = 9 + 2 * j, h = 4 + j;
    if (!second) add(group, `В трапеции ABCD основания BC=${small}, AD=${large}, высота CH=${h}. Найдите площадь.`, (small + large) * h / 2, `S=(BC+AD)·h/2=(${small}+${large})·${h}/2=${(small + large) * h / 2}.`, trapezoid(small, large, h), area('A', 'B', 'C', 'D'), 'trapezoid');
    else add(group, `Основания трапеции ABCD: BC=${small}, AD=${large}. M и N — середины AB и CD; AC пересекает MN в K. Найдите больший из отрезков MK и KN.`, large / 2, `Средняя линия разделяется диагональю на половины оснований: MK=BC/2=${small / 2}, KN=AD/2=${large / 2}. Больший отрезок равен ${large / 2}.`, trapezoid(small, large, h, true), length('K', 'N'), 'trapezoid');
  } else if (group === 8) {
    const acute = 31 + 2 * j, h = 4, offset = h / Math.tan(rad(acute));
    const d = trapezoid(4, 4 + 2 * offset, h);
    if (!second) add(group, `В равнобедренной трапеции ABCD с основаниями AD и BC угол D равен ${acute}°. Найдите больший угол трапеции в градусах.`, 180 - acute, `Углы при основании равны, а углы при боковой стороне в сумме дают 180°. Больший угол: 180−${acute}=${180 - acute}°.`, d, angle('A', 'B', 'C'), 'trapezoid');
    else add(group, `Сумма двух углов равнобедренной трапеции ABCD равна ${2 * acute}°. Найдите больший угол трапеции в градусах.`, 180 - acute, `Углы при боковой стороне и противоположные углы дают 180°. Сумма ${2 * acute}° относится к двум острым углам: каждый ${acute}°. Больший равен ${180 - acute}°.`, d, angle('A', 'B', 'C'), 'trapezoid');
  } else if (group === 9) {
    const p = 14 + j, q = 18 + j, acute = p + q, d = splitTrapezoid(acute, p);
    if (!second) add(group, `В равнобедренной трапеции ABCD (AD∥BC) диагональ AC образует с AD угол ${p}°, с AB — ${q}°. Найдите больший угол трапеции в градусах.`, 180 - acute, `∠BAD=${p}+${q}=${acute}°. Соседний угол равен 180−${acute}=${180 - acute}°.`, d, angle('A', 'B', 'C'), 'trapezoid');
    else add(group, `В равнобедренной трапеции ABCD (AD∥BC) ∠D=${acute}°, угол между AC и AB равен ${q}°. Найдите ∠ACB в градусах.`, p, `∠A=∠D=${acute}°. ∠CAD=${acute}−${q}=${p}°. AD∥BC, поэтому ∠ACB=∠CAD=${p}°.`, d, angle('A', 'C', 'B'), 'trapezoid');
  } else {
    if (!second) {
      const p = 13 + j, q = 17 + j, alpha = p + q;
      const a = 4 * Math.sin(rad(q)) / Math.sin(rad(p));
      const d = parallelogram(a, 4, alpha, true);
      add(group, `Диагональ AC параллелограмма ABCD образует со стороной AD угол ${p}°, со стороной AB — ${q}°. Найдите больший угол параллелограмма в градусах.`, 180 - alpha, `Диагональ делит ∠A на два угла: ∠A=${p}+${q}=${alpha}°. Соседний угол 180−${alpha}=${180 - alpha}°.`, d, angle('A', 'B', 'C'));
    } else {
      const beta = 14 + j, A: GridPoint = [0, 0], B = polar(3, 2 * beta), D: GridPoint = [6, 0], C: GridPoint = [6 + B[0], B[1]], E: GridPoint = [B[1] / Math.tan(rad(beta)), B[1]];
      add(group, `AE — биссектриса угла A параллелограмма ABCD; E лежит на BC. Острый угол между AE и BC равен ${beta}°. Найдите острый угол параллелограмма в градусах.`, 2 * beta, `BC∥AD, поэтому угол между AE и AD равен ${beta}°. AE делит ∠A пополам: ∠A=2·${beta}=${2 * beta}°.`, drawing({ A, B, C, D, E }, ['A', 'B', 'C', 'D'], [['A', 'E']]), angle('B', 'A', 'D'));
    }
  }
}
export const quadrilateralProblemPool: readonly Problem[] = pool;
