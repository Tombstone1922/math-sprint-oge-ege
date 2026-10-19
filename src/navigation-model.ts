export const mainTabs = [
  { id: 'today', title: 'Сегодня', path: '/' },
  { id: 'topics', title: 'Темы', path: '/topics' },
  { id: 'variants', title: 'Варианты', path: '/exam-hub' },
  { id: 'workbook', title: 'Тетрадь', path: '/workbook' },
  { id: 'progress', title: 'Прогресс', path: '/progress' },
] as const;
export type MainTab = (typeof mainTabs)[number]['id'];
export const focusRoutes = new Set(['practice', 'guided', 'exam', 'extended-practice', 'detective-practice']);
export function hasFocusedRoute(state: unknown, depth = 0): boolean {
  if (!state || typeof state !== 'object' || depth > 10) return false;
  const routes = (state as { routes?: unknown }).routes;
  return Array.isArray(routes) && routes.some(route => route && typeof route === 'object' && (focusRoutes.has(route.name) || hasFocusedRoute(route.state, depth + 1)));
}
export function selectedTab(path: string): MainTab {
  if (path === '/exam-hub' || path === '/exam') return 'variants';
  if (path === '/workbook') return 'workbook';
  if (path === '/progress' || path === '/review') return 'progress';
  return path === '/' || path === '/daily' ? 'today' : 'topics';
}
