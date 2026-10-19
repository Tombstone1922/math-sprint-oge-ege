import test from 'node:test';
import assert from 'node:assert/strict';
import { catalog, searchCatalog } from '../src/catalog.ts';
import { resumeItems, nextTopic } from '../src/today-model.ts';
import { initialProgress } from '../src/learning-progress.ts';
import { getGroupCount } from '../src/engine.ts';
import { applyStudy } from '../src/study/integration.ts';
import { applyExtended } from '../src/workbook/integration.ts';
import { startDaily } from '../src/daily-training.ts';
import { focusRoutes, hasFocusedRoute, mainTabs, selectedTab } from '../src/navigation-model.ts';

test('Catalogue finds exact exam numbers, word searches and all groups without losing base/EGE modules', () => {
  assert.equal(new Set(catalog.map(i => i.id)).size, catalog.length);
  assert.deepEqual(searchCatalog('№16').map(i => i.id), ['oge-16']);
  assert.deepEqual(searchCatalog('номер 24').map(i => i.id), ['extended-24']);
  assert.deepEqual(searchCatalog('ОГЭ 9').map(i => i.id), ['oge-9']);
  assert.equal(searchCatalog('№1–5').length, 8); assert.equal(searchCatalog('20-25').length, 6);
  assert.ok(searchCatalog('ЕГЭ').every(i => i.ege));
  assert.ok(searchCatalog('3').length === 8 && searchCatalog('3').every(i => i.numbers.includes(3)));
  assert.ok(searchCatalog('ДРОБИ').some(i => i.id === 'fractions'));
  assert.ok(searchCatalog('Уравнения').some(i => i.id === 'extended-20'));
  assert.ok(searchCatalog('касательные').some(i => i.id === 'oge-16'));
  assert.equal(searchCatalog('невозможный-запрос').length, 0);
  assert.equal(searchCatalog('24', 'first').length, 0);
  assert.ok(searchCatalog('', 'ege').length > 0 && searchCatalog('', 'ege').every(i => i.ege && i.section === 'skills'));
  for (const item of catalog) assert.equal(item.groups.length, item.moduleId ? getGroupCount(item.moduleId) : 10, item.id);
});
test('Today resumes saved work by activity and completed tasks never replace an unfinished one', () => {
  const now = 1792411200000;
  let state = applyStudy(initialProgress(), { area: 'exam', action: { type: 'start', timed: false } }, now);
  state = applyExtended(state, { type: 'start', number: 24, group: 1, random: () => 0 }, now + 1000);
  state = startDaily(state, now + 2000);
  const before = JSON.stringify(state);
  assert.equal(resumeItems(state)[0].daily, true); assert.equal(JSON.stringify(state), before);
  const active = state.extended.active!;
  state = applyExtended(state, { type: 'edit', session: active.id, index: 0, draft: 'Запись нового решения' }, now + 3000);
  assert.equal(resumeItems(state)[0].path, '/extended-practice');
  state = { ...state, daily: { ...state.daily, current: { ...state.daily.current!, finishedAt: now + 4000 } } };
  assert.equal(resumeItems(state).some(i => i.daily), false);
  assert.equal(resumeItems(state).length, 2);
  assert.deepEqual(resumeItems(initialProgress()), []);
});
test('The recommendation needs actual attempts, keeps the correct topic/group and excludes untried topics', () => {
  const state = initialProgress(); assert.equal(nextTopic(state), null);
  state.byModule.fractions = { attempts: 5, correct: 2, independent: 1, assisted: 0, hints: 0, completed: 0, best: 0, lastScore: 0, byGroup: { 2: { attempts: 5, correct: 2, independent: 1, assisted: 0, hints: 0, completed: 0, best: 0, lastScore: 0, seen: [] } } };
  const recommended = nextTopic(state)!; assert.equal(recommended.moduleId, 'fractions'); assert.equal(recommended.group, 2);
  assert.ok(recommended.groupTitle.includes('дробями'));
  state.byModule.fractions.byGroup[2].attempts = 2; assert.equal(nextTopic(state), null);
});
test('Five main destinations map related screens consistently while solving routes stay focused', () => {
  assert.equal(mainTabs.length, 5); assert.equal(selectedTab('/groups'), 'topics'); assert.equal(selectedTab('/reference'), 'topics');
  assert.equal(selectedTab('/workbook'), 'workbook'); assert.equal(selectedTab('/review'), 'progress'); assert.equal(selectedTab('/exam-hub'), 'variants');
  for (const name of ['practice', 'guided', 'exam', 'extended-practice', 'detective-practice']) assert.ok(focusRoutes.has(name));
  assert.equal(hasFocusedRoute({ routes: [{ name: '__root', state: { routes: [{ name: 'practice' }, { name: 'reference' }] } }] }), true);
  assert.equal(hasFocusedRoute({ routes: [{ name: '__root', state: { routes: [{ name: 'topics' }, { name: 'reference' }] } }] }), false);
});
