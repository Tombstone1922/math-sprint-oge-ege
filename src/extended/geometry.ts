import { makeGridScene, type GridPoint, type GridScene } from '../grid-geometry.ts';
import { fmt, taskBank, type TaskBody } from './model.ts';

type Points = Record<string, GridPoint>;
export const mid = (a: GridPoint, b: GridPoint): GridPoint => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
export const along = (a: GridPoint, b: GridPoint, t: number): GridPoint => [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])];
export function drawing(points: Points, polygon: string[], segments: string[][] = [], circles: { center: GridPoint; radius: number }[] = [], variant = 0): GridScene {
  return { ...makeGridScene(points, polygon.length ? [{ vertices: polygon.map(n => points[n]) }] : [], segments.map(([a, b]) => [points[a], points[b]]), circles, variant), grid: false };
}
export function geometry(condition: string, answer: string | number, family: string, data: Record<string, number>, scene: GridScene, reasoning: string[], clues: [string, string], proof = false): TaskBody {
  return { condition, answer: typeof answer === 'number' ? fmt(answer) : answer, answerSpec: typeof answer === 'number' ? { kind: 'numbers', values: [answer] } : undefined,
    scene, model: { family, data }, clues, steps: reasoning.map((text, i) => ({ title: ['Находим ключевую связь', 'Обосновываем вспомогательный шаг', 'Продолжаем решение', 'Получаем результат', 'Проверяем вывод'][i] ?? `Шаг ${i + 1}`, text })),
    checklist: proof ? ['Каждое равенство углов или отрезков следует из условия или названной теоремы.', 'Для равенства или подобия треугольников указан признак и соответствие вершин.', 'Доказано именно требуемое утверждение для всей конфигурации.'] : ['Проведены и обозначены нужные вспомогательные линии.', 'У каждого вычисления указано геометрическое основание.', 'Получен ответ на вопрос задачи, указаны единицы.'],
    pitfall: proof ? 'Измерение по рисунку и проверка на одном числовом примере не заменяют доказательство.' : 'Рисунок помогает увидеть связь. Все длины, углы и площади нужно выводить из условия, а не измерять на экране.' };
}
export const geometry23Groups = ['Биссектрисы при боковой стороне', 'Равнобедренный треугольник и окружность', 'Высота прямоугольного треугольника', 'Площадь равнобедренной трапеции', 'Касательная из внешней точки', 'Хорда и расстояние до центра', 'Подобие и отношение площадей', 'Диагонали и площадь ромба', 'Описанная окружность треугольника', 'Биссектриса параллелограмма'];
export const geometry23Tasks = taskBank(23, [
  i => {
    const k = i + 1, p = 3 * k, q = 4 * k, leg = 5 * k, angle = 2 * Math.atan2(q, p), u: GridPoint = [Math.cos(angle), Math.sin(angle)];
    const A: GridPoint = [0, 0], B: GridPoint = [leg, 0], F: GridPoint = [p * p / leg, p * q / leg], C: GridPoint = [leg + leg * u[0], leg * u[1]], D: GridPoint = [2 * leg * u[0], 2 * leg * u[1]];
    return geometry(`В трапеции ABCD основания AD и BC параллельны. Биссектрисы углов BAD и ABC пересекаются в точке F. AF = ${p}, BF = ${q}. Найдите AB. Обоснуйте решение.`, leg, 'g23-bisectors', { k, p, q, leg }, drawing({ A, B, C, D, F }, ['A', 'B', 'C', 'D'], [['A', 'F'], ['B', 'F']], [], i), [
      'Углы BAD и ABC — односторонние при параллельных основаниях, их сумма 180°.',
      'AF и BF — биссектрисы, поэтому ∠FAB + ∠ABF = 90°. В треугольнике AFB угол AFB равен 90°.',
      `По теореме Пифагора AB² = AF² + BF² = ${p * p} + ${q * q} = ${leg * leg}. AB = ${leg}.`,
    ], ['Сложи два угла при боковой стороне трапеции.', 'Половины этих углов в сумме дают 90°. Что это означает для треугольника AFB?']);
  },
  i => {
    const k = i + 1, side = 5 * k, base = 6 * k, height = 4 * k, radius = 1.5 * k;
    return geometry(`В равнобедренном треугольнике ABC боковые стороны AB и AC равны ${side}, основание BC равно ${base}. Найдите радиус вписанной окружности.`, radius, 'g23-inradius', { k, side, base, height, radius }, drawing({ A: [0, height], B: [-base / 2, 0], C: [base / 2, 0], H: [0, 0], O: [0, radius] }, ['A', 'B', 'C'], [['A', 'H']], [{ center: [0, radius], radius }]), [
      `Высота AH делит основание пополам: BH = ${base / 2}. Из прямоугольного ABH: AH² = ${side}² − ${base / 2}² = ${height * height}; AH = ${height}.`,
      `S = BC · AH/2 = ${12 * k * k}. Полупериметр p = (${side} + ${side} + ${base})/2 = ${8 * k}.`,
      `Площадь равна произведению радиуса вписанной окружности на полупериметр: S = rp. r = ${12 * k * k}/${8 * k} = ${fmt(radius)}.`,
    ], ['Проведи высоту к основанию равнобедренного треугольника.', 'Найди площадь и полупериметр; затем используй S = rp.']);
  },
  i => {
    const k = i + 1, hyp = 5 * k, leg = 3 * k, other = 4 * k, height = 12 * k / 5;
    return geometry(`В прямоугольном треугольнике ABC угол C равен 90°, AB = ${hyp}, AC = ${leg}. CD — высота к гипотенузе. Найдите CD.`, height, 'g23-altitude', { k, hyp, leg, other, height }, drawing({ A: [0, 0], B: [hyp, 0], C: [9 * k / 5, height], D: [9 * k / 5, 0] }, ['A', 'B', 'C'], [['C', 'D']]), [
      `BC² = AB² − AC² = ${hyp}² − ${leg}² = ${other * other}; BC = ${other}.`,
      `Площадь через катеты S = AC · BC/2, а через гипотенузу S = AB · CD/2.`,
      `Приравниваем: CD = AC · BC/AB = ${leg} · ${other}/${hyp} = ${fmt(height)}.`,
    ], ['Высоту можно найти, выразив площадь двумя способами.', 'Сначала найди второй катет по теореме Пифагора.']);
  },
  i => {
    const k = i + 1, small = 10 * k, large = 18 * k, leg = 5 * k, height = 3 * k, area = 42 * k * k;
    return geometry(`Основания равнобедренной трапеции ABCD равны AD = ${large} и BC = ${small}, боковая сторона AB = ${leg}. Найдите площадь трапеции.`, area, 'g23-trapezoid', { k, small, large, leg, height, area }, drawing({ A: [0, 0], B: [4 * k, height], C: [14 * k, height], D: [large, 0], H: [4 * k, 0] }, ['A', 'B', 'C', 'D'], [['B', 'H']]), [
      `Опустим BH на AD. В равнобедренной трапеции AH = (AD − BC)/2 = ${4 * k}.`,
      `Из ABH: BH² = AB² − AH² = ${leg * leg} − ${16 * k * k} = ${height * height}; BH = ${height}.`,
      `S = (AD + BC) · BH/2 = (${large} + ${small}) · ${height}/2 = ${area}.`,
    ], ['Опусти высоты от концов меньшего основания.', 'Два крайних прямоугольных треугольника равны, поэтому разность оснований делится пополам.']);
  },
  i => {
    const k = i + 1, radius = 5 * k, distance = 13 * k, tangent = 12 * k, A: GridPoint = [radius * radius / distance, radius * tangent / distance];
    return geometry(`Из точки P к окружности с центром O проведена касательная PA. Радиус окружности ${radius}, OP = ${distance}. Найдите периметр треугольника OAP.`, radius + distance + tangent, 'g23-tangent', { k, radius, distance, tangent }, drawing({ O: [0, 0], P: [distance, 0], A }, [], [['O', 'P'], ['P', 'A'], ['O', 'A']], [{ center: [0, 0], radius }]), [
      'Радиус OA перпендикулярен касательной PA в точке касания. Треугольник OAP прямоугольный.',
      `PA² = OP² − OA² = ${distance}² − ${radius}² = ${tangent * tangent}, поэтому PA = ${tangent}.`,
      `Периметр OA + AP + OP = ${radius} + ${tangent} + ${distance} = ${30 * k}.`,
    ], ['Используй свойство радиуса в точке касания.', 'Искомый периметр включает радиус, касательную и расстояние OP.']);
  },
  i => {
    const k = i + 1, half = 8 * k, distance = 6 * k, radius = 10 * k;
    return geometry(`Хорда AB окружности равна ${2 * half}. Расстояние от центра O до хорды равно ${distance}. Найдите диаметр окружности.`, 2 * radius, 'g23-chord', { k, half, distance, radius }, drawing({ A: [-half, distance], B: [half, distance], O: [0, 0], M: [0, distance] }, [], [['A', 'B'], ['O', 'M'], ['O', 'A']], [{ center: [0, 0], radius }]), [
      'Перпендикуляр OM из центра к хорде делит её пополам.',
      `AM = ${half}. Из OMA: OA² = OM² + AM² = ${distance * distance} + ${half * half} = ${radius * radius}. Радиус OA = ${radius}.`,
      `Диаметр вдвое больше радиуса: d = ${2 * radius}.`,
    ], ['Соедини центр с концом хорды и её серединой.', 'Половина хорды и расстояние до неё — катеты; радиус — гипотенуза.']);
  },
  i => {
    const k = i + 1;
    return geometry(`В треугольнике ABC точки D и E лежат на AB и AC, DE ∥ BC. AD = ${3 * k}, DB = ${2 * k}. Площадь ADE равна ${9 * k * k}. Найдите площадь ABC.`, 25 * k * k, 'g23-similar-area', { k, ad: 3 * k, db: 2 * k, smallArea: 9 * k * k, area: 25 * k * k },
      // Only the ratio AD:DB is prescribed; choose AB = 5k on the actual drawing too.
      drawing({ A: [0, 4 * k], B: [-3 * k, 0], C: [9.5 * k, 0], D: along([0, 4 * k], [-3 * k, 0], .6), E: along([0, 4 * k], [9.5 * k, 0], .6) }, ['A', 'B', 'C'], [['D', 'E']]), [
        'Треугольники ADE и ABC подобны по двум углам: общий угол A и равные соответственные углы при DE ∥ BC.',
        `AB = AD + DB = ${5 * k}. Коэффициент подобия AD/AB = 3/5. Отношение площадей равно квадрату коэффициента: 9/25.`,
        `S(ABC) = ${9 * k * k} · 25/9 = ${25 * k * k}.`,
      ], ['Из параллельности следует подобие треугольников.', 'Площади относятся как квадраты соответствующих сторон.']);
  },
  i => {
    const k = i + 1, side = 5 * k, diagonal = 6 * k, other = 8 * k;
    return geometry(`Сторона ромба ABCD равна ${side}, диагональ AC равна ${diagonal}. Найдите площадь ромба.`, 24 * k * k, 'g23-rhombus', { k, side, diagonal, other }, drawing({ A: [-3 * k, 0], B: [0, 4 * k], C: [3 * k, 0], D: [0, -4 * k], O: [0, 0] }, ['A', 'B', 'C', 'D'], [['A', 'C'], ['B', 'D']]), [
      `Диагонали ромба перпендикулярны и делятся точкой пересечения O пополам. AO = ${3 * k}.`,
      `Из AOB: BO² = AB² − AO² = ${side * side} − ${9 * k * k} = ${16 * k * k}; BO = ${4 * k}. Значит, BD = ${other}.`,
      `S = AC · BD/2 = ${diagonal} · ${other}/2 = ${24 * k * k}.`,
    ], ['Рассмотри прямоугольный треугольник, образованный полудиагоналями.', 'Найди вторую диагональ, затем используй S = d₁d₂/2.']);
  },
  i => {
    const k = i + 1, radius = 65 * k / 8;
    return geometry(`Стороны треугольника ABC равны AB = ${13 * k}, BC = ${14 * k}, AC = ${15 * k}. Найдите радиус описанной окружности.`, radius, 'g23-circumradius', { k, ab: 13 * k, bc: 14 * k, ac: 15 * k, area: 84 * k * k, radius }, drawing({ A: [5 * k, 12 * k], B: [0, 0], C: [14 * k, 0], H: [5 * k, 0], O: [7 * k, 33 * k / 8] }, ['A', 'B', 'C'], [['A', 'H']], [{ center: [7 * k, 33 * k / 8], radius }]), [
      `Полупериметр p = ${21 * k}. По формуле Герона S² = p(p − AB)(p − BC)(p − AC) = (${84 * k * k})², значит S = ${84 * k * k}.`,
      'Формула площади S = abc/(4R) даёт радиус описанной окружности R = abc/(4S).',
      `R = (${13 * k} · ${14 * k} · ${15 * k})/(4 · ${84 * k * k}) = ${fmt(radius)}.`,
    ], ['Для радиуса описанной окружности нужна площадь.', 'Площадь по трём сторонам можно найти по формуле Герона.']);
  },
  i => {
    const k = i + 1, a = 3 * k, b = 5 * k, A: GridPoint = [0, 0], B: GridPoint = [a, 0], D: GridPoint = [3 * k, 4 * k], C: GridPoint = [6 * k, 4 * k], E = along(B, C, .6);
    return geometry(`Биссектриса угла BAD параллелограмма ABCD пересекает сторону BC в E. AB = ${a}, EC = ${2 * k}. Найдите периметр параллелограмма.`, 16 * k, 'g23-parallelogram', { k, a, b, ec: 2 * k }, drawing({ A, B, C, D, E }, ['A', 'B', 'C', 'D'], [['A', 'E']]), [
      'AD ∥ BC, поэтому ∠DAE = ∠AEB. По свойству биссектрисы ∠BAE = ∠DAE, значит ∠BAE = ∠AEB.',
      `Треугольник ABE равнобедренный: BE = AB = ${a}. BC = BE + EC = ${b}.`,
      `Периметр равен 2(AB + BC) = 2(${a} + ${b}) = ${16 * k}.`,
    ], ['Найди равные углы в треугольнике ABE.', 'Используй параллельность AD и BE вместе со свойством биссектрисы.']);
  },
]);
