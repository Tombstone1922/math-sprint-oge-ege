import { extendedTask } from '../extended/bank.ts';
import { emptyWork, reduceExtended, type ExtendedAction, type Work } from '../extended/progress.ts';
import type { LearningProgress } from '../learning-progress.ts';
import { MAX_PHOTOS, errorKinds, makePage, pageId, parsePhoto, type Page, type WorkbookAction } from './model.ts';

function put(state: LearningProgress, page: Page): LearningProgress {
  return { ...state, workbook: { pages: { ...state.workbook.pages, [page.id]: page } } };
}
function snapshot(state: LearningProgress, session: string, taskId: string, work: Work, now: number): LearningProgress {
  const id = pageId('practice', session, taskId), old = state.workbook.pages[id];
  if (!old && !work.draft.trim() && !work.paper && !work.input.trim()) return state;
  const page = old ?? makePage('practice', session, taskId, now);
  const next = { ...page, draft: work.draft, input: work.input, paper: work.paper, compared: work.revealed, rating: work.rating };
  if (old && old.draft === next.draft && old.input === next.input && old.paper === next.paper && old.compared === next.compared && old.rating === next.rating) return state;
  return put(state, { ...next, updatedAt: now });
}
// Capture before finish/next too, including unfinished work migrated from older APKs.
export function applyExtended(state: LearningProgress, action: ExtendedAction, now = Date.now()): LearningProgress {
  const extended = reduceExtended(state.extended, action, now);
  if (extended === state.extended) return state;
  let next = { ...state, extended };
  const active = state.extended.active;
  if (active) for (const id of active.ids) {
    const work = extended.active?.id === active.id ? extended.active.work[id] : active.work[id];
    if (work) next = snapshot(next, active.id, id, work, now);
  }
  return next;
}
export function applyWorkbook(state: LearningProgress, action: WorkbookAction, now = Date.now()): LearningProgress {
  if (action.type === 'ensure') {
    const task = extendedTask(action.taskId);
    if (!task) return state;
    const id = pageId(action.source, action.session, task.id);
    if (state.workbook.pages[id]) return state;
    if (action.source === 'practice') {
      const active = state.extended.active;
      if (!active || active.id !== action.session || active.ids[active.position] !== task.id) return state;
      const work = active.work[task.id] ?? emptyWork();
      return put(state, { ...makePage('practice', active.id, task.id, now), draft: work.draft, input: work.input, paper: work.paper, compared: work.revealed, rating: work.rating });
    }
    const exam = [state.study.exam.current, ...state.study.exam.history].find(s => s?.id === action.session && s.finishedAt);
    if (!exam?.tasks.some(ref => ref.moduleId === 'extended' && ref.problemId === task.id)) return state;
    const work = exam.work[task.number];
    return put(state, { ...makePage('exam', exam.id, task.id, now), draft: work?.draft ?? '', input: '', paper: work?.paper ?? false, compared: true });
  }
  const before = state.workbook.pages[action.id];
  if (!before) return state;
  const task = extendedTask(before.taskId)!;
  let page = { ...before, updatedAt: now };
  if (action.type === 'edit') {
    if (action.mistake !== undefined) page.mistake = action.mistake.slice(0, 3000);
    if (action.teacherComment !== undefined) { page.teacherComment = action.teacherComment.slice(0, 3000); if (page.teacherComment !== before.teacherComment) page.reviewedAt = null; }
    if (action.step !== undefined && (action.step === null || Number.isInteger(action.step) && action.step >= 0 && action.step < task.steps.length)) page.step = action.step;
  } else if (action.type === 'kind') {
    if (!Number.isInteger(action.kind) || action.kind < 0 || action.kind >= errorKinds.length) return state;
    page.kinds = page.kinds.includes(action.kind) ? page.kinds.filter(k => k !== action.kind) : [...page.kinds, action.kind];
  } else if (action.type === 'photo') {
    const photo = parsePhoto(action.photo);
    if (!photo || page.photos.length >= MAX_PHOTOS || page.photos.some(p => p.id === photo.id)) return state;
    page.photos = [...page.photos, photo]; page.paper = true; page.reviewedAt = null;
    const active = state.extended.active;
    if (before.source === 'practice' && active?.id === before.session && active.ids[active.position] === task.id) {
      state = applyExtended(state, { type: 'edit', session: active.id, index: active.position, paper: true }, now);
    }
  } else if (action.type === 'remove-photo') {
    if (!page.photos.some(p => p.id === action.photoId)) return state;
    page.photos = page.photos.filter(p => p.id !== action.photoId); page.reviewedAt = null;
  } else if (action.type === 'review') {
    if (Boolean(page.reviewedAt) === action.reviewed) return state;
    page.reviewedAt = action.reviewed ? now : null;
  } else if (action.type === 'compare') {
    if (page.compared || (!page.draft.trim() && !page.paper && !page.photos.length)) return state;
    const active = state.extended.active;
    if (page.source === 'practice' && active?.id === page.session && active.ids[active.position] === task.id) {
      state = applyExtended(state, { type: 'reveal', session: active.id, index: active.position }, now);
      if (!state.extended.active?.work[task.id]?.revealed) return state;
    }
    page.compared = true;
  } else if (action.type === 'repeat') {
    const stat = state.extended.stats[task.id];
    if (stat?.dueAt != null) return state; // Do not reset an in-progress spaced review.
    state = { ...state, extended: { ...state.extended, stats: { ...state.extended.stats, [task.id]: { attempts: stat?.attempts ?? 0, self: stat?.self ?? 0, help: stat?.help ?? 0, repeat: stat?.repeat ?? 0, streak: 0, dueAt: now, lastAt: now } } } };
    page.repeatAt = now;
  }
  return put(state, page);
}
