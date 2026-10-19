import test from 'node:test';
import assert from 'node:assert/strict';
import { initialProgress, parseProgress, type LearningProgress } from '../src/learning-progress.ts';
import { createProgressWriter, loadProgress, PROGRESS_KEY, WORKBOOK_PREFIX } from '../src/learning-storage.ts';
import { extendedTask } from '../src/extended/bank.ts';
import { reduceExtended } from '../src/extended/progress.ts';
import { applyExtended, applyWorkbook } from '../src/workbook/integration.ts';
import { MAX_PHOTOS, emptyWorkbook, pageId, parsePage, parsePhoto, type Photo } from '../src/workbook/model.ts';
import { applyStudy } from '../src/study/integration.ts';

const photo = (n = 1): Photo => ({ id: `photo-test-0000000${n}.jpg`, filename: `photo-test-0000000${n}.jpg`, width: 1800, height: 2400, bytes: 240000 });
function started() { return applyExtended(initialProgress(), { type: 'start', number: 24, group: 1, random: () => 0 }, 1000); }
function command(state: LearningProgress, action: 'edit' | 'reveal' | 'finish' | 'next', draft = 'Дано: треугольник.\nДокажем равенство углов.', at = 2000) {
  const active = state.extended.active!;
  return applyExtended(state, action === 'edit' ? { type: action, session: active.id, index: active.position, draft } : action === 'finish' ? { type: action, session: active.id } : { type: action, session: active.id, index: active.position }, at);
}
const currentPageId = (state: LearningProgress) => pageId('practice', state.extended.active!.id, state.extended.active!.ids[state.extended.active!.position]);
function memory() {
  const data = new Map<string, string>();
  return { data, getItem: async (k: string) => data.get(k) ?? null, setItem: async (k: string, v: string) => { data.set(k, v); }, removeItem: async (k: string) => { data.delete(k); } };
}
test('Workbook archives text immediately, survives early finish and preserves different attempts of the same task', () => {
  let state = started(); const a = state.extended.active!, taskId = a.ids[0], id = currentPageId(state);
  assert.equal(Object.keys(state.workbook.pages).length, 0);
  state = command(state, 'edit'); const draft = state.workbook.pages[id].draft;
  state = command(state, 'finish');
  assert.equal(state.workbook.pages[id].draft, draft); assert.equal(state.extended.active, null);
  state = applyExtended(state, { type: 'start-task', taskId }, 3000); state = command(state, 'edit', 'Вторая самостоятельная попытка.', 4000);
  assert.equal(Object.keys(state.workbook.pages).length, 2); assert.equal(state.workbook.pages[id].draft, draft);
  assert.notEqual(currentPageId(state), id); assert.equal(state.attempts, 0); assert.deepEqual(state.extended.stats, {});
});
test('Workbook captures pre-upgrade unfinished drafts when finishing and ignores stale actions', () => {
  let state = started(), a = state.extended.active!;
  state = { ...state, extended: reduceExtended(state.extended, { type: 'edit', session: a.id, index: 0, draft: 'Старый черновик' }, 2000) };
  const id = currentPageId(state);
  assert.equal(Object.keys(state.workbook.pages).length, 0);
  assert.equal(applyExtended(state, { type: 'edit', session: 'stale', index: 0, draft: 'Удалить' }), state);
  state = command(state, 'finish'); assert.equal(state.workbook.pages[id].draft, 'Старый черновик');
});
test('Photo-only work permits comparison; a notebook cannot reveal a blank solution or bypass the draft lock', () => {
  let state = started(), a = state.extended.active!, id = currentPageId(state);
  state = applyWorkbook(state, { type: 'ensure', source: 'practice', session: a.id, taskId: a.ids[0] }, 2000);
  assert.equal(applyWorkbook(state, { type: 'compare', id }), state);
  state = applyWorkbook(state, { type: 'photo', id, photo: photo() }, 3000);
  assert.equal(state.extended.active!.work[a.ids[0]].paper, true); assert.equal(state.workbook.pages[id].photos.length, 1);
  state = applyWorkbook(state, { type: 'compare', id }, 4000);
  assert.equal(state.extended.active!.work[a.ids[0]].revealed, true); assert.equal(state.workbook.pages[id].compared, true);
  assert.equal(command(state, 'edit', 'Переписать по образцу'), state);
  assert.equal(state.extended.stats[a.ids[0]], undefined); assert.equal(state.attempts, 0);
});
test('Workbook notes, selected error, teacher comment and explicit review survive serialization without invented scores', () => {
  let state = command(started(), 'edit'), id = currentPageId(state);
  state = applyWorkbook(state, { type: 'edit', id, mistake: 'Не обосновал подобие.', teacherComment: 'Укажи два равных угла.', step: 1 }, 3000);
  state = applyWorkbook(state, { type: 'kind', id, kind: 3 }, 3001);
  state = applyWorkbook(state, { type: 'review', id, reviewed: true }, 4000);
  const restored = parseProgress(JSON.parse(JSON.stringify(state))), page = restored.workbook.pages[id];
  assert.equal(page.reviewedAt, 4000); assert.equal(page.teacherComment, 'Укажи два равных угла.'); assert.equal(page.step, 1); assert.deepEqual(page.kinds, [3]);
  assert.equal(restored.correct, 0); assert.deepEqual(restored.extended.stats, {});
  assert.equal(applyWorkbook(restored, { type: 'edit', id, teacherComment: 'Добавь основание равенства.' }, 5000).workbook.pages[id].reviewedAt, null);
  assert.equal(applyWorkbook(restored, { type: 'photo', id, photo: photo() }, 5000).workbook.pages[id].reviewedAt, null);
  assert.equal(applyWorkbook(restored, { type: 'kind', id, kind: 100 }), restored);
});
test('Photos are bounded, relative and unique; removal never removes another page or source picture', () => {
  let state = command(started(), 'edit'), id = currentPageId(state);
  for (let n = 1; n <= MAX_PHOTOS; n++) state = applyWorkbook(state, { type: 'photo', id, photo: photo(n) }, 3000 + n);
  assert.equal(applyWorkbook(state, { type: 'photo', id, photo: photo(1) }), state);
  assert.equal(applyWorkbook(state, { type: 'photo', id, photo: photo(7) }), state);
  state = applyWorkbook(state, { type: 'remove-photo', id, photoId: photo(3).id }, 4000);
  assert.deepEqual(state.workbook.pages[id].photos.map(p => p.id), [1, 2, 4, 5, 6].map(n => photo(n).id));
  assert.equal(parsePhoto({ ...photo(), filename: '../outside.jpg' }), null);
  assert.equal(parsePhoto({ ...photo(), filename: 'https://host/photo-000000000.jpg' }), null);
  assert.equal(parsePhoto({ ...photo(), bytes: 5 * 1024 * 1024 }), null);
  assert.equal(parsePhoto({ ...photo(), width: Infinity }), null);
});
test('A notebook repeat queues the exact task once, preserves spacing and creates a new empty repeat attempt', () => {
  let state = command(started(), 'edit'), id = currentPageId(state), taskId = state.workbook.pages[id].taskId;
  state = applyWorkbook(state, { type: 'repeat', id }, 3000);
  assert.equal(state.extended.stats[taskId].attempts, 0); assert.equal(state.extended.stats[taskId].dueAt, 3000);
  assert.equal(applyWorkbook(state, { type: 'repeat', id }, 4000), state);
  assert.equal(applyExtended(state, { type: 'start-task', taskId, review: true }, 4000), state);
  state = command(state, 'finish'); state = applyExtended(state, { type: 'start-task', taskId, review: true }, 4000);
  assert.deepEqual(state.extended.active!.ids, [taskId]); assert.deepEqual(state.extended.active!.work, {});
  const a = state.extended.active!;
  state = command(state, 'edit'); state = command(state, 'reveal');
  for (let item = 0; item < extendedTask(taskId)!.checklist.length; item++) state = applyExtended(state, { type: 'tick', session: a.id, index: 0, item }, 5000);
  state = applyExtended(state, { type: 'rate', session: a.id, index: 0, rating: 'self' }, 6000);
  assert.equal(state.extended.stats[taskId].streak, 1); assert.equal(state.extended.stats[taskId].dueAt, 6000 + 86400000);
  assert.equal(applyWorkbook(state, { type: 'repeat', id }, 7000), state);
  assert.equal(state.workbook.pages[id].draft, 'Дано: треугольник.\nДокажем равенство углов.');
  const repeatId = currentPageId(state); assert.equal(state.workbook.pages[repeatId].rating, 'self'); assert.notEqual(repeatId, id);
});
test('Only a finished exam can be copied; imported pages survive removal of the source exam history', () => {
  let state = applyStudy(initialProgress(), { area: 'exam', action: { type: 'start', timed: false, random: () => 0 } }, 1000);
  const exam = state.study.exam.current!, taskId = exam.tasks[19].problemId;
  assert.equal(applyWorkbook(state, { type: 'ensure', source: 'exam', session: exam.id, taskId }), state);
  state = applyStudy(state, { area: 'exam', action: { type: 'select', id: exam.id, position: 19 } }, 1100);
  state = applyStudy(state, { area: 'exam', action: { type: 'edit', id: exam.id, number: 20, draft: 'Решение из экзамена', paper: true } }, 1200);
  state = applyStudy(state, { area: 'exam', action: { type: 'finish', id: exam.id } }, 1300);
  state = applyWorkbook(state, { type: 'ensure', source: 'exam', session: exam.id, taskId }, 1400);
  const id = pageId('exam', exam.id, taskId), page = state.workbook.pages[id];
  assert.equal(page.draft, 'Решение из экзамена'); assert.equal(page.compared, true);
  assert.equal(state.study.exam.current!.points[20], undefined); assert.equal(state.extended.stats[taskId], undefined);
  state = { ...state, study: { ...state.study, exam: { current: null, history: [] } } };
  assert.deepEqual(parseProgress(JSON.parse(JSON.stringify(state))).workbook.pages[id], page);
});
test('Migration defaults to an empty notebook and bounds malformed annotation fields', () => {
  const { workbook: _workbook, ...legacy } = initialProgress(); assert.deepEqual(parseProgress(legacy).workbook, emptyWorkbook());
  const state = command(started(), 'edit'), page = state.workbook.pages[currentPageId(state)];
  const parsed = parsePage({ ...page, draft: 'x'.repeat(9999), teacherComment: 'x'.repeat(9000), kinds: [0, 0, -1, '2', 99], step: 900, photos: [photo(), photo(), { ...photo(2), filename: '../other.jpg' }] })!;
  assert.equal(parsed.draft.length, 6000); assert.equal(parsed.teacherComment.length, 3000); assert.deepEqual(parsed.kinds, [0]); assert.equal(parsed.step, null); assert.equal(parsed.photos.length, 1);
  assert.equal(parsePage({ ...page, taskId: 'deleted' }), null); assert.equal(parsePage({ ...page, id: 'wrong' }), null);
});
test('Notebook saves separate small rows and restores text, photos, review and repeat with the shared snapshot', async () => {
  let state = command(started(), 'edit'), id = currentPageId(state);
  state = applyWorkbook(state, { type: 'photo', id, photo: photo() }, 3000);
  state = applyWorkbook(state, { type: 'review', id, reviewed: true }, 4000);
  state = applyWorkbook(state, { type: 'repeat', id }, 5000);
  const storage = memory(), write = createProgressWriter(storage);
  await write(state);
  const root = JSON.parse(storage.data.get(PROGRESS_KEY)!);
  assert.equal(root.workbook, undefined); assert.equal(root.workbookRefs.length, 1);
  assert.ok(root.workbookRefs[0].key.startsWith(WORKBOOK_PREFIX));
  assert.ok(storage.data.get(root.workbookRefs[0].key)!.length < 30000);
  assert.deepEqual(JSON.parse(JSON.stringify(await loadProgress(storage))), JSON.parse(JSON.stringify(state)));
  await write(applyWorkbook(state, { type: 'edit', id, mistake: 'Новое замечание' }, 6000));
  assert.equal([...storage.data.keys()].filter(k => k.startsWith(WORKBOOK_PREFIX)).length, 1, 'superseded page versions are reclaimed after index commit');
});
test('A failed root commit leaves earlier notebook pages intact; retry publishes the newer snapshot', async () => {
  const storage = memory(), first = command(started(), 'edit'), id = currentPageId(first);
  let fail = false;
  const adapter = { ...storage, setItem: async (key: string, value: string) => { if (key === PROGRESS_KEY && fail) throw new Error('disk full'); await storage.setItem(key, value); } };
  const write = createProgressWriter(adapter); await write(first);
  const next = applyWorkbook(first, { type: 'edit', id, mistake: 'Не потерять прошлую работу' }, 3000);
  fail = true; await assert.rejects(write(next));
  assert.equal((await loadProgress(storage)).workbook.pages[id].mistake, '');
  fail = false; await write(next);
  assert.equal((await loadProgress(storage)).workbook.pages[id].mistake, 'Не потерять прошлую работу');
  assert.equal([...storage.data.keys()].filter(k => k.startsWith(WORKBOOK_PREFIX)).length, 1);
});
test('Missing notebook rows block loading instead of silently overwriting the user archive', async () => {
  const storage = memory(), state = command(started(), 'edit'); await createProgressWriter(storage)(state);
  const root = JSON.parse(storage.data.get(PROGRESS_KEY)!); storage.data.delete(root.workbookRefs[0].key);
  await assert.rejects(loadProgress(storage));
  root.workbookRefs[0].key = 'unrelated/private-key'; storage.data.set(PROGRESS_KEY, JSON.stringify(root));
  await assert.rejects(loadProgress(storage));
});

test('A large notebook keeps each storage row small and leaves ordinary accuracy unchanged', async () => {
  let state = command(started(), 'edit'), template = state.workbook.pages[currentPageId(state)];
  const pages = Object.fromEntries(Array.from({ length: 200 }, (_, n) => {
    const session = `archive-${n}`, id = pageId('practice', session, template.taskId);
    return [id, { ...template, id, session, draft: 'Доказательство с обоснованием. '.repeat(250).slice(0, 6000), teacherComment: 'Замечание. '.repeat(300).slice(0, 3000) }];
  }));
  state = { ...state, workbook: { pages } };
  const storage = memory(); await createProgressWriter(storage)(state);
  const sizes = [...storage.data.values()].map(v => Buffer.byteLength(v, 'utf8'));
  assert.ok(Math.max(...sizes) < 100000, 'no large single Android CursorWindow row');
  const restored = await loadProgress(storage); assert.equal(Object.keys(restored.workbook.pages).length, 200);
  assert.equal(restored.attempts, 0); assert.equal(restored.correct, 0); assert.deepEqual(restored.extended.stats, {});
});
