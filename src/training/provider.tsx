import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { trainingStorage } from './storage';
export function createTrainingContext<State, Action>(spec: { key: string; empty: () => State; parse: (value: unknown) => State; reduce: (state: State, action: Action) => State }) {
 type Value = { state: State; ready: boolean; loadError: boolean; saveError: boolean; dispatch: (action: Action) => void; retryLoad: () => void; retrySave: () => void };
 const Context = createContext<Value>({ state: spec.empty(), ready: false, loadError: false, saveError: false, dispatch: () => {}, retryLoad: () => {}, retrySave: () => {} });
 const storage = trainingStorage(spec.key, spec.empty, spec.parse);
 function Provider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState(spec.empty), current = useRef(state), loaded = useRef(false), mounted = useRef(true), writer = useRef(storage.writer(AsyncStorage)), revision = useRef(0);
  const [ready, setReady] = useState(false), [loadError, setLoadError] = useState(false), [saveError, setSaveError] = useState(false), [retry, setRetry] = useState(0);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => { let active = true; loaded.current = false; storage.load(AsyncStorage).then(next => { if (!active) return; current.current = next; loaded.current = true; setState(next); setReady(true); setLoadError(false); }).catch(() => { if (active) setLoadError(true); }); return () => { active = false; }; }, [retry]);
  function save(next: State) { const v = ++revision.current; void writer.current(next).then(() => { if (mounted.current && v === revision.current) setSaveError(false); }).catch(() => { if (mounted.current) setSaveError(true); }); }
  return <Context.Provider value={{ state, ready, loadError, saveError, retryLoad: () => { setLoadError(false); setRetry(n => n + 1); }, retrySave: () => save(current.current), dispatch: action => { if (!loaded.current) return; const next = spec.reduce(current.current, action); if (next === current.current) return; current.current = next; setState(next); save(next); } }}>{children}</Context.Provider>;
 }
 return { Provider, useTraining: () => useContext(Context) };
}
