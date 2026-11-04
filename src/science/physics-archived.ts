// Published single-curve exercises remain resolvable for saved rounds and review.
// New rounds use the v2 comparison exercises; these 20 tasks are not in the catalog.
import { upperTask, multipleTask, plot } from './physics-upper-common.ts';
import { fmt } from './physics-model.ts';
export const archivedPhysicsTasks = Array.from({ length: 20 }, (_, i) => {
  const n = i + 1, a = 2 + i % 5, b = 2 + Math.floor(i / 5), T = n / 2 + 1, A = a + 2;
  const figure = plot('t, с', 'x, см', Array.from({ length: 81 }, (_, j) => [2 * T * j / 80, A * Math.sin(4 * Math.PI * j / 80)]), [0, T / 2, T, 1.5 * T, 2 * T], [-A, 0, A], 'Свободные незатухающие колебания.');
  const truth = [`Амплитуда равна ${A} см.`, `Период равен ${fmt(T)} с.`];
  const falsehood = [`Размах колебаний равен ${A} см.`, `Период равен ${fmt(T / 2)} с.`, 'Амплитуда уменьшается со временем.'];
  const why = ['Амплитуда — максимальное отклонение от нуля.', 'Полный цикл проходит между ближайшими одинаковыми фазами.'].join(' ');
  const body = multipleTask('Используй график колебаний.', [...truth.map(text => ({ text, true: true, why })), ...falsehood.map(text => ({ text, true: false, why }))], 140300 + i, 65, [48, 156]);
  body.figure = figure; body.model = { rule: 'analysis-14-3', values: [n, a, b] };
  return upperTask(14, 3, i, body);
});
