import assert from 'node:assert/strict';
import test from 'node:test';
import { catalog } from '../src/catalog.ts';
import { examId, plannedSubject, searchSubjectModules, subjectModule, subjectModules, subjectRevision } from '../src/subjects.ts';

test('subject maps contain every current exam slot, with unique identities and only the explicitly connected physics exercise bank', () => {
  assert.equal(subjectRevision.year, 2027);
  assert.equal(subjectRevision.status, 'draft');
  assert.equal(subjectModules.length, 91);
  assert.equal(new Set(subjectModules.map(m => m.id)).size, 91);
  for (const [subject, exam, count] of [['physics', 'oge', 22], ['physics', 'ege', 26], ['informatics', 'oge', 16], ['informatics', 'ege', 27]] as const) {
    const modules = searchSubjectModules(subject, exam);
    assert.deepEqual(modules.map(m => m.number), Array.from({ length: count }, (_, i) => i + 1));
    for (const m of modules) {
      const ready = subject === 'physics' && exam === 'oge' && m.number <= 20;
      assert.equal(m.status, ready ? 'ready' : 'planned'); assert.equal(m.readyTasks, ready ? 200 : 0);
      if (ready) assert.equal(m.courseId, `physics-oge-${m.number}`); else assert.equal(m.courseId, undefined);
      assert.ok(m.title.trim() && m.focus.trim());
      assert.equal(catalog.some(item => item.id === m.id), false, 'planned subjects must not enter mathematics practice');
      assert.equal(subjectModule(subject, exam, String(m.number)), m);
    }
  }
});

test('2027 informatics positions use the new syllabus instead of silently retaining the 2026 numbering', () => {
  const get = (n: number) => subjectModule('informatics', 'ege', String(n))!;
  assert.match(get(10).title, /маска подсети/);
  assert.match(get(13).title, /исполнения алгоритма/);
  assert.match(get(23).title, /графах/);
  for (const n of [10, 13, 23, 27]) assert.ok(get(n).note);
  assert.match(get(27).note!, /одной строкой из двух чисел/);
});

test('search stays inside the selected subject and exam, including exact numbers and OGE 13 alternatives', () => {
  assert.deepEqual(searchSubjectModules('physics', 'oge', '№17').map(m => m.number), [17]);
  assert.deepEqual(searchSubjectModules('informatics', 'ege', 'ЕГЭ номер 10').map(m => m.number), [10]);
  assert.deepEqual(searchSubjectModules('informatics', 'oge', '13.1').map(m => m.number), [13]);
  assert.deepEqual(searchSubjectModules('informatics', 'oge', '№13.2').map(m => m.number), [13]);
  assert.deepEqual(searchSubjectModules('informatics', 'ege', '13.1'), []);
  assert.deepEqual(searchSubjectModules('physics', 'oge', '13.2'), []);
  assert.deepEqual(searchSubjectModules('informatics', 'ege', 'фано').map(m => m.number), [4]);
  assert.ok(searchSubjectModules('physics', 'oge', 'расчет').some(m => m.number === 20));
  assert.deepEqual(searchSubjectModules('physics', 'oge', '№26'), []);
});

test('real experiments, practical files and written responses remain distinct in the templates', () => {
  assert.equal(subjectModule('physics', 'oge', '17')!.format, 'experiment');
  assert.match(subjectModule('physics', 'oge', '17')!.note!, /реальном оборудовании/);
  assert.equal(searchSubjectModules('physics', 'oge').filter(m => m.part === 2).length, 6);
  assert.equal(searchSubjectModules('physics', 'ege').filter(m => m.part === 2).length, 6);
  assert.equal(searchSubjectModules('informatics', 'oge').filter(m => m.part === 2).length, 6);
  assert.match(subjectModule('informatics', 'oge', '13')!.focus, /13\.1.*13\.2/);
  assert.equal(subjectModule('informatics', 'oge', '15')!.format, 'program');
  assert.ok(searchSubjectModules('informatics', 'ege').every(m => m.part === null));
});

test('invalid deep links cannot fall back to a random mathematics lesson or to another exam', () => {
  for (const subject of ['math', 'chemistry', undefined, ['physics']]) assert.equal(plannedSubject(subject), undefined);
  for (const exam of ['OGE', '2026', undefined, ['oge']]) assert.equal(examId(exam), undefined);
  for (const number of ['0', '28', '-1', '1.5', '1junk', undefined, ['1']]) assert.equal(subjectModule('informatics', 'ege', number), undefined);
  assert.equal(subjectModule('physics', 'oge', '23'), undefined);
  assert.equal(subjectModule('informatics', 'oge', '17'), undefined);
  assert.equal(subjectModule('math', 'oge', '1'), undefined);
});
