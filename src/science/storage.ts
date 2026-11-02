import { emptyScience, parseScience, type ScienceState } from './state.ts';
export const SCIENCE_KEY = 'math-sprint/science/v1';
export type ScienceStorage = { getItem(key: string): Promise<string | null>; setItem(key: string, value: string): Promise<unknown> };
export async function loadScience(storage: ScienceStorage): Promise<ScienceState> {
  const value = await storage.getItem(SCIENCE_KEY); return value === null ? emptyScience() : parseScience(JSON.parse(value));
}
export function createScienceWriter(storage: ScienceStorage) {
  let queue: Promise<unknown> = Promise.resolve();
  return (state: ScienceState): Promise<void> => {
    const snapshot = JSON.stringify(state);
    const write = queue.catch(() => {}).then(async () => { await storage.setItem(SCIENCE_KEY, snapshot); });
    queue = write; return write;
  };
}
