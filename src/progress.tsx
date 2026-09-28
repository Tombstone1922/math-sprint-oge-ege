import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ModuleId } from './content';

type ModuleProgress = { best: number; completed: number; lastScore: number };
type Progress = ModuleProgress & { byModule: Partial<Record<ModuleId, ModuleProgress>> };
type ProgressContextValue = { progress: Progress; record: (score: number, moduleId: ModuleId) => void; ready: boolean };
const initial: Progress = { best: 0, completed: 0, lastScore: 0, byModule: {} };
const key = 'math-sprint/progress/v1';
const ProgressContext = createContext<ProgressContextValue>({ progress: initial, record: () => {}, ready: false });

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState<Progress>(initial);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let active = true;
    AsyncStorage.getItem(key).then(value => {
      if (!active || !value) return;
      const parsed = JSON.parse(value) as Progress;
      if (Number.isInteger(parsed.best) && Number.isInteger(parsed.completed) && Number.isInteger(parsed.lastScore)) {
        const legacy = { best: parsed.best, completed: parsed.completed, lastScore: parsed.lastScore };
        setProgress({ ...parsed, byModule: parsed.byModule ?? (parsed.completed ? { 'mental-math': legacy } : {}) });
      }
    }).catch(() => {}).finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, []);
  const record = (score: number, moduleId: ModuleId) => setProgress(previous => {
    const before = previous.byModule[moduleId] ?? { best: 0, completed: 0, lastScore: 0 };
    const next: Progress = {
      best: Math.max(previous.best, score), completed: previous.completed + 1, lastScore: score,
      byModule: {
        ...previous.byModule,
        [moduleId]: { best: Math.max(before.best, score), completed: before.completed + 1, lastScore: score },
      },
    };
    AsyncStorage.setItem(key, JSON.stringify(next)).catch(() => {});
    return next;
  });
  return <ProgressContext.Provider value={{ progress, record, ready }}>{children}</ProgressContext.Provider>;
}

export const useProgress = () => useContext(ProgressContext);
