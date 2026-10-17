import assert from 'node:assert/strict';
import test from 'node:test';
import { extraPracticalPools, tariffCost } from '../src/oge-practical-extra.ts';
import { checkAnswer } from '../src/engine.ts';
import { practicalDrawing } from '../src/practical-drawing.ts';
import type { RouteScene } from '../src/practical-models.ts';
const n = (s: string) => Number(s.replace(',', '.'));
const tenth = (x: number) => Math.round((x + Number.EPSILON) * 10) / 10;

// Dijkstra independently checks every possible route, rather than the generator's three formulas.
function shortest(s: RouteScene, weight: (length: number, highway: boolean) => number): number {
  const distances = new Map(s.nodes.map(p => [p.role, p.role === 'B' ? 0 : Infinity])), remaining = new Set(distances.keys());
  while (remaining.size) {
    const from = [...remaining].sort((a, b) => distances.get(a)! - distances.get(b)!)[0]; remaining.delete(from);
    for (const edge of s.roads) {
      if (edge.from !== from && edge.to !== from) continue;
      const to = edge.from === from ? edge.to : edge.from;
      distances.set(to, Math.min(distances.get(to)!, distances.get(from)! + weight(edge.length, edge.surface === 'highway')));
    }
  }
  return distances.get('D')!;
}
const bill = (row: string[], mins: number, gb: number, sms: number) => {
  const r = row.slice(1).map(n), [fee, includedMins, includedGb, includedSms, minutePrice, packageGb, packagePrice, smsPrice] = r;
  let additionalGb = 0, bought = 0;
  while (includedGb + additionalGb < gb) { additionalGb += packageGb; bought++; }
  return fee + Math.max(0, mins - includedMins) * minutePrice + bought * packagePrice + Math.max(0, sms - includedSms) * smsPrice;
};

test('all 1000 new practical answers match independent route search, billing and measurements', () => {
  const skills = new Set<string>();
  for (const pool of Object.values(extraPracticalPools)) for (const p of pool) {
    const { block, skill } = p.practical!, s = block.scene, f = block.facts;
    skills.add(skill);
    let expected: number | string;
    if (s.kind === 'route') {
      const node = (role: string) => s.nodes.find(v => v.role === role)!;
      const distance = (a: string, b: string) => Math.sqrt((node(a).x - node(b).x) ** 2 + (node(a).y - node(b).y) ** 2) * s.unit;
      for (const edge of s.roads) assert.ok(Math.abs(edge.length - distance(edge.from, edge.to)) < 1e-8, block.id);
      if (skill === 'route-labels') expected = ['B', 'C', 'E', 'D'].map(role => node(role).label).join('');
      else if (skill === 'route-highway') expected = distance('B', 'C') + distance('C', 'D');
      else if (skill === 'route-short-diagonal') expected = distance('B', 'E');
      else if (skill === 'route-long-diagonal') expected = distance('B', 'D');
      else if (skill === 'route-time') expected = tenth(60 * (distance('B', 'E') / f.vt + distance('E', 'D') / f.vh));
      else if (skill === 'route-fastest') expected = tenth(shortest(s, (length, highway) => length / (highway ? f.vh : f.vt) * 60));
      else if (skill === 'route-fuel') expected = Math.round(shortest(s, (length, highway) => length * (highway ? f.highwayFuel : f.trackFuel) / 100) * 100) / 100;
      else if (skill === 'route-percent') { const highway = distance('B', 'C') + distance('C', 'D'); expected = tenth(100 - distance('B', 'D') / highway * 100); }
      else throw new Error(skill);
    } else if (s.kind === 'tariff') {
      assert.equal(s.minutes.length, 12); assert.equal(s.internet.length, 12);
      assert.ok(s.minutes.every(v => v >= 0 && v <= 700)); assert.ok(s.internet.every(v => v >= 0 && v <= 35));
      const rows = block.table!.rows;
      if (skill === 'tariff-count') expected = s.minutes.filter(v => v <= n(rows[0][2])).length;
      else if (skill === 'tariff-bill') expected = bill(rows[0], s.minutes[f.month - 1], s.internet[f.month - 1], f.sms);
      else if (skill === 'tariff-average') expected = tenth(s.internet.reduce((a, b) => a + b) / 12);
      else if (skill === 'tariff-peak') { const peaks = s.internet.flatMap((v, j) => v === Math.max(...s.internet) ? [j + 1] : []); assert.equal(peaks.length, 1); expected = peaks[0]; }
      else if (skill === 'tariff-percent') expected = n(rows[0][1]) + n(rows[0][1]) * .12;
      else if (skill === 'tariff-year') expected = Math.min(...rows.map(row => s.minutes.reduce((sum, m, j) => sum + bill(row, m, s.internet[j], f.sms), 0)));
      else throw new Error(skill);
    } else if (s.kind === 'stove') {
      const volume = s.length * s.width * s.height, rows = block.table!.rows;
      assert.ok(rows.every(r => n(r[2]) <= n(r[3])));
      const suitable = rows.filter(r => volume >= n(r[2]) - 1e-9 && volume <= n(r[3]) + 1e-9), wood = suitable.filter(r => r[1] === 'Дровяная'), electric = suitable.filter(r => r[1] === 'Электрическая');
      assert.equal(wood.length, 1); assert.equal(electric.length, 1);
      if (skill === 'stove-labels') expected = [2, 0, 1].map(j => rows[j][0]).join('');
      else if (skill === 'stove-volume') expected = volume;
      else if (skill === 'stove-walls') expected = s.length * s.height * 2 + s.width * s.height * 2 - s.doorWidth * s.doorHeight;
      else if (skill === 'stove-purchase') expected = n(wood[0][5]) + f.delivery;
      else if (skill === 'stove-discount') expected = n(rows[1][5]) * (100 - f.discount) / 100;
      else if (skill === 'stove-compare') { expected = n(electric[0][5]) + f.cable - n(wood[0][5]); assert.ok(expected > 0); }
      else if (skill === 'stove-arch') expected = Math.sqrt((s.archWidth / 2) ** 2 + s.archHeight ** 2);
      else throw new Error(skill);
    } else if (s.kind === 'paper') {
      const areas = [1, .5, .25, .125, .0625, .03125, .015625], row = block.table!.rows[f.target];
      if (skill === 'paper-count') expected = areas[f.from] / areas[f.to];
      else if (skill === 'paper-area') expected = areas[f.target] * 10000;
      else if (skill === 'paper-short-side') expected = Math.round(n(row[2]) / Math.sqrt(2));
      else if (skill === 'paper-long-side') expected = Math.round(n(row[1]) * Math.sqrt(2));
      else if (skill === 'paper-mass') expected = f.packets * f.sheets * areas[f.target] * f.density / 1000;
      else if (skill === 'paper-purchase') { let packets = 0; while (packets * f.sheets * areas[f.from] / areas[f.to] < f.needed) packets++; expected = packets * f.price; }
      else throw new Error(skill);
    } else throw new Error('Unexpected scene');
    if (typeof expected === 'string') assert.equal(p.answer, expected, p.id);
    else assert.ok(Math.abs(n(p.answer) - expected) < 1e-6, `${p.id} ${skill}: ${p.answer} vs ${expected}`);
    assert.equal(p.answerDisplay, p.answer.replace('.', ','), p.id);
    assert.ok(checkAnswer(p.answerDisplay!, p), p.id);
  }
  assert.ok(skills.size >= 27, `${skills.size} skills`);
});

