import { useCallback, useEffect, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { AppState } from 'react-native';

// Time spent in another app, on the summary or in an explanation is a pause.
export function useDailyClock(id: string | undefined, initial: number, save: (id: string, elapsed: number) => void) {
  const elapsed = useRef(initial), previous = useRef(0), active = useRef(false);
  const saveRef = useRef(save);
  useEffect(() => { saveRef.current = save; }, [save]);
  const [shown, setShown] = useState(initial);
  const read = useCallback(() => {
    const now = Date.now();
    if (id && active.current) elapsed.current += Math.max(0, now - previous.current);
    previous.current = now;
    return Math.floor(elapsed.current);
  }, [id]);
  useFocusEffect(useCallback(() => {
    if (!id) return;
    active.current = AppState.currentState === 'active'; previous.current = Date.now();
    let ticks = 0;
    const timer = setInterval(() => { const value = read(); setShown(value); if (++ticks % 15 === 0) saveRef.current(id, value); }, 1000);
    const listener = AppState.addEventListener('change', next => {
      const value = read();
      active.current = next === 'active';
      previous.current = Date.now();
      setShown(value); saveRef.current(id, value);
    });
    return () => { clearInterval(timer); listener.remove(); saveRef.current(id, read()); active.current = false; };
  }, [id, read]));
  return { elapsed: shown, read };
}
export function clockText(elapsed: number) { const seconds = Math.floor(elapsed / 1000); return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`; }
