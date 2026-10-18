import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

// One Node process; persist reservations BEFORE calling the paid provider.
export function createLimits({ file, perDay = 30, globalPerDay = 200, perMinute = 6, now = Date.now }) {
  let state = file && existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : { day: '', total: 0, tokens: {} };
  return token => {
    const at = now(), day = new Date(at).toISOString().slice(0, 10);
    if (state.day !== day) state = { day, total: 0, tokens: {} };
    const before = state.tokens[token] ?? { total: 0, recent: [] }, recent = before.recent.filter(t => t > at - 60000);
    if (before.total >= perDay || state.total >= globalPerDay || recent.length >= perMinute) return false;
    state = { ...state, total: state.total + 1, tokens: { ...state.tokens, [token]: { total: before.total + 1, recent: [...recent, at] } } };
    if (file) {
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(`${file}.tmp`, JSON.stringify(state), { mode: 0o600 });
      renameSync(`${file}.tmp`, file);
    }
    return true;
  };
}
