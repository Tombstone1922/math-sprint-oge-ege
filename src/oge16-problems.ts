import type { FigureSpec, Problem } from './engine.ts';
import { circleTriangle, diameterTriangle, drawing, midpoint, polar, tangentDrawing, trapezoid, twoTangents, type Drawing, type GeometryMeasure } from './analytic-geometry.ts';
import type { GridPoint } from './grid-geometry.ts';

export const circleGroups = ['Вписанные и центральные углы', 'Диаметр и прямоугольный треугольник', 'Касательная и секущая', 'Две касательные и углы', 'Хорда и касательная', 'Окружность и квадрат', 'Равносторонний треугольник', 'Вписанная окружность и площадь', 'Вписанные четырёхугольники и высоты', 'Описанные фигуры и радиусы'] as const;
const pool: Problem[] = [];
function add(group: number, expression: string, answer: number, hint: string, d: Drawing, measure: GeometryMeasure, kind: FigureSpec['kind'] = 'circle') {
  pool.push({ id: `oge-16-g${group}-${pool.length % 20 + 1}`, expression, answer: String(answer), hint, colorIndex: pool.length % 20, figure: { kind, scene: d.scene, unit: d.unit }, geometryMeasure: measure });
}
const length = (a: string, b: string): GeometryMeasure => ({ kind: 'length', points: [a, b] });
const angle = (a: string, b: string, c: string): GeometryMeasure => ({ kind: 'angle', points: [a, b, c] });
const area = (...points: string[]): GeometryMeasure => ({ kind: 'area', points });
const O: GridPoint = [0, 0];
for (let group = 1; group <= 10; group++) for (let j = 0; j < 20; j++) {
  const k = j + 1, second = j % 2 === 1;
  if (group === 1) {
    const alpha = 51 + 3 * j;
    if (!second) add(group, `Окружность имеет центр O. ∠AOB=${alpha}°. Точка C лежит на большей дуге AB. Найдите ∠ACB в градусах.`, alpha / 2, `∠ACB опирается на меньшую дугу AB, поэтому равен половине центрального угла: ${alpha} ÷ 2 = ${alpha / 2}°.`, circleTriangle(alpha), angle('A', 'C', 'B'));
    else {
      const A: GridPoint = [4, 0], C: GridPoint = [-4, 0], D = polar(4, alpha), B: GridPoint = [-D[0], -D[1]];
      add(group, `AC и BD — диаметры окружности с центром O. ∠AOD=${alpha}°. Найдите вписанный угол ACB в градусах.`, (180 - alpha) / 2, `OB и OD — противоположные лучи. ∠AOB=180−${alpha}=${180 - alpha}°. ∠ACB вдвое меньше: ${(180 - alpha) / 2}°.`, drawing({ A, B, C, D, O }, ['A', 'B', 'C'], [['A', 'C'], ['B', 'D']], [{ center: O, radius: 4 }]), angle('A', 'C', 'B'), 'circle-diameter');
    }
  } else if (group === 2) {
    if (!second) {
      const alpha = 27 + j * 2;
      add(group, `Центр O описанной около треугольника ABC окружности лежит на стороне AB. ∠BAC=${alpha}°. Найдите ∠ABC в градусах.`, 90 - alpha, `AB — диаметр, поэтому ∠ACB=90°. ∠ABC=90−${alpha}=${90 - alpha}°.`, diameterTriangle(alpha), angle('A', 'B', 'C'), 'circle-diameter');
    } else {
      const A: GridPoint = [0, 0], B: GridPoint = [5 * k, 0], C: GridPoint = [9 * k / 5, 12 * k / 5];
      add(group, `Центр O описанной около треугольника ABC окружности лежит на стороне AB. Радиус равен ${2.5 * k}, AC=${3 * k}. Найдите BC.`, 4 * k, `AB=2R=${5 * k}; ∠ACB=90°. BC=√(${5 * k}²−${3 * k}²)=${4 * k}.`, drawing({ A, B, C, O: midpoint(A, B) }, ['A', 'B', 'C'], [], [{ center: midpoint(A, B), radius: 2.5 * k }]), length('B', 'C'), 'circle-diameter');
    }
  } else if (group === 3) {
    if (!second) add(group, `PA касается окружности с центром O в точке A. Радиус OA=${3 * k}, OP=${5 * k}. Найдите PA.`, 4 * k, `Радиус перпендикулярен касательной. В прямоугольном треугольнике OAP: PA=√(${5 * k}²−${3 * k}²)=${4 * k}.`, tangentDrawing(3 * k, 5 * k), length('P', 'A'), 'tangent');
    else {
      const radius = 4 * k, P: GridPoint = [5 * k, 0], A: GridPoint = [16 * k / 5, 12 * k / 5], B: GridPoint = [4 * k, 0], C: GridPoint = [-4 * k, 0];
      add(group, `Из точки P проведены касательная PA и секущая PBC; B лежит между P и C. PB=${k}, PC=${9 * k}. Найдите PA.`, 3 * k, `Теорема о касательной и секущей: PA²=PB·PC=${k}·${9 * k}. PA=${3 * k}. PC — весь отрезок секущей.`, drawing({ O, P, A, B, C }, [], [['P', 'A'], ['P', 'C'], ['O', 'A']], [{ center: O, radius }]), length('P', 'A'), 'secant');
    }
  } else if (group === 4) {
    const alpha = 43 + 3 * j, d = twoTangents(alpha);
    if (!second) add(group, `PA и PB — касательные к окружности с центром O. ∠APB=${alpha}°. Найдите ∠ABO в градусах.`, alpha / 2, `∠OAP=∠OBP=90°, значит ∠AOB=180−${alpha}. OA=OB, поэтому ∠ABO=${alpha}÷2=${alpha / 2}°.`, d, angle('A', 'B', 'O'), 'tangent');
    else add(group, `В угол APB величиной ${alpha}° вписана окружность с центром O; A и B — точки касания. Найдите ∠AOB в градусах.`, 180 - alpha, `В четырёхугольнике OAPB два прямых угла: ∠AOB=360−90−90−${alpha}=${180 - alpha}°.`, d, angle('A', 'O', 'B'), 'tangent');
  } else if (group === 5) {
    if (!second) {
      const A: GridPoint = [-4 * k, 3 * k], B: GridPoint = [4 * k, 3 * k], H: GridPoint = [0, 3 * k];
      add(group, `Радиус окружности с центром O равен ${5 * k}. OH=${3 * k} — расстояние от O до хорды AB; H лежит на AB. Найдите AB.`, 8 * k, `OH⊥AB и AH=HB. AH=√(${5 * k}²−${3 * k}²)=${4 * k}; AB=2AH=${8 * k}.`, drawing({ O, A, B, H }, [], [['A', 'B'], ['O', 'H'], ['O', 'A']], [{ center: O, radius: 5 * k }]), length('A', 'B'), 'chord');
    } else {
      const alpha = 42 + 3 * j, B: GridPoint = [0, -4], A = polar(4, -90 + alpha), C: GridPoint = [6, -4];
      add(group, `Меньшая дуга AB равна ${alpha}°. BC — касательная в точке B; ∠ABC острый. Найдите ∠ABC в градусах.`, alpha / 2, `Угол между хордой и касательной равен половине заключённой между ними дуги: ${alpha}÷2=${alpha / 2}°.`, drawing({ O, A, B, C }, [], [['A', 'B'], ['B', 'C'], ['O', 'B']], [{ center: O, radius: 4 }]), angle('A', 'B', 'C'), 'tangent');
    }
  } else if (group === 6) {
    const A: GridPoint = [-k, -k], B: GridPoint = [-k, k], C: GridPoint = [k, k], D: GridPoint = [k, -k];
    if (!second) add(group, `Квадрат ABCD описан около окружности радиуса ${k}. Найдите площадь квадрата.`, 4 * k * k, `Сторона квадрата равна диаметру: a=2r=${2 * k}. S=a²=${4 * k * k}.`, drawing({ A, B, C, D, O }, ['A', 'B', 'C', 'D'], [], [{ center: O, radius: k }]), area('A', 'B', 'C', 'D'), 'rectangle');
    else add(group, `Радиус окружности, описанной около квадрата ABCD, равен ${k}√2. Найдите сторону квадрата AB.`, 2 * k, `Диагональ квадрата d=2R=${2 * k}√2, а a=d/√2=${2 * k}.`, drawing({ A, B, C, D, O }, ['A', 'B', 'C', 'D'], [['A', 'C']], [{ center: O, radius: k * Math.sqrt(2) }]), length('A', 'B'), 'rectangle');
  } else if (group === 7) {
    const side = (second ? 3 : 6) * k, h = side * Math.sqrt(3) / 2;
    const A: GridPoint = [-side / 2, 0], B: GridPoint = [0, h], C: GridPoint = [side / 2, 0], center: GridPoint = [0, h / 3];
    if (!second) add(group, `Радиус вписанной в равносторонний треугольник ABC окружности равен ${k}√3. Найдите сторону AB.`, 6 * k, `r=a√3/6, поэтому a=2√3·r=2√3·${k}√3=${6 * k}.`, drawing({ A, B, C, O: center }, ['A', 'B', 'C'], [], [{ center, radius: k * Math.sqrt(3) }]), length('A', 'B'), 'triangle');
    else add(group, `Радиус описанной около равностороннего треугольника ABC окружности равен ${k}√3. Найдите сторону AB.`, 3 * k, `R=a/√3, поэтому a=R√3=${k}√3·√3=${3 * k}.`, drawing({ A, B, C, O: center }, ['A', 'B', 'C'], [], [{ center, radius: k * Math.sqrt(3) }]), length('A', 'B'), 'triangle');
  } else if (group === 8) {
    if (!second) {
      const A: GridPoint = [0, 0], B: GridPoint = [3 * k, 0], C: GridPoint = [0, 4 * k], center: GridPoint = [k, k];
      add(group, `Периметр треугольника ABC равен ${12 * k}, радиус его вписанной окружности равен ${k}. Найдите площадь треугольника.`, 6 * k * k, `S=pr, где p=P/2. p=${12 * k}÷2=${6 * k}; S=${6 * k}·${k}=${6 * k * k}.`, drawing({ A, B, C, O: center }, ['A', 'B', 'C'], [], [{ center, radius: k }]), area('A', 'B', 'C'), 'triangle');
    } else {
      const A: GridPoint = [-Math.sqrt(3) * k, 0], B: GridPoint = [0, 3 * k], C: GridPoint = [Math.sqrt(3) * k, 0], H: GridPoint = [0, 0], center: GridPoint = [0, k];
      add(group, `В равносторонний треугольник ABC вписана окружность радиуса ${k}. Найдите высоту BH, опущенную на AC.`, 3 * k, `Центр делит высоту равностороннего треугольника в отношении 2:1. Расстояние до основания r=h/3, значит h=3r=${3 * k}.`, drawing({ A, B, C, H, O: center }, ['A', 'B', 'C'], [['B', 'H']], [{ center, radius: k }]), length('B', 'H'), 'triangle');
    }
  } else if (group === 9) {
    if (!second) {
      const alpha = 45 + j, A: GridPoint = [4, 0], B = polar(4, 180 - alpha), C: GridPoint = [-4, 0], D = polar(4, 180 + alpha);
      add(group, `Четырёхугольник ABCD вписан в окружность. ∠BAD=${alpha}°. Найдите ∠BCD в градусах.`, 180 - alpha, `Сумма противоположных углов вписанного четырёхугольника равна 180°. ∠BCD=180−${alpha}=${180 - alpha}°.`, drawing({ A, B, C, D, O }, ['A', 'B', 'C', 'D'], [], [{ center: O, radius: 4 }]), angle('B', 'C', 'D'));
    } else {
      const A: GridPoint = [-2 * k, 0], B: GridPoint = [-k / 2, 2 * k], C: GridPoint = [k / 2, 2 * k], D: GridPoint = [2 * k, 0], H: GridPoint = [C[0], 0], center: GridPoint = [0, k];
      add(group, `В трапецию ABCD с основаниями AD и BC вписана окружность радиуса ${k}. Найдите высоту CH.`, 2 * k, `Окружность касается обоих параллельных оснований. Расстояние между ними равно диаметру: CH=2r=${2 * k}.`, drawing({ A, B, C, D, H, O: center }, ['A', 'B', 'C', 'D'], [['C', 'H']], [{ center, radius: k }]), length('C', 'H'), 'trapezoid');
    }
  } else {
    if (!second) {
      const d = trapezoid(2 * k, 8 * k, 4 * k);
      d.scene.circles.push({ center: midpoint(midpoint(d.scene.points.A, d.scene.points.D), midpoint(d.scene.points.B, d.scene.points.C)), radius: 2 * k / d.unit });
      // The incenter lies on the symmetry axis halfway between the bases.
      add(group, `Трапеция ABCD с основаниями AD и BC описана около окружности. AB=${5 * k}, BC=${2 * k}, CD=${5 * k}. Найдите AD.`, 8 * k, `В описанном четырёхугольнике AB+CD=BC+AD. AD=${5 * k}+${5 * k}−${2 * k}=${8 * k}.`, d, length('A', 'D'), 'trapezoid');
    } else {
      const A: GridPoint = [-k, 2 * k], B: GridPoint = [k, 2 * k], C: GridPoint = [k, 0], D: GridPoint = [-k, 0];
      add(group, `O — середина стороны CD квадрата ABCD. Окружность с центром O проходит через A, её радиус равен ${k}√5. Найдите площадь квадрата.`, 4 * k * k, `Если сторона a, то OA²=a²+(a/2)²=5a²/4. S=a²=4R²/5=4·${5 * k * k}÷5=${4 * k * k}.`, drawing({ A, B, C, D, O }, ['A', 'B', 'C', 'D'], [['O', 'A']], [{ center: O, radius: k * Math.sqrt(5) }]), area('A', 'B', 'C', 'D'), 'rectangle');
    }
  }
}
export const circleProblemPool: readonly Problem[] = pool;
