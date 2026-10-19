import { initialProgress, parseProgress, type LearningProgress } from './learning-progress.ts';
import { parsePage, type Page } from './workbook/model.ts';
export const PROGRESS_KEY = 'math-sprint/progress/v2';
export const LEGACY_PROGRESS_KEY = 'math-sprint/progress/v1';
export const WORKBOOK_PREFIX = 'math-sprint/workbook/v1/';
export type LearningStorage = { getItem: (key: string) => Promise<string | null>; setItem: (key: string, value: string) => Promise<unknown>; removeItem?: (key: string) => Promise<unknown> };
type PageRef = { id: string; key: string };
function pageRefs(raw: { workbookRefs?: unknown }): PageRef[] {
  if (raw.workbookRefs === undefined) return [];
  if (!Array.isArray(raw.workbookRefs)) throw new Error('Invalid workbook index');
  const ids = new Set<string>();
  return raw.workbookRefs.map(ref => {
    if (!ref || typeof ref.id !== 'string' || typeof ref.key !== 'string' || !ref.key.startsWith(`${WORKBOOK_PREFIX}${encodeURIComponent(ref.id)}/`) || ids.has(ref.id)) throw new Error('Invalid workbook reference');
    ids.add(ref.id); return { id: ref.id, key: ref.key };
  });
}
export async function loadProgress(storage: LearningStorage): Promise<LearningProgress> {
  const current = await storage.getItem(PROGRESS_KEY);
  if (current !== null) {
    const raw = JSON.parse(current), refs = pageRefs(raw), pages: Record<string, Page> = {};
    // Keep individual Android AsyncStorage rows small, even with many long solutions.
    for (let start = 0; start < refs.length; start += 8) await Promise.all(refs.slice(start, start + 8).map(async ref => {
      const value = await storage.getItem(ref.key), page = value === null ? null : parsePage(JSON.parse(value));
      if (!page || page.id !== ref.id) throw new Error('Workbook page could not be loaded');
      pages[page.id] = page;
    }));
    return parseProgress(refs.length || raw.workbookRefs !== undefined ? { ...raw, workbook: { pages } } : raw);
  }
  const legacy = await storage.getItem(LEGACY_PROGRESS_KEY);
  return legacy === null ? initialProgress() : parseProgress(JSON.parse(legacy));
}
// Serialize snapshots so a slow older write cannot overwrite newer answers.
export function createProgressWriter(storage: LearningStorage) {
  let queue: Promise<unknown> = Promise.resolve();
  const token = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  let serial = 0, previous = new Map<string, { key: string; content?: string }>(), initialized = false;
  const garbage = new Set<string>();
  const serialized = new WeakMap<Page, string>();
  return (state: LearningProgress): Promise<void> => {
    // Freeze before queueing: callers may hold or change their own snapshot later.
    const { workbook, ...rest } = state, root = JSON.stringify(rest);
    const pages = Object.values(workbook.pages).map(page => {
      let content = serialized.get(page);
      if (content === undefined) { content = JSON.stringify(page); serialized.set(page, content); }
      return { id: page.id, content };
    });
    const write = queue.catch(() => {}).then(async () => {
      if (!initialized) {
        const old = await storage.getItem(PROGRESS_KEY);
        if (old !== null) previous = new Map(pageRefs(JSON.parse(old)).map(r => [r.id, { key: r.key }]));
        initialized = true;
      }
      const next = new Map<string, { key: string; content: string }>();
      for (const page of pages) {
        const old = previous.get(page.id);
        if (old?.content === page.content) { next.set(page.id, { key: old.key, content: page.content }); continue; }
        const key = `${WORKBOOK_PREFIX}${encodeURIComponent(page.id)}/${token}-${++serial}`;
        garbage.add(key); // A failed snapshot can be cleaned up after a later successful save.
        await storage.setItem(key, page.content);
        next.set(page.id, { key, content: page.content });
      }
      const refs = [...next].map(([id, p]) => ({ id, key: p.key }));
      // Publish the index last. A failed write never changes pages in the previous snapshot.
      await storage.setItem(PROGRESS_KEY, pages.length ? JSON.stringify({ ...JSON.parse(root), workbookRefs: refs }) : root);
      for (const old of previous.values()) garbage.add(old.key);
      for (const page of next.values()) garbage.delete(page.key);
      previous = next;
      if (storage.removeItem) for (const key of [...garbage]) {
        try { await storage.removeItem(key); garbage.delete(key); } catch { /* Cleanup must not report a successful save as failed. */ }
      }
    });
    queue = write;
    return write;
  };
}
