import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import { finishSession, initialProgress, recordAttempt, recordHint, type Attempt, type LearningProgress } from './learning-progress';
import { createProgressWriter, loadProgress } from './learning-storage';
import { startDaily, answerDaily, hintDaily, timeDaily, finishDaily } from './daily-training';
import { applyStudy } from './study/integration';
import type { StudyAction } from './study/state';
import type { ExtendedAction } from './extended/progress';
import { applyExtended, applyWorkbook } from './workbook/integration';
import type { WorkbookAction } from './workbook/model';
import { colors } from './theme';

type ProgressContextValue = {
  progress: LearningProgress;
  ready: boolean;
  study: (action: StudyAction) => void;
  extended: (action: ExtendedAction) => void;
  workbook: (action: WorkbookAction) => Promise<boolean>;
  answer: (attempt: Attempt) => void;
  hint: (attempt: Pick<Attempt, 'sessionId' | 'moduleId' | 'group' | 'problemId' | 'at'>) => void;
  dailyStart: () => void;
  dailyAnswer: (id: string, index: number, input: string) => void;
  dailyHint: (id: string, index: number, level: number) => void;
  dailyTime: (id: string, elapsedMs: number) => void;
  dailyFinish: (id: string, elapsedMs: number) => void;
  complete: (session: Parameters<typeof finishSession>[1]) => void;
};
const ProgressContext = createContext<ProgressContextValue>({ progress: initialProgress(), ready: false, study: () => {}, extended: () => {}, workbook: async () => false, answer: () => {}, hint: () => {}, complete: () => {}, dailyStart: () => {}, dailyAnswer: () => {}, dailyHint: () => {}, dailyTime: () => {}, dailyFinish: () => {} });

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const [progress, setProgress] = useState(initialProgress);
  const current = useRef(progress);
  const loaded = useRef(false);
  const writer = useRef(createProgressWriter(AsyncStorage));
  const mounted = useRef(true);
  const [ready, setReady] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [saveError, setSaveError] = useState(false);
  const [retry, setRetry] = useState(0);
  const saveRevision = useRef(0);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    let active = true;
    loaded.current = false;
    loadProgress(AsyncStorage).then(next => {
      if (!active) return;
      current.current = next;
      loaded.current = true;
      setProgress(next);
      setReady(true);
    }).catch(() => { if (active) setLoadError(true); });
    return () => { active = false; };
  }, [retry]);
  function persist(next: LearningProgress) {
    const revision = ++saveRevision.current;
    return writer.current(next).then(() => {
      if (mounted.current && revision === saveRevision.current) setSaveError(false);
      return true;
    }).catch(() => { if (mounted.current) setSaveError(true); return false; });
  }
  function apply(reduce: (state: LearningProgress) => LearningProgress) {
    if (!loaded.current) return Promise.resolve(false);
    const next = reduce(current.current);
    if (next === current.current) return Promise.resolve(false);
    current.current = next;
    setProgress(next);
    return persist(next);
  }
  if (!ready) return <View style={{ flex: 1, padding: 28, justifyContent: 'center', backgroundColor: colors.background }}>
    {!loadError && <ActivityIndicator color={colors.blue} size="large" />}
    <Text style={{ color: colors.ink, textAlign: 'center', marginTop: 18, fontSize: 16 }}>{loadError ? 'Не удалось загрузить сохранённый прогресс. Повторим загрузку, чтобы сохранить твои результаты.' : 'Загружаем твой прогресс…'}</Text>
    {loadError && <Pressable accessibilityRole="button" onPress={() => { setLoadError(false); setRetry(value => value + 1); }} style={{ padding: 18, marginTop: 16, backgroundColor: colors.blue, borderRadius: 16 }}><Text style={{ color: colors.white, textAlign: 'center', fontWeight: '700' }}>Повторить загрузку</Text></Pressable>}
  </View>;
  return <ProgressContext.Provider value={{ progress, ready, workbook: action => apply(state => applyWorkbook(state, action)), study: action => apply(state => applyStudy(state, action)), extended: action => apply(state => applyExtended(state, action)), dailyStart: () => apply(state => startDaily(state)), dailyAnswer: (id, index, input) => apply(state => answerDaily(state, id, index, input)), dailyHint: (id, index, level) => apply(state => hintDaily(state, id, index, level)), dailyTime: (id, elapsedMs) => apply(state => timeDaily(state, id, elapsedMs)), dailyFinish: (id, elapsedMs) => apply(state => finishDaily(state, id, elapsedMs)), answer: attempt => apply(state => recordAttempt(state, attempt)), hint: attempt => apply(state => recordHint(state, attempt)), complete: session => apply(state => finishSession(state, session)) }}>
    <View style={{ flex: 1 }}>{children}
      {saveError && <View accessibilityLiveRegion="polite" style={{ padding: 16, backgroundColor: colors.amber }}><Text style={{ color: colors.ink, fontSize: 13 }}>Пока не удалось сохранить прогресс на устройстве. Перед закрытием приложения повтори сохранение.</Text><Pressable accessibilityRole="button" onPress={() => persist(current.current)} style={{ paddingVertical: 12 }}><Text style={{ color: colors.navy, fontWeight: '800' }}>Сохранить ещё раз</Text></Pressable></View>}
    </View>
  </ProgressContext.Provider>;
}
export const useProgress = () => useContext(ProgressContext);
