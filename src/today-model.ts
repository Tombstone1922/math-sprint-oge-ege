import type { LearningProgress } from './learning-progress.ts';
import { modules } from './content.ts';
import { topicGroupNames } from './module-groups.ts';
import { detectiveGroups } from './study/detective-bank.ts';
export type ResumeItem = { id: string; title: string; description: string; path: '/exam' | '/extended-practice' | '/practice' | '/detective-practice'; daily?: boolean; at: number };
const sessionTime = (id: string) => Number(/(?:^|-)(\d{10,16})(?:-|$)/.exec(id)?.[1] ?? 0);
export function resumeItems(progress: LearningProgress): ResumeItem[] {
  const result: ResumeItem[] = [], exam = progress.study.exam.current, extended = progress.extended.active, daily = progress.daily.current, detective = progress.study.detective.current;
  if (exam && !exam.finishedAt) result.push({ id: exam.id, title: exam.weekly ? `Вариант ${exam.weekly.number} · ОГЭ` : 'Пробный экзамен ОГЭ', description: `Задание ${exam.position + 1} из 25 · ${exam.deadline === null ? 'без таймера' : 'с таймером'}`, path: '/exam', at: exam.startedAt });
  if (extended) {
    const updated = Object.values(progress.workbook.pages).filter(p => p.source === 'practice' && p.session === extended.id).map(p => p.updatedAt);
    result.push({ id: extended.id, title: `Вторая часть · №${extended.number}`, description: extended.position < extended.ids.length ? `Задача ${extended.position + 1} из ${extended.ids.length} · группа ${extended.group}` : 'Посмотреть итог подборки', path: '/extended-practice', at: Math.max(sessionTime(extended.id), ...updated) });
  }
  if (daily && !daily.finishedAt) result.push({ id: daily.id, title: 'Есть пять минут', description: `${daily.answers.length} из ${daily.tasks.length} заданий уже проверено`, path: '/practice', daily: true, at: Math.max(daily.startedAt, ...daily.answers.map(a => a.at)) });
  if (detective) result.push({ id: detective.id, title: 'Найди ошибку', description: detective.position < detective.ids.length ? `${detectiveGroups[detective.group - 1]} · ${detective.position + 1}/${detective.ids.length}` : 'Посмотреть итог подборки', path: '/detective-practice', at: sessionTime(detective.id) });
  return result.sort((a, b) => b.at - a.at || a.id.localeCompare(b.id));
}
export function nextTopic(progress: LearningProgress) {
  return modules.flatMap(module => Object.entries(progress.byModule[module.id]?.byGroup ?? {}).flatMap(([group, data]) => data.attempts >= 3 && data.independent / data.attempts < .8 ? [{ moduleId: module.id, title: module.title.replace(/^ОГЭ №\d+(?:–\d+)? · /, ''), group: Number(group), groupTitle: topicGroupNames[module.id]?.[Number(group) - 1] ?? `Группа ${group}`, ratio: data.independent / data.attempts }] : [])).sort((a, b) => a.ratio - b.ratio)[0] ?? null;
}
