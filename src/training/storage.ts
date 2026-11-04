export type TrainingStorage = { getItem(key: string): Promise<string | null>; setItem(key: string, value: string): Promise<unknown> };
export function trainingStorage<State>(key: string, empty: () => State, parse: (value: unknown) => State) {
 return {
  load: async (storage: TrainingStorage): Promise<State> => { const value = await storage.getItem(key); return value === null ? empty() : parse(JSON.parse(value)); },
  writer: (storage: TrainingStorage) => { let queue: Promise<unknown> = Promise.resolve(); return (state: State): Promise<void> => { const snapshot = JSON.stringify(state); const write = queue.catch(() => {}).then(async () => { await storage.setItem(key, snapshot); }); queue = write; return write; }; },
 };
}
