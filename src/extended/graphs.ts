import { fmt, interval, intervalText, sub, sum, taskBank, type GraphBranch, type Interval, type TaskBody } from './model.ts';

export const graphGroups = ['Парабола и касательная', 'Ветви параболы вниз', 'График модуля', 'Модуль со знаком минус', 'Парабола с выколотой точкой', 'Сокращение дроби и потерянная точка', 'Модуль квадратного трёхчлена', 'Сумма двух модулей', 'Парабола и луч: составной график', 'Две ветви с разрывом'];
const branch = (coefficients: [number, number, number], from: number | null = null, to: number | null = null, fromClosed = false, toClosed = false): GraphBranch => ({ coefficients, from, to, fromClosed, toClosed });
const quad = (h: number, k: number, sign = 1): [number, number, number] => [sign, -2 * sign * h, sign * h * h + k];
function graph(i: number, family: number, formula: string, branches: GraphBranch[], target: number, parts: Interval[], analysis: string, construction: string, data: Record<string, number>, holes: { x: number; y: number }[] = [], range?: [number, number, number, number]): TaskBody {
  const h = data.h ?? 0, k = data.k ?? 0;
  return { condition: `Постройте график функции\n${formula}.\nОпределите все значения m, при которых прямая y = m ${target === 0 ? 'не имеет общих точек с графиком' : `имеет с графиком ровно ${target} ${target === 1 ? 'общую точку' : 'общие точки'}`}.`,
    answer: intervalText(parts), answerSpec: { kind: 'intervals', intervals: parts },
    clues: ['Прямая y = m горизонтальна. Считай точки на каждом уровне, включая особые уровни.', construction],
    steps: [{ title: 'Строим с учётом области определения', text: construction }, { title: 'Считаем пересечения', text: analysis }, { title: 'Проверяем границы', text: `Нужное число пересечений: ${target}. Выколотая точка не считается; горизонтальный отрезок на уровне m даёт бесконечно много точек. Итог: ${intervalText(parts)}.` }],
    checklist: ['Указаны область определения, вершины и точки изменения формулы.', 'Выколотые и включённые концы отмечены правильно.', 'Особые значения m проверены отдельно; число пересечений обосновано.'],
    pitfall: 'Не продолжай ветвь за границу её определения. В точке стыка две записи функции могут описывать одну общую точку, а не две.',
    graph: { branches, holes, target, range: range ?? [h - 6, h + 6, k - 3, k + 12] }, model: { family: `graph-${family}`, data: { ...data, variant: i } } };
}
export const graphTasks = taskBank(22, [
  i => {
    const h = i - 10, k = i % 5 - 2;
    return graph(i, 1, `y = ${sum(`(${sub('x', h)})²`, k)}`, [branch(quad(h, k))], 1, [interval(k, k, true, true)], `Ниже ${fmt(k)} пересечений нет, на уровне ${fmt(k)} — вершина, выше — две точки.`, `Это парабола с ветвями вверх и вершиной (${fmt(h)}; ${fmt(k)}). Отметь симметричные точки на расстояниях 1 и 2 от вершины.`, { h, k });
  },
  i => {
    const h = i - 9, k = 2 + i % 4;
    return graph(i, 2, `y = ${sum(`−(${sub('x', h)})²`, k)}`, [branch(quad(h, k, -1))], 2, [interval(null, k)], `При m < ${k} прямая пересекает обе ветви; при m = ${k} — только вершину, при m > ${k} — ни одной точки.`, `Вершина (${fmt(h)}; ${k}), ветви направлены вниз.`, { h, k }, [], [h - 6, h + 6, k - 12, k + 3]);
  },
  i => {
    const h = i - 10, k = i % 5 - 2, a = 1 + i % 3;
    return graph(i, 3, `y = ${sum(`${a}|${sub('x', h)}|`, k)}`, [branch([0, -a, a * h + k], null, h, false, true), branch([0, a, k - a * h], h)], 2, [interval(k, null)], `Ниже вершины пересечений нет. На уровне ${fmt(k)} одна точка. Выше ${fmt(k)} — по одной на каждом луче.`, `Раскрой модуль отдельно при x ≤ ${fmt(h)} и x > ${fmt(h)}. Вершина (${fmt(h)}; ${fmt(k)}), наклоны лучей −${a} и ${a}.`, { h, k, a });
  },
  i => {
    const h = i - 8, k = 1 + i % 5, a = 1 + i % 3;
    return graph(i, 4, `y = ${sum(`−${a}|${sub('x', h)}|`, k)}`, [branch([0, a, k - a * h], null, h, false, true), branch([0, -a, k + a * h], h)], 0, [interval(k, null)], `Наибольшее значение функции ${k}. При m = ${k} вершина даёт одно пересечение, ниже — два. Поэтому ни одного пересечения только выше ${k}.`, `График состоит из двух лучей, направленных вниз от (${fmt(h)}; ${k}).`, { h, k, a }, [], [h - 6, h + 6, k - 12, k + 3]);
  },
  i => {
    const h = i - 10, k = i % 4 - 1, r = 1 + i % 3, holeX = h + r, holeY = k + r * r;
    return graph(i, 5, `y = ((${sub('x', holeX)})·[${sum(`(${sub('x', h)})²`, k)}])/(${sub('x', holeX)})`, [branch(quad(h, k))], 1, [interval(k, k, true, true), interval(holeY, holeY, true, true)], `На уровне вершины m = ${fmt(k)} одна точка. При m = ${fmt(holeY)} из двух симметричных точек одна выколота — остаётся одна. На остальных уровнях выше вершины две точки.`, `ОДЗ: x ≠ ${fmt(holeX)}. После сокращения получаем параболу с вершиной (${fmt(h)}; ${fmt(k)}), но точку (${fmt(holeX)}; ${fmt(holeY)}) выколоть обязательно.`, { h, k, r }, [{ x: holeX, y: holeY }]);
  },
  i => {
    const h = i - 10, k = i % 5 - 2, a = 1 + i % 3, r = 1 + i % 2, holeX = h + r, holeY = a * r + k;
    return graph(i, 6, `y = ((${sub('x', holeX)})·[${sum(`${a}(${sub('x', h)})`, k)}])/(${sub('x', holeX)})`, [branch([0, a, k - a * h])], 0, [interval(holeY, holeY, true, true)], `У невырожденной прямой на каждом горизонтальном уровне ровно одна точка. Исключена только точка уровня ${fmt(holeY)}, поэтому именно этот уровень не имеет пересечений.`, `Сначала ОДЗ x ≠ ${fmt(holeX)}, затем сокращение. Строй прямую y = ${sum(`${a}(${sub('x', h)})`, k)} с выколотой точкой (${fmt(holeX)}; ${fmt(holeY)}).`, { h, k, a, r }, [{ x: holeX, y: holeY }]);
  },
  i => {
    const h = i - 10, k = i % 4 - 1, r = 1 + i % 3, top = k + r * r, target = i % 2 ? 3 : 4;
    return graph(i, 7, `y = ${sum(`|(${sub('x', h)})² − ${r * r}|`, k)}`, [branch(quad(h, k - r * r), null, h - r, false, true), branch(quad(h, k + r * r, -1), h - r, h + r, false, true), branch(quad(h, k - r * r), h + r)], target, target === 3 ? [interval(top, top, true, true)] : [interval(k, top)], `При m < ${fmt(k)} точек нет; при m = ${fmt(k)} их две. Между ${fmt(k)} и ${fmt(top)} — четыре. При m = ${fmt(top)} — три (центральная вершина считается один раз). Выше — две.`, `Отрази отрицательную часть параболы y = (${sub('x', h)})² − ${r * r} вверх и сдвинь график по вертикали на ${fmt(k)}. Минимумы при x = ${fmt(h - r)}, ${fmt(h + r)}; средняя вершина (${fmt(h)}; ${fmt(top)}).`, { h, k, r }, [], [h - r - 3, h + r + 3, k - 2, top + 4]);
  },
  i => {
    const h = i - 10, k = i % 3, b = h + 2 + i % 4, level = b - h + k;
    return graph(i, 8, `y = ${sum(`|${sub('x', h)}| + |${sub('x', b)}|`, k)}`, [branch([0, -2, h + b + k], null, h, false, true), branch([0, 0, level], h, b, false, true), branch([0, 2, -h - b + k], b)], 2, [interval(level, null)], `При m < ${level} точек нет. При m = ${level} весь отрезок от x = ${fmt(h)} до x = ${fmt(b)} лежит на прямой — точек бесконечно много. Выше — два пересечения с лучами.`, `Раскрой модули на трёх промежутках: x ≤ ${fmt(h)}, ${fmt(h)} < x ≤ ${fmt(b)}, x > ${fmt(b)}. На среднем промежутке функция постоянна и равна ${level}.`, { h, k, b }, [], [h - 3, b + 3, level - 2, level + 8]);
  },
  i => {
    const h = i - 10, k = i % 4 - 1;
    return graph(i, 9, `y = ${sum(`(${sum(sub('x', h), 1)})²`, k)} при x ≥ ${fmt(h - 2)};\ny = ${sum(sub('x', h), 6 + k)} при x < ${fmt(h - 2)}`, [branch(quad(h - 1, k), h - 2, null, true), branch([0, 1, 6 - h + k], null, h - 2)], 2, [interval(k, k, true, true), interval(k + 1, k + 4)], `Луч даёт одну точку при m < ${fmt(k + 4)}. Часть параболы даёт: 0 при m < ${fmt(k)}; 1 при m = ${fmt(k)}; 2 при ${fmt(k)} < m ≤ ${fmt(k + 1)}; 1 при m > ${fmt(k + 1)}. Сумма равна 2 при m = ${fmt(k)} и ${fmt(k + 1)} < m < ${fmt(k + 4)}.`, `Парабола имеет вершину (${fmt(h - 1)}; ${fmt(k)}), начинается включённой точкой (${fmt(h - 2)}; ${fmt(k + 1)}). Луч оканчивается выколотой точкой (${fmt(h - 2)}; ${fmt(k + 4)}).`, { h, k });
  },
  i => {
    const h = i - 9, k = i % 4 - 2, c = 2 + i % 4;
    return graph(i, 10, `y = ${sum(`(${sub('x', h)})²`, k)} при x ≤ ${fmt(h)};\ny = ${sum(sub('x', h), k + c)} при x > ${fmt(h)}`, [branch(quad(h, k), null, h, false, true), branch([0, 1, k + c - h], h)], 1, [interval(k, k + c, true, true)], `Левая половина параболы даёт одну точку при m ≥ ${fmt(k)}, иначе ноль. Правый луч даёт одну точку только при m > ${fmt(k + c)}. Поэтому ровно одна точка при ${fmt(k)} ≤ m ≤ ${fmt(k + c)}.`, `Вершина левой ветви (${fmt(h)}; ${fmt(k)}) включена. Начальная точка луча (${fmt(h)}; ${fmt(k + c)}) исключена. Между ними разрыв, соединять точки нельзя.`, { h, k, c });
  },
]);
