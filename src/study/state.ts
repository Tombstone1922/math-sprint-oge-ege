import { emptyExam, parseExam, reduceExam, type ExamAction, type ExamState } from './exam.ts';
import { emptyDetective, parseDetective, reduceDetective, type DetectiveAction, type DetectiveState } from './detective.ts';
import { formulaEntry } from './reference.ts';
export type StudyState = { exam: ExamState; detective: DetectiveState; favorites: string[] };
export type StudyAction = { area: 'exam'; action: ExamAction } | { area: 'detective'; action: DetectiveAction } | { area: 'book'; id: string };
export const emptyStudy = (): StudyState => ({ exam: emptyExam(), detective: emptyDetective(), favorites: [] });
export function reduceStudy(state: StudyState, action: StudyAction, now = Date.now()): StudyState {
  if (action.area === 'book') return formulaEntry(action.id) ? { ...state, favorites: state.favorites.includes(action.id) ? state.favorites.filter(id => id !== action.id) : [...state.favorites, action.id] } : state;
  if (action.area === 'exam') { const exam = reduceExam(state.exam, action.action, now); return exam === state.exam ? state : { ...state, exam }; }
  const detective = reduceDetective(state.detective, action.action, now); return detective === state.detective ? state : { ...state, detective };
}
export function parseStudy(value: unknown): StudyState {
  const raw = value && typeof value === 'object' ? value as StudyState : emptyStudy();
  return { exam: parseExam(raw.exam), detective: parseDetective(raw.detective), favorites: Array.isArray(raw.favorites) ? [...new Set(raw.favorites.filter(id => typeof id === 'string' && formulaEntry(id)))].slice(0, 100) : [] };
}
