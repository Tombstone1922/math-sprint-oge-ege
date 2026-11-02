import { conceptExample, conceptExamples, conceptReason, conceptTitles } from './concepts.ts';
import { quantities, quantity, unit, units } from './physics-units.ts';
export const PHYSICS_COURSE = 'physics-oge-1' as const;
export type ScienceCourseId = typeof PHYSICS_COURSE;
export type MatchingTask = { id: string; group: number; colorIndex: number; targets: string[]; options: string[]; base: boolean; concepts?: boolean };
export type ScienceGroup = { number: number; title: string; note: string; quantityIds: string[]; base?: boolean };
const group = (number: number, title: string, note: string, ids: string, base = false): ScienceGroup => ({ number, title, note, quantityIds: ids.split(' '), base });
export const physicsGroups: readonly ScienceGroup[] = [
  group(1, 'Понятия и примеры', 'Величина, единица, измерительный прибор и физическое явление.', ''),
  group(2, 'Движение и колебания', 'Различаем длину, скорость, ускорение, период и частоту.', 'path displacement time speed acceleration period frequency amplitude wavelength'),
  group(3, 'Силы, давление и плотность', 'Ньютон, паскаль, жёсткость пружины и механические величины.', 'force weight pressure density stiffness mass area volume path'),
  group(4, 'Работа, энергия и мощность', 'Не путаем джоули, ватты и единицу импульса.', 'work kinetic potential power force path time momentum stiffness'),
  group(5, 'Тепловые величины', 'Теплоёмкость, удельная теплоёмкость и удельная теплота.', 'heat internal specificHeat heatCapacity fusion vaporization combustion temperature mass density'),
  group(6, 'Электрические величины', 'Ампер, кулон, вольт, ом, работа и мощность тока.', 'current charge voltage resistance electricWork electricPower resistivity'),
  group(7, 'Волны и оптика', 'Период, частота, длина волны и оптическая сила линзы.', 'period frequency wavelength waveSpeed focal optical amplitude kinetic heat'),
  group(8, 'Через основные единицы СИ', 'Подставляем кг, м, с, А и К в формулы вместо названий единиц.', 'force pressure work power momentum stiffness frequency specificHeat heatCapacity voltage resistance resistivity charge density acceleration', true),
  group(9, 'Похожие названия', 'Вес и масса, работа и мощность, разные тепловые величины.', 'weight mass work power force pressure heat specificHeat heatCapacity fusion electricPower current charge resistance density volume'),
  group(10, 'Смешанная проверка', 'Три величины из разных разделов в одном задании.', quantities.map(q => q.id).join(' ')),
];
// Version 1: keep seed, lists and IDs stable once published; a changed bank needs a new version.
export function seededRandom(seed: number) { let n = seed >>> 0; return () => { n = (Math.imul(n, 1664525) + 1013904223) >>> 0; return n / 4294967296; }; }
export function shuffle<T>(items: readonly T[], random: () => number = Math.random): T[] {
  const out = [...items]; for (let i = out.length - 1; i > 0; i--) { const j = Math.min(i, Math.max(0, Math.floor(random() * (i + 1)))); [out[i], out[j]] = [out[j], out[i]]; } return out;
}
const seen = new Set<string>();
export const physicsTasks: MatchingTask[] = physicsGroups.flatMap(g => {
  if (g.number === 1) {
    const random = seededRandom(20271101), categories = Object.keys(conceptTitles);
    return Array.from({ length: 20 }, (_, i) => {
      const omitted = categories[i % 4], targets = shuffle(categories.filter(c => c !== omitted), random);
      const correct = targets.map((category, j) => conceptExamples.filter(e => e.category === category)[(i + j * 3) % 10].id);
      const distractors = shuffle(conceptExamples.filter(e => e.category === omitted), random).slice(0, 2).map(e => e.id);
      return { id: `physics1-v1-g1-${i + 1}`, group: 1, colorIndex: i, targets, options: shuffle([...correct, ...distractors], random), base: false, concepts: true };
    });
  }
  const ids = [...new Set(g.quantityIds)];
  const combinations: string[][] = [];
  for (let a = 0; a < ids.length; a++) for (let b = a + 1; b < ids.length; b++) for (let c = b + 1; c < ids.length; c++) {
    const triple = [ids[a], ids[b], ids[c]];
    if (new Set(triple.map(id => quantity(id).unit)).size === 3) combinations.push(triple);
  }
  const random = seededRandom(20271100 + g.number);
  const selected: string[][] = [];
  for (const ids of shuffle(combinations, random)) {
    const signature = `${g.base ? 'base' : 'named'}:${[...ids].sort().join(',')}`;
    if (seen.has(signature)) continue;
    seen.add(signature); selected.push(ids); if (selected.length === 20) break;
  }
  if (selected.length !== 20) throw new Error(`Physics group ${g.number} lacks distinct tasks`);
  return selected.map((ids, i) => {
    const targets = shuffle(ids, random), correct = targets.map(id => quantity(id).unit);
    const distractors = shuffle(units.map(u => u.id).filter(id => !correct.includes(id)), random).slice(0, 2);
    return { id: `physics1-v1-g${g.number}-${i + 1}`, group: g.number, colorIndex: i, targets, options: shuffle([...correct, ...distractors], random), base: Boolean(g.base) };
  });
});
const tasksById = new Map(physicsTasks.map(t => [t.id, t]));
export const scienceTask = (id: string) => tasksById.get(id);
export const scienceCourse = (id: unknown) => id === PHYSICS_COURSE ? { id: PHYSICS_COURSE, title: 'Физические понятия и единицы СИ', groups: physicsGroups, tasks: physicsTasks } : undefined;
export const unitText = (id: string, base: boolean) => base ? unit(id).base : `${unit(id).name} (${unit(id).symbol})`;
export const targetText = (task: MatchingTask, id: string) => task.concepts ? conceptTitles[id] : quantity(id).title;
export const optionText = (task: MatchingTask, id: string) => task.concepts ? conceptExample(id).text : unitText(id, task.base);
export function answerFor(task: MatchingTask, options: readonly string[] = task.options): string { return task.targets.map(id => task.concepts ? options.findIndex(option => conceptExample(option).category === id) + 1 : options.indexOf(quantity(id).unit) + 1).join(''); }
export function taskSolution(task: MatchingTask, options: readonly string[] = task.options) {
  if (task.concepts) return task.targets.map((id, i) => { const n = options.findIndex(option => conceptExample(option).category === id); return `${'АБВ'[i]}) ${conceptTitles[id]} → ${conceptExample(options[n]).text}: вариант ${n + 1}. ${conceptReason[id]}`; });
  return task.targets.map((id, i) => `${'АБВ'[i]}) ${quantity(id).title} → ${unitText(quantity(id).unit, task.base)}: вариант ${options.indexOf(quantity(id).unit) + 1}. ${quantity(id).reason}`);
}
