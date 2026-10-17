import { initialProgress, parseProgress, type LearningProgress } from './learning-progress.ts';
export const PROGRESS_KEY = 'math-sprint/progress/v2';
export const LEGACY_PROGRESS_KEY = 'math-sprint/progress/v1';
export type LearningStorage = { getItem: (key: string) => Promise<string | null>; setItem: (key: string, value: string) => Promise<unknown> };
export async function loadProgress(storage: LearningStorage): Promise<LearningProgress> {
  const current = await storage.getItem(PROGRESS_KEY);
  if (current !== null) return parseProgress(JSON.parse(current));
  const legacy = await storage.getItem(LEGACY_PROGRESS_KEY);
  return legacy === null ? initialProgress() : parseProgress(JSON.parse(legacy));
}
// Serialize snapshots so a slow older write cannot overwrite newer answers.
export function createProgressWriter(storage: LearningStorage) {
  let queue: Promise<unknown> = Promise.resolve();
  return (state: LearningProgress): Promise<void> => {
    const snapshot = JSON.stringify(state);
    const write = queue.catch(() => {}).then(() => storage.setItem(PROGRESS_KEY, snapshot)).then(() => {});
    queue = write;
    return write;
  };
}
