import { useEffect, useState } from 'react';
import { AppState } from 'react-native';
import { weeklyPeriod } from './weekly';
export function useWeeklyNow() {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const update = () => {
      clearTimeout(timer); const at = Date.now(); setNow(at);
      timer = setTimeout(update, Math.max(1, Math.min(30000, weeklyPeriod(at).end - at)));
    };
    update(); const listener = AppState.addEventListener('change', update);
    return () => { clearTimeout(timer); listener.remove(); };
  }, []);
  return now;
}
