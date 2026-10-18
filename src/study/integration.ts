import { reduceStudy, type StudyAction } from './state.ts';
import { examResults, type ExamSession } from './exam.ts';
import { findLearningProblem, mistakeKey, type LearningProgress } from '../learning-progress.ts';

// Exam scores and detective attempts remain separate from checked-answer training accuracy.
// Failed exam tasks still enter the existing spaced-repeat queues atomically with submission.
export function applyStudy(state: LearningProgress, action: StudyAction, now = Date.now()): LearningProgress {
  const study = reduceStudy(state.study, action, now);
  if (study === state.study) return state;
  let next = { ...state, study };
  const before = state.study.exam.current, after = study.exam.current;
  if (before && after && before.id === after.id && !before.finishedAt && after.finishedAt) {
    const mistakes = { ...state.mistakes };
    for (const { ref, correct } of examResults(after).first) if (!correct && ref.moduleId !== 'extended' && findLearningProblem(ref.moduleId, ref.group, ref.problemId)) {
      const key = mistakeKey(ref.moduleId, ref.problemId), old = mistakes[key];
      mistakes[key] = { moduleId: ref.moduleId, group: ref.group, problemId: ref.problemId, firstAt: old?.firstAt ?? now, lastAt: now, dueAt: now, streak: 0, failures: (old?.failures ?? 0) + 1, reason: 'wrong' };
    }
    next = { ...next, mistakes };
  }
  if (action.area === 'exam' && action.action.type === 'score' && action.action.points < 2) {
    const a = action.action;
    const locate = (s: LearningProgress['study']): ExamSession | undefined => [s.exam.current, ...s.exam.history].find((e): e is ExamSession => e?.id === a.id);
    const current = locate(study), old = locate(state.study);
    if (current?.finishedAt && current.points[a.number] === a.points && old?.points[a.number] !== a.points) {
      const task = current.tasks[a.number - 1], oldStat = next.extended.stats[task.problemId];
      next = { ...next, extended: { ...next.extended, stats: { ...next.extended.stats, [task.problemId]: { attempts: oldStat?.attempts ?? 0, self: oldStat?.self ?? 0, help: oldStat?.help ?? 0, repeat: oldStat?.repeat ?? 0, streak: 0, dueAt: now, lastAt: now } } } };
    }
  }
  return next;
}
