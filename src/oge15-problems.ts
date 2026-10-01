import type { FigureSpec, Problem } from './engine.ts';
import { drawing, midpoint, polar, rad, type Drawing, type GeometryMeasure } from './analytic-geometry.ts';
import type { GridPoint } from './grid-geometry.ts';
export const triangleGroups = ['Сумма углов и внешний угол', 'Равнобедренный треугольник', 'Теорема Пифагора', 'Синус, косинус и тангенс', 'Площадь треугольника', 'Биссектриса и высота', 'Равносторонний треугольник', 'Средняя линия и подобие', 'Медиана и прямоугольные треугольники', 'Диагональ и биссектриса параллелограмма'] as const;
const pool: Problem[] = [];
const length = (a: string, b: string): GeometryMeasure => ({ kind: 'length', points: [a, b] });
const angle = (a: string, b: string, c: string): GeometryMeasure => ({ kind: 'angle', points: [a, b, c] });
const area = (...points: string[]): GeometryMeasure => ({ kind: 'area', points });
const fmt = (n: number) => String(Number(n.toFixed(8))).replace('.', ',');
function add(group: number, expression: string, answer: number, hint: string, d: Drawing, geometryMeasure: GeometryMeasure, kind: FigureSpec['kind'] = 'triangle') {
  pool.push({ id: `oge-15-g${group}-${pool.length % 20 + 1}`, colorIndex: pool.length % 20, expression, answer: String(Number(answer.toFixed(8))), hint, geometryMeasure, figure: { kind, scene: d.scene, unit: d.unit } });
}
function triangle(alpha: number, gamma: number, base = 6): Record<string, GridPoint> {
  const ab = base * Math.sin(rad(gamma)) / Math.sin(rad(180 - alpha - gamma));
  return { A: [0, 0], B: polar(ab, alpha), C: [base, 0] };
}
for (let group = 1; group <= 10; group++) for (let j = 0; j < 20; j++) {
  const k = j + 1, second = j % 2 === 1;
  if (group === 1) {
    const alpha = 30 + j, beta = 45 + j / 2, gamma = 180 - alpha - beta, points = triangle(alpha, gamma);
    if (!second) add(group, `В треугольнике ABC ∠A=${alpha}°, ∠B=${fmt(beta)}°. Найдите ∠C в градусах.`, gamma, `∠C=180−${alpha}−${fmt(beta)}=${fmt(gamma)}°.`, drawing(points, ['A', 'B', 'C']), angle('A', 'C', 'B'));
    else add(group, `В треугольнике ABC ∠C=${fmt(gamma)}°. Сторону AC продлили за C до D. Найдите внешний угол BCD в градусах.`, 180 - gamma, `Внутренний и смежный внешний углы в сумме равны 180°. ∠BCD=180−${fmt(gamma)}=${fmt(180 - gamma)}°.`, drawing({ ...points, D: [8, 0] }, ['A', 'B', 'C'], [['C', 'D']]), angle('B', 'C', 'D'));
  } else if (group === 2) {
    const top = second ? 50 + 2 * j : 25 + 3 * j;
    const A: GridPoint = [0, 0], B: GridPoint = [3, 3 / Math.tan(rad(top / 2))], C: GridPoint = [6, 0];
    if (!second) add(group, `В равнобедренном треугольнике ABC AB=BC, ∠ABC=${top}°. Найдите ∠BAC в градусах.`, (180 - top) / 2, `Углы при основании AC равны. ∠BAC=(180−${top})/2=${fmt((180 - top) / 2)}°.`, drawing({ A, B, C }, ['A', 'B', 'C']), angle('B', 'A', 'C'), 'isosceles');
    else {
      const external = (180 + top) / 2;
      add(group, `В треугольнике ABC AB=BC. Сторону CA продлили за A до D. Внешний угол DAB равен ${external}°. Найдите ∠ABC в градусах.`, top, `Угол A=180−${external}=${180 - external}°. Угол C такой же. ∠B=180−2·${180 - external}=${top}°.`, drawing({ A, B, C, D: [-2, 0] }, ['A', 'B', 'C'], [['D', 'A']]), angle('A', 'B', 'C'), 'isosceles');
    }
  } else if (group === 3) {
    const A: GridPoint = [3 * k, 0], B: GridPoint = [0, 4 * k], C: GridPoint = [0, 0];
    add(group, second ? `В треугольнике ABC ∠C=90°, AC=${3 * k}, AB=${5 * k}. Найдите BC.` : `В треугольнике ABC ∠C=90°, AC=${3 * k}, BC=${4 * k}. Найдите AB.`, second ? 4 * k : 5 * k, second ? `BC²=AB²−AC²=${5 * k}²−${3 * k}². BC=${4 * k}.` : `AB²=AC²+BC²=${3 * k}²+${4 * k}². AB=${5 * k}.`, drawing({ A, B, C }, ['A', 'B', 'C']), second ? length('B', 'C') : length('A', 'B'), 'right-triangle');
  } else if (group === 4) {
    const A: GridPoint = [4 * k, 0], B: GridPoint = [0, 3 * k], C: GridPoint = [0, 0], d = drawing({ A, B, C }, ['A', 'B', 'C']);
    if (second) add(group, `В треугольнике ABC ∠C=90°, AC=${4 * k}, tgA=3/4. Найдите BC.`, 3 * k, `tgA=BC/AC. BC=AC·tgA=${4 * k}·3/4=${3 * k}.`, d, length('B', 'C'), 'right-triangle');
    else if (j % 4 === 0) add(group, `В треугольнике ABC ∠C=90°, BC=${3 * k}, sinA=3/5. Найдите AB.`, 5 * k, `sinA=BC/AB, значит AB=BC/sinA=${3 * k}/(3/5)=${5 * k}.`, d, length('A', 'B'), 'right-triangle');
    else add(group, `В треугольнике ABC ∠C=90°, AC=${4 * k}, cosA=4/5. Найдите AB.`, 5 * k, `cosA=AC/AB, значит AB=AC/cosA=${4 * k}/(4/5)=${5 * k}.`, d, length('A', 'B'), 'right-triangle');
  } else if (group === 5) {
    if (!second) {
      const a = 4 + j, h = 3 + j, A: GridPoint = [0, 0], B: GridPoint = [2, h], C: GridPoint = [a, 0], H: GridPoint = [2, 0];
      add(group, `В треугольнике ABC AC=${a}, высота BH=${h}. Найдите площадь.`, a * h / 2, `S=AC·BH/2=${a}·${h}/2=${fmt(a * h / 2)}.`, drawing({ A, B, C, H }, ['A', 'B', 'C'], [['B', 'H']]), area('A', 'B', 'C'));
    } else {
      const a = 5 * k, b = k + 3, A: GridPoint = [a, 0], B: GridPoint = [0, 0], C: GridPoint = [0.6 * b, 0.8 * b];
      add(group, `В треугольнике ABC AB=${a}, BC=${b}, sin∠ABC=4/5. Найдите площадь.`, 2 * k * b, `S=AB·BC·sinB/2=${a}·${b}·(4/5)/2=${2 * k * b}.`, drawing({ A, B, C }, ['A', 'B', 'C']), area('A', 'B', 'C'));
    }
  } else if (group === 6) {
    const alpha = 25 + j, p = triangle(alpha, 60), ab = Math.hypot(p.B[0], p.B[1]);
    if (!second) {
      const D: GridPoint = [(6 * p.B[0] + ab * p.C[0]) / (6 + ab), 6 * p.B[1] / (6 + ab)];
      add(group, `В треугольнике ABC ∠BAC=${alpha}°, AD — биссектриса. Найдите ∠BAD в градусах.`, alpha / 2, `Биссектриса делит угол пополам. ∠BAD=${alpha}/2=${fmt(alpha / 2)}°.`, drawing({ ...p, D }, ['A', 'B', 'C'], [['A', 'D']]), angle('B', 'A', 'D'));
    } else {
      const H: GridPoint = [p.B[0], 0];
      add(group, `В треугольнике ABC BH — высота к AC, ∠BAC=${alpha}°. Найдите ∠ABH в градусах.`, 90 - alpha, `В прямоугольном треугольнике ABH: ∠ABH=90−${alpha}=${90 - alpha}°.`, drawing({ ...p, H }, ['A', 'B', 'C'], [['B', 'H']]), angle('A', 'B', 'H'));
    }
  } else if (group === 7) {
    const side = second ? 2 * k * Math.sqrt(3) : 2 * k, h = side * Math.sqrt(3) / 2, A: GridPoint = [-side / 2, 0], B: GridPoint = [0, h], C: GridPoint = [side / 2, 0], H: GridPoint = [0, 0];
    add(group, second ? `Сторона равностороннего треугольника ABC равна ${2 * k}√3. Найдите медиану BH.` : `Медиана BH равностороннего треугольника ABC равна ${k}√3. Найдите сторону AB.`, second ? 3 * k : 2 * k, second ? `Медиана совпадает с высотой: BH=a√3/2=${2 * k}√3·√3/2=${3 * k}.` : `h=a√3/2. a=2h/√3=2·${k}√3/√3=${2 * k}.`, drawing({ A, B, C, H }, ['A', 'B', 'C'], [['B', 'H']]), second ? length('B', 'H') : length('A', 'B'), 'isosceles');
  } else if (group === 8) {
    const base = second ? 6 * k : 2 * k + 5, A: GridPoint = [0, 0], B: GridPoint = [base / 2, second ? 3 * k : 4 + j], C: GridPoint = [base, 0];
    const M = midpoint(A, B), N = midpoint(B, C);
    if (!second) add(group, `M и N — середины AB и BC треугольника ABC. AC=${base}. Найдите MN.`, base / 2, `Средняя линия параллельна AC и равна половине AC: MN=${base}/2=${fmt(base / 2)}.`, drawing({ A, B, C, M, N }, ['A', 'B', 'C'], [['M', 'N']]), length('M', 'N'));
    else {
      const ratio = 2 / 3, M: GridPoint = [B[0] + (A[0] - B[0]) * ratio, B[1] * (1 - ratio)], N: GridPoint = [B[0] + (C[0] - B[0]) * ratio, B[1] * (1 - ratio)];
      add(group, `В треугольнике ABC MN∥AC, M лежит на AB, N — на BC. AC=${6 * k}, MN=${4 * k}, площадь ABC равна ${9 * k * k}. Найдите площадь MBN.`, 4 * k * k, `Треугольники подобны с коэффициентом MN/AC=2/3. Площади относятся как квадрат коэффициента: S(MBN)=${9 * k * k}·(2/3)²=${4 * k * k}.`, drawing({ A, B, C, M, N }, ['A', 'B', 'C'], [['M', 'N']]), area('M', 'B', 'N'));
    }
  } else if (group === 9) {
    if (!second) {
      const A: GridPoint = [0, 0], B: GridPoint = [3.6 * k, 4.8 * k], C: GridPoint = [10 * k, 0], M = midpoint(A, C);
      add(group, `В треугольнике ABC ∠B=90°, AC=${10 * k}. BM — медиана к гипотенузе. Найдите BM.`, 5 * k, `Медиана к гипотенузе равна половине гипотенузы: BM=AC/2=${5 * k}.`, drawing({ A, B, C, M }, ['A', 'B', 'C'], [['B', 'M']]), length('B', 'M'), 'right-triangle');
    } else {
      const A: GridPoint = [0, 0], B: GridPoint = [3 * k, 2 * k], C: GridPoint = [4 * k, 0], M: GridPoint = [2 * k, 0], H: GridPoint = [3 * k, 0];
      add(group, `В треугольнике ABC BM — медиана, BH — высота к AC. AC=${4 * k}, BC=BM. Найдите AH.`, 3 * k, `MC=AC/2=${2 * k}. Треугольник BMC равнобедренный; высота BH делит MC пополам: MH=${k}. AH=AM+MH=${2 * k}+${k}=${3 * k}.`, drawing({ A, B, C, M, H }, ['A', 'B', 'C'], [['B', 'M'], ['B', 'H']]), length('A', 'H'));
    }
  } else {
    if (!second) {
      const theta = 22 + 5 * j, A: GridPoint = [0, 0], C: GridPoint = [8, 0], B = polar(4, theta), D: GridPoint = [8 - B[0], -B[1]], O: GridPoint = [4, 0];
      add(group, `В параллелограмме ABCD диагональ AC вдвое больше AB, ∠ACD=${theta}°. Найдите меньший угол между диагоналями в градусах.`, (180 - theta) / 2, `O — середина AC, поэтому AO=AB. CD∥AB, значит ∠BAO=${theta}°. В равнобедренном треугольнике ABO: ∠AOB=(180−${theta})/2=${fmt((180 - theta) / 2)}°.`, drawing({ A, B, C, D, O }, ['A', 'B', 'C', 'D'], [['A', 'C'], ['B', 'D']]), angle('A', 'O', 'B'), 'rectangle');
    } else {
      const beta = 14 + j, A: GridPoint = [0, 0], B = polar(3, 2 * beta), D: GridPoint = [6, 0], C: GridPoint = [6 + B[0], B[1]], E: GridPoint = [B[1] / Math.tan(rad(beta)), B[1]];
      add(group, `В параллелограмме ABCD AE — биссектриса угла A, E лежит на BC. Острый угол между AE и BC равен ${beta}°. Найдите острый угол параллелограмма в градусах.`, 2 * beta, `BC∥AD. ∠EAD=${beta}°; биссектриса делит ∠A пополам. ∠A=2·${beta}=${2 * beta}°.`, drawing({ A, B, C, D, E }, ['A', 'B', 'C', 'D'], [['A', 'E']]), angle('B', 'A', 'D'), 'rectangle');
    }
  }
}
export const triangleProblemPool: readonly Problem[] = pool;
