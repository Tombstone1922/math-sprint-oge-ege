import { algebraGroups, algebraTasks } from './algebra.ts';
import { wordGroups, wordTasks } from './word.ts';
import { graphGroups, graphTasks } from './graphs.ts';
import { geometry23Groups, geometry23Tasks } from './geometry.ts';
import { proofGroups, proofTasks } from './proofs.ts';
import { advancedGroups, advancedTasks } from './advanced.ts';
import type { ExtendedNumber } from './model.ts';

export const extendedModules = [
  { number: 20, title: 'Уравнения и неравенства', subtitle: 'Равносильность, ОДЗ, все корни и промежутки', groups: algebraGroups, tasks: algebraTasks, plan: 'Запиши ограничения. Преобразуй по шагам. Проверь кандидатов и границы. Для системы нужны все условия одновременно.' },
  { number: 21, title: 'Текстовые задачи', subtitle: 'Движение, работа, смеси и проценты', groups: wordGroups, tasks: wordTasks, plan: 'Назови неизвестное и единицы. Вырази остальные величины. Составь уравнение по смыслу условия. После решения проверь физический смысл корней.' },
  { number: 22, title: 'Графики и параметры', subtitle: 'Построение и число пересечений с y = m', groups: graphGroups, tasks: graphTasks, plan: 'Сначала построй график на бумаге: ОДЗ, вершины, границы ветвей. Затем проведи горизонтальные прямые на разных уровнях. Особые уровни проверь отдельно.' },
  { number: 23, title: 'Геометрия: вычисление', subtitle: 'Рисунок, вспомогательная линия и обоснование', groups: geometry23Groups, tasks: geometry23Tasks, plan: 'Выпиши данные, отметь их на рисунке. Найди подходящую теорему. Если нужно, проведи высоту, радиус или параллельную прямую. Обоснуй каждое вычисление.' },
  { number: 24, title: 'Геометрия: доказательство', subtitle: 'Подобие, углы, отношения и площади', groups: proofGroups, tasks: proofTasks, plan: 'Запиши, что дано и что требуется доказать. Найди цепочку равных углов, подобие или сравнение площадей. Каждый переход должен опираться на условие или теорему.' },
  { number: 25, title: 'Геометрия: сложные задачи', subtitle: 'Несколько идей в одном решении', groups: advancedGroups, tasks: advancedTasks, plan: 'Разбей задачу на этапы. Сначала выведи геометрические связи, затем составь уравнение. Не округляй промежуточные значения и проверь положение вспомогательных точек.' },
] as const;
export const allExtendedTasks = extendedModules.flatMap(m => m.tasks);
const byId = new Map(allExtendedTasks.map(t => [t.id, t]));
export const extendedTask = (id: string) => byId.get(id);
export const extendedModule = (number: number) => extendedModules.find(m => m.number === number);
export const extendedGroup = (number: ExtendedNumber, group: number) => extendedModule(number)!.tasks.filter(t => t.group === group);
