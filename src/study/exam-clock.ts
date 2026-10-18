import { useEffect, useRef, useState } from 'react';
import { AppState } from 'react-native';
import type { ExamSession } from './exam';
export function useExamNow(session: ExamSession | null | undefined, expire: (id: string) => void) {
  const [now, setNow] = useState(Date.now), callback = useRef(expire);
  useEffect(() => { callback.current = expire; }, [expire]);
  const id = session?.id, deadline = session?.deadline, finished = Boolean(session?.finishedAt);
  useEffect(() => {
    const update = () => { const at = Date.now(); setNow(at); if (id && !finished && deadline !== null && deadline !== undefined && at >= deadline) callback.current(id); };
    update(); if (!id || finished) return;
    const timer = setInterval(update, 1000), listener = AppState.addEventListener('change', update);
    return () => { clearInterval(timer); listener.remove(); };
  }, [id, deadline, finished]);
  return now;
}
export function examClock(ms: number) { const seconds = Math.ceil(Math.max(0, ms) / 1000); return `${Math.floor(seconds / 3600)}:${String(Math.floor(seconds / 60) % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`; }
