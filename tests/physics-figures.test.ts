import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { archivedPhysicsTasks } from '../src/science/physics-archived.ts';
import { allPhysicsTasks, correctAnswer, physicsCorrect, physicsCourse, physicsTask } from '../src/science/courses.ts';
import { physicsDrawing, type PhysicsInk } from '../src/science/physics-drawing.ts';
import { physicsPlotLayout } from '../src/science/physics-plot.ts';
import { fmt, rng, type PhysicsFigure } from '../src/science/physics-model.ts';
import { emptyScience, parseScience, reduceScience, sciencePending, scienceTotals, type ScienceState } from '../src/science/state.ts';
const near = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-7, `${a} ≠ ${b}`);
const plots = allPhysicsTasks.filter(t => t.number === 14 && t.group === 3);
function measuredWave(points: [number, number][]) {
  const peaks = points.filter((p, i) => (i === 0 || p[1] > points[i - 1][1]) && (i === points.length - 1 || p[1] > points[i + 1][1]));
  assert.ok(peaks.length >= 2);
  return { amplitude: Math.max(...points.map(p => Math.abs(p[1]))), period: peaks[1][0] - peaks[0][0] };
}
test('twenty revised comparisons show two distinct labelled curves and exactly two physically true statements', () => {
  assert.equal(plots.length, 20);
  const ratios = new Set<string>();
  for (const t of plots) {
    assert.match(t.id, /^physics14-v2-g3-/); const f = t.figure!; assert.equal(f.kind, 'plot'); if (f.kind !== 'plot') continue;
    assert.equal(f.curves?.length, 2); const [one, two] = f.curves!; assert.deepEqual([one.label, two.label], ['1', '2']); assert.ok(!one.dashed && two.dashed);
    const a = measuredWave(one.points), b = measuredWave(two.points), [A1, A2, T1, T2] = t.model!.values;
    near(a.amplitude, A1); near(b.amplitude, A2); near(a.period, T1); near(b.period, T2); ratios.add(fmt(b.period / a.period));
    const expected = [a.amplitude === b.amplitude ? 'Амплитуды колебаний маятников одинаковы.' : 'Амплитуда колебаний первого маятника вдвое больше амплитуды второго.', a.period === b.period ? 'Периоды колебаний маятников одинаковы.' : Number(t.id.split('-').at(-1)) % 2 === 0 ? `Частота первого маятника составляет ${fmt(b.period / a.period)} частоты второго.` : `Период второго маятника составляет ${fmt(b.period / a.period)} периода первого.`];
    // Compare physical claims, rather than assuming that their position is the answer.
    const truths = t.options.filter(o => expected.includes(o.text)); assert.equal(truths.length, 2);
    assert.deepEqual([...truths.map(o => o.id)].sort(), [...t.keys].sort());
    assert.ok(physicsCorrect(t, [...correctAnswer(t)].reverse().join(''), t.options.map(o => o.id)));
  }
  assert.deepEqual([...ratios].sort(), ['0,5', '1', '1,5', '2']);
});
test('time axes and ticks pass through zero displacement, with a minor grid independent of answer ticks', () => {
  for (const t of [...allPhysicsTasks, ...archivedPhysicsTasks].filter(t => t.figure?.kind === 'plot')) {
    const f = t.figure!; if (f.kind !== 'plot') continue; const d = physicsDrawing(f), layout = physicsPlotLayout(f);
    near(layout.Y(Math.max(Math.min(...f.yTicks), Math.min(0, Math.max(...f.yTicks)))), layout.axisY);
    const axis = d.items.find(p => p.kind === 'line' && p.stroke === '#20334B' && p.x1 === 68 && p.x2 === 369);
    assert.ok(axis?.kind === 'line'); near(axis.y1, layout.axisY); near(axis.y2, layout.axisY);
    if (Math.min(...f.yTicks) < 0 && Math.max(...f.yTicks) > 0) assert.ok(layout.axisY < 222 && layout.axisY > 35);
    const grid = d.items.filter(p => p.kind === 'line' && p.stroke === '#D7DFE8'); assert.ok(grid.length >= 14, t.id);
    for (const x of f.xTicks) assert.ok(grid.some(p => p.kind === 'line' && Math.abs(p.x1 - layout.X(x)) < 1e-7 && p.x1 === p.x2), `Missing x grid at ${x}`);
    for (const y of f.yTicks) assert.ok(grid.some(p => p.kind === 'line' && Math.abs(p.y1 - layout.Y(y)) < 1e-7 && p.y1 === p.y2), `Missing y grid at ${y}`);
  }
  const f = plots[0].figure!; assert.equal(f.kind, 'plot'); if (f.kind === 'plot') near(physicsPlotLayout(f).axisY, 128.5);
});
const baseScale = (instrument: string): Extract<PhysicsFigure, { kind: 'scale' }> => ({ kind: 'scale', min: 0, max: 20, divisions: 20, reading: 0, unit: instrument === 'Динамометр' ? 'Н' : instrument === 'Термометр' ? '°C' : instrument === 'Мензурка' ? 'мл' : 'А', instrument, caption: '' });
const lines = (items: PhysicsInk[]) => items.filter((p): p is Extract<PhysicsInk, { kind: 'line' }> => p.kind === 'line');
test('instrument indications follow their physical scales: spring downward, liquid upward, dial clockwise', () => {
  for (const instrument of ['Динамометр', 'Термометр', 'Мензурка', 'Амперметр', 'Вольтметр']) {
    const f = baseScale(instrument), low = physicsDrawing(f).items, high = physicsDrawing({ ...f, reading: 20 }).items;
    assert.ok(low.some(p => p.kind === 'rect'), 'Instrument has a body'); assert.ok(!low.some(p => p.kind === 'text' && p.value === 'Указатель'));
    if (instrument === 'Динамометр') { const pointer = (is: PhysicsInk[]) => lines(is).find(p => p.stroke === '#3565E8' && p.x1 === 95 && p.x2 === 118)!; assert.ok(pointer(low).y1 < pointer(high).y1); near(pointer(low).y1, 101); near(pointer(high).y1, 219); }
    else if (instrument === 'Термометр') { const fluid = (is: PhysicsInk[]) => is.find(p => p.kind === 'rect' && p.fill === '#B53040')!; const a = fluid(low), b = fluid(high); assert.ok(a.kind === 'rect' && b.kind === 'rect'); assert.ok(a.y > b.y && a.height < b.height); near(a.y, 219); near(b.y, 55); }
    else if (instrument === 'Мензурка') { const fluid = (is: PhysicsInk[]) => is.find(p => p.kind === 'rect' && p.fill === '#E3F1FA')!; const a = fluid(low), b = fluid(high); assert.ok(a.kind === 'rect' && b.kind === 'rect'); near(a.y, 220); near(b.y, 55); assert.equal(a.weight, 0); }
    else { const needle = (is: PhysicsInk[]) => lines(is).find(p => p.stroke === '#3565E8' && p.x1 === 195 && p.y1 === 210)!; const a = needle(low), b = needle(high); assert.ok(a.x2 < 195 && b.x2 > 195); near(a.y2, b.y2); near(Math.hypot(a.x2 - 195, a.y2 - 210), 123); }
  }
});
test('all measurement answers still match displayed divisions and every new primitive stays within the canvas', () => {
  for (const t of [...allPhysicsTasks, ...archivedPhysicsTasks].filter(t => t.figure)) {
    const d = physicsDrawing(t.figure!);
    for (const p of d.items) {
      const coords = p.kind === 'line' ? [p.x1, p.x2, p.y1, p.y2] : [p.x, p.y]; assert.ok(coords.every(Number.isFinite), t.id);
      if (p.kind === 'rect') { assert.ok(p.width >= 0 && p.height >= 0 && p.x >= 0 && p.y >= 0 && p.x + p.width <= d.width && p.y + p.height <= 280, t.id); }
      if (p.kind === 'circle') assert.ok(p.x - p.r >= 0 && p.x + p.r <= d.width && p.y - p.r >= 0 && p.y + p.r <= 280, t.id);
    }
  }
  for (const t of allPhysicsTasks.filter(t => t.number === 15 && t.group <= 7)) { const f = t.figure!; assert.equal(f.kind, 'scale'); if (f.kind !== 'scale') continue; const c = (f.max - f.min) / f.divisions; const [a, b] = t.options.find(o => o.id === 'right')!.text.replaceAll('−', '-').replaceAll(',', '.').match(/-?\d+(?:\.\d+)?/g)!.map(Number); if (t.group === 1) { near(a, c); near(b, f.max); } else { near(a, f.reading - (f.start ?? 0)); near(b, c / 2); } }
});
test('laboratory circuit includes a closed switch and rheostat with V branching after A around R alone', () => {
  const tasks = allPhysicsTasks.filter(t => t.figure?.kind === 'meters'); assert.equal(tasks.length, 40);
  const d = physicsDrawing(tasks[0].figure!), labels = d.items.filter((p): p is Extract<PhysicsInk, { kind: 'text' }> => p.kind === 'text');
  for (const label of ['Rр', 'К', 'A', 'V', 'R', 'Источник']) assert.ok(labels.some(p => p.value === label));
  const a = labels.find(p => p.value === 'A')!, v = labels.find(p => p.value === 'V')!, r = labels.find(p => p.value === 'R')!, wires = lines(d.items);
  assert.ok(v.x === r.x && v.x > a.x, 'V is below R and after A');
  const branches = wires.filter(p => p.x1 === p.x2 && p.y1 === a.y - 4 && p.y2 === v.y - 4); assert.equal(branches.length, 1); assert.ok(branches[0].x1 > a.x + 18 && branches[0].x1 < r.x - 30);
  assert.ok(wires.some(p => p.x1 === 320 && p.y1 === 184 && p.x2 === 320 && p.y2 === 110), 'V returns to the far side of R');
  assert.ok(wires.some(p => p.x1 === 262 && p.y1 === 236 && p.x2 === 297 && p.y2 === 236), 'The switch is closed for measurement');
});
const published = JSON.parse(readFileSync(new URL('./fixtures/physics14-v1-progress.json', import.meta.url), 'utf8')) as ScienceState;
test('published single-curve content and an unfinished saved round retain their original answers and progress', () => {
  assert.equal(createHash('sha256').update(JSON.stringify(archivedPhysicsTasks)).digest('hex'), '3a319e0eefae77c6071ffb8937edf53858ee2a6e99d717bdc622cc4d9b163a2a');
  let s = parseScience(published); assert.deepEqual(s, published); assert.equal(scienceTotals(s).correct, 2);
  while (s.active!.phase !== 'result') { const a = s.active!, id = a.order[a.position], t = physicsTask(id)!; assert.match(id, /^physics14-v1-/); assert.ok(t.figure?.kind === 'plot' && !t.figure.curves); s = reduceScience(s, { type: 'input', session: a.id, task: id, value: correctAnswer(t, a.options[id]) }); s = reduceScience(s, { type: 'submit', session: a.id, task: id }); s = reduceScience(s, { type: 'next', session: a.id, task: id }); }
  assert.equal(scienceTotals(s).correct, 10); assert.deepEqual(parseScience(JSON.parse(JSON.stringify(s))), s);
  s = reduceScience(s, { type: 'finish', session: s.active!.id }); s = reduceScience(s, { type: 'start', course: 'physics-oge-14', group: 3, random: rng(143) });
  assert.ok(s.active!.ids.every(id => id.includes('-v2-'))); assert.equal(scienceTotals(s).correct, 10); assert.equal(physicsCourse('physics-oge-14')!.tasks.length, 200);
});
test('old failed single-curve tasks remain reviewable while new rounds select only the revised bank', () => {
  const id = archivedPhysicsTasks[0].id, stats = { [id]: { attempts: 1, correct: 0, independent: 0, assisted: 0, dueAt: 1000, streak: 0 } };
  let s = parseScience({ ...emptyScience(), stats }); assert.equal(sciencePending(s, 1000, 'physics-oge-14').length, 1);
  s = reduceScience(s, { type: 'start', course: 'physics-oge-14', group: 1, review: true }, 1000); assert.deepEqual(s.active!.ids, [id]); assert.ok(physicsTask(id)); assert.deepEqual(parseScience(JSON.parse(JSON.stringify(s))), s);
});
