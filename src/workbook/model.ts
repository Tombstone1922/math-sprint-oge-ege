import { extendedTask } from '../extended/bank.ts';
import type { Rating } from '../extended/progress.ts';

export const MAX_PHOTOS = 6;
export const MAX_PHOTO_BYTES = 4 * 1024 * 1024;
export const errorKinds = ['Вычисления', 'Знаки и преобразования', 'Условия и ограничения', 'Обоснование', 'Чертёж или график', 'Другое'] as const;
export type Photo = { id: string; filename: string; width: number; height: number; bytes: number };
export type Page = {
  id: string; taskId: string; session: string; source: 'practice' | 'exam'; createdAt: number; updatedAt: number;
  draft: string; input: string; paper: boolean; compared: boolean; rating?: Rating;
  photos: Photo[]; mistake: string; kinds: number[]; step: number | null;
  teacherComment: string; reviewedAt: number | null; repeatAt: number | null;
};
export type Workbook = { pages: Record<string, Page> };
export type WorkbookAction =
  { type: 'ensure'; source: Page['source']; session: string; taskId: string } |
  { type: 'edit'; id: string; mistake?: string; teacherComment?: string; step?: number | null } |
  { type: 'kind'; id: string; kind: number } |
  { type: 'photo'; id: string; photo: Photo } |
  { type: 'remove-photo'; id: string; photoId: string } |
  { type: 'review'; id: string; reviewed: boolean } |
  { type: 'compare' | 'repeat'; id: string };
export const emptyWorkbook = (): Workbook => ({ pages: {} });
export const pageId = (source: Page['source'], session: string, taskId: string) => `${source}:${session}:${taskId}`;
export const validFilename = (name: unknown): name is string => typeof name === 'string' && /^photo-[a-z0-9-]{8,100}\.jpg$/.test(name);
const object = (v: unknown): Record<string, unknown> => v && typeof v === 'object' && !Array.isArray(v) ? v as Record<string, unknown> : {};
const text = (v: unknown, max: number) => typeof v === 'string' ? v.slice(0, max) : '';
const time = (v: unknown) => typeof v === 'number' && Number.isSafeInteger(v) && v >= 0 ? v : 0;
export function parsePhoto(value: unknown): Photo | null {
  const p = object(value);
  if (!validFilename(p.filename) || p.id !== p.filename || ![p.width, p.height, p.bytes].every(n => typeof n === 'number' && Number.isSafeInteger(n) && n > 0) || (p.width as number) > 10000 || (p.height as number) > 10000 || (p.bytes as number) > MAX_PHOTO_BYTES) return null;
  return { id: p.filename, filename: p.filename, width: p.width as number, height: p.height as number, bytes: p.bytes as number };
}
export function makePage(source: Page['source'], session: string, taskId: string, now: number): Page {
  return { id: pageId(source, session, taskId), source, session, taskId, createdAt: now, updatedAt: now, draft: '', input: '', paper: false, compared: false, rating: undefined, photos: [], mistake: '', kinds: [], step: null, teacherComment: '', reviewedAt: null, repeatAt: null };
}
export function parsePage(value: unknown): Page | null {
  const p = object(value), task = typeof p.taskId === 'string' ? extendedTask(p.taskId) : undefined;
  if (!task || !['practice', 'exam'].includes(p.source as string) || typeof p.session !== 'string' || !p.session || p.session.length > 100 || p.id !== pageId(p.source as Page['source'], p.session, task.id)) return null;
  const seen = new Set<string>(), photos: Photo[] = [];
  for (const value of Array.isArray(p.photos) ? p.photos : []) {
    const photo = parsePhoto(value);
    if (photo && !seen.has(photo.id) && photos.length < MAX_PHOTOS) { seen.add(photo.id); photos.push(photo); }
  }
  const step = typeof p.step === 'number' && Number.isInteger(p.step) && p.step >= 0 && p.step < task.steps.length ? p.step : null;
  return { ...makePage(p.source as Page['source'], p.session, task.id, time(p.createdAt)), updatedAt: Math.max(time(p.createdAt), time(p.updatedAt)), draft: text(p.draft, 6000), input: text(p.input, 160), paper: p.paper === true, compared: p.compared === true, rating: ['self', 'help', 'repeat'].includes(p.rating as string) ? p.rating as Rating : undefined, photos, mistake: text(p.mistake, 3000), kinds: [...new Set(Array.isArray(p.kinds) ? p.kinds.filter((n): n is number => typeof n === 'number' && Number.isInteger(n) && n >= 0 && n < errorKinds.length) : [])], step, teacherComment: text(p.teacherComment, 3000), reviewedAt: p.reviewedAt === null ? null : time(p.reviewedAt) || null, repeatAt: p.repeatAt === null ? null : time(p.repeatAt) || null };
}
export function parseWorkbook(value: unknown): Workbook {
  const pages: Record<string, Page> = {};
  for (const [id, raw] of Object.entries(object(object(value).pages))) { const page = parsePage(raw); if (page && page.id === id) pages[id] = page; }
  return { pages };
}
export const sortedPages = (workbook: Workbook) => Object.values(workbook.pages).sort((a, b) => b.updatedAt - a.updatedAt || a.id.localeCompare(b.id));
