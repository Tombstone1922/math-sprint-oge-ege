import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { emptyScience, reduceScience, type ScienceAction, type ScienceState } from './state';
import { createScienceWriter, loadScience } from './storage';
type Value = { state: ScienceState; ready: boolean; loadError: boolean; saveError: boolean; dispatch: (action: ScienceAction) => void; retryLoad: () => void; retrySave: () => void };
const Context = createContext<Value>({ state: emptyScience(), ready: false, loadError: false, saveError: false, dispatch: () => {}, retryLoad: () => {}, retrySave: () => {} });
export function ScienceProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState(emptyScience), current = useRef(state), loaded = useRef(false), mounted = useRef(true);
  const writer = useRef(createScienceWriter(AsyncStorage)), revision = useRef(0);
  const [ready, setReady] = useState(false), [loadError, setLoadError] = useState(false), [saveError, setSaveError] = useState(false), [retry, setRetry] = useState(0);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    let active = true; loaded.current = false;
    loadScience(AsyncStorage).then(next => { if (!active) return; current.current = next; loaded.current = true; setState(next); setReady(true); setLoadError(false); }).catch(() => { if (active) setLoadError(true); });
    return () => { active = false; };
  }, [retry]);
  function save(next: ScienceState) {
    const v = ++revision.current;
    void writer.current(next).then(() => { if (mounted.current && v === revision.current) setSaveError(false); }).catch(() => { if (mounted.current) setSaveError(true); });
  }
  return <Context.Provider value={{ state, ready, loadError, saveError, retryLoad: () => { setLoadError(false); setRetry(n => n + 1); }, retrySave: () => save(current.current), dispatch: action => {
    if (!loaded.current) return;
    const next = reduceScience(current.current, action); if (next === current.current) return;
    current.current = next; setState(next); save(next);
  } }}>{children}</Context.Provider>;
}
export const useScience = () => useContext(Context);