test('billing includes boundary values, fractional packages and every overage category', () => {
  const row = ['Тест', '500', '300', '20', '50', '2', '2', '170', '1,5'];
  assert.equal(tariffCost(row, 300, 20, 50), 500);
  assert.equal(tariffCost(row, 301, 20.1, 51), 673.5);
  assert.equal(tariffCost(row, 320, 24, 80), 925);
  assert.equal(tariffCost(row, 320, 24.1, 80), 1095);
});

test('every new diagram has finite geometry, unambiguous labels and matching data', () => {
  for (const pool of Object.values(extraPracticalPools)) for (const p of pool.filter(p => p.practical!.number === 1)) {
    const scene = p.practical!.block.scene, drawing = practicalDrawing(scene);
    assert.ok(drawing.width > 0 && drawing.height > 0 && drawing.items.length > 20);
    for (const item of drawing.items) for (const v of Object.values(item)) if (typeof v === 'number') assert.ok(Number.isFinite(v), p.id);
    if (scene.kind === 'route') {
      assert.equal(new Set(scene.nodes.map(v => v.label)).size, 5);
      for (const node of scene.nodes) assert.ok(drawing.items.some(v => v.kind === 'text' && v.value === node.label));
    } else if (scene.kind === 'tariff') {
      for (const value of [...scene.minutes, ...scene.internet]) assert.ok(drawing.items.some(v => v.kind === 'text' && v.value === String(value)));
    } else if (scene.kind === 'stove') {
      assert.ok(drawing.items.some(v => v.kind === 'text' && v.value === String(scene.archWidth)));
      assert.ok(drawing.items.some(v => v.kind === 'text' && v.value === String(scene.archHeight)));
    }
  }
});

test('hand-calculated examples: routes, telephone bill, stove and A4 paper mass', () => {
  assert.deepEqual(extraPracticalPools['oge-routes-grid'].slice(1, 5).map(p => p.answer), ['14', '10', '44.5', '28']);
  assert.deepEqual(extraPracticalPools['oge-routes'].slice(1, 5).map(p => p.answer), ['28', '20', '89', '56']);
  // 200 minutes, 8 GB, 80 SMS: fee 350 + 30 SMS at 1.5 = 395.
  assert.equal(extraPracticalPools['oge-tariffs'][1].answer, '395');
  assert.deepEqual(extraPracticalPools['oge-stoves'].slice(1, 5).map(p => p.answer), ['12', '22000', '18900', '50']);
  const a4 = extraPracticalPools['oge-paper'].find(p => p.practical!.skill === 'paper-mass' && p.practical!.block.facts.target === 4)!;
  assert.equal(Number(a4.answer), 4 * 100 * 90 / 16 / 1000);
});
