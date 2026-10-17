import assert from 'node:assert/strict';
import test from 'node:test';
import { practicalPools } from '../src/oge-practical.ts';
import { checkAnswer, makeRound, restoreRound, shuffleForPractice } from '../src/engine.ts';
import { pointInside, practicalDrawing } from '../src/practical-drawing.ts';
import type { PlanRoom, PlanScene } from '../src/practical-models.ts';

const number = (s: string) => Number(s.replace(',', '.'));
const cellArea = (r: PlanRoom) => r.polygon ? Math.abs(r.polygon.reduce((sum, p, i, ps) => sum + p.x * ps[(i + 1) % ps.length].y - p.y * ps[(i + 1) % ps.length].x, 0)) / 2 : r.w * r.h;
const inside = (r: PlanRoom, x: number, y: number) => r.polygon ? pointInside({ x, y }, r.polygon) : x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h;

test('practical rounds preserve two complete blocks, shared conditions and colors', () => {
  for (const id of Object.keys(practicalPools) as (keyof typeof practicalPools)[]) for (let group = 1; group <= 10; group++) {
    const round = makeRound(id, group, () => 0.3), practice = shuffleForPractice(restoreRound(round.map(p => p.id).join(','), id, group));
    for (const cards of [round, practice]) for (let start = 0; start < 10; start += 5) {
      assert.deepEqual(cards.slice(start, start + 5).map(p => p.practical!.number), [1, 2, 3, 4, 5]);
      assert.equal(new Set(cards.slice(start, start + 5).map(p => p.practical!.block)).size, 1);
      assert.equal(new Set(cards.slice(start, start + 5).map(p => p.colorIndex)).size, 1);
    }
    assert.deepEqual(new Set(round.map(p => p.id)), new Set(practice.map(p => p.id)));
    const corrupted = [...round]; [corrupted[1], corrupted[6]] = [corrupted[6], corrupted[1]];
    assert.throws(() => restoreRound(corrupted.map(p => p.id).join(','), id, group));
  }
});

test('floor plans are buildable: rooms tile the apartment; doors connect the stated rooms; paving avoids buildings', () => {
  for (const pool of [practicalPools['oge-apartment'], practicalPools['oge-plot']]) for (let i = 0; i < 200; i += 5) {
    const block = pool[i].practical!.block, s = block.scene as PlanScene;
    assert.equal(new Set(s.rooms.map(r => r.label)).size, s.rooms.length);
    for (const r of s.rooms) assert.ok(r.x >= 0 && r.y >= 0 && r.x + r.w <= s.width && r.y + r.h <= s.height, `${block.id} bounds ${r.role}`);
    for (let x = .5; x < s.width; x++) for (let y = .5; y < s.height; y++) {
      const occupants = s.rooms.filter(r => inside(r, x, y));
      if (s.theme === 'apartment') assert.equal(occupants.length, 1, `${block.id} gap or overlap at ${x},${y}`);
      else assert.ok(occupants.length < 2 || occupants.length === 2 && occupants.some(r => r.role === 'garden') && occupants.some(r => r.role === 'greenhouse'), `${block.id} objects overlap at ${x},${y}`);
      const paved = s.paving.filter(r => x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h);
      assert.ok(paved.length <= 1, `${block.id} paving double count`);
      if (paved.length) assert.equal(occupants.length, 0, `${block.id} paving crosses ${occupants.map(r=>r.role).join(',')}`);
    }
    if (s.theme === 'apartment') {
      assert.equal(s.rooms.length, 8);
      assert.equal(s.openings.filter(o => o.kind === 'door').length, 8);
      for (const o of s.openings.filter(o => o.kind === 'door')) {
        const x = o.x + (o.axis === 'h' ? o.length / 2 : 0), y = o.y + (o.axis === 'v' ? o.length / 2 : 0);
        const reached = [-.05, .05].map(delta => s.rooms.find(r => inside(r, x + (o.axis === 'v' ? delta : 0), y + (o.axis === 'h' ? delta : 0)))?.role ?? 'outside');
        assert.deepEqual(new Set(reached), new Set([o.from, o.to]), `${block.id} bad doorway ${o.from}/${o.to}`);
      }
      const reachable = new Set(['outside']);
      for (let step = 0; step < 9; step++) for (const o of s.openings.filter(o => o.kind === 'door')) { if (reachable.has(o.from)) reachable.add(o.to); if (reachable.has(o.to)) reachable.add(o.from); }
      assert.ok(s.rooms.every(r => reachable.has(r.role)), `${block.id} inaccessible room`);
      const living = s.rooms.find(r => r.role === 'living')!;
      assert.ok(s.rooms.every(r => r === living || cellArea(r) < cellArea(living)), `${block.id} living is not largest`);
      assert.ok(cellArea(s.rooms.find(r => r.role === 'kitchen')!) < cellArea(s.rooms.find(r => r.role === 'bedroom')!));
    }
    assert.ok(practicalDrawing(s).items.length > 50);
  }
});

test('all 600 answers agree with independent measurements and full prices including rounding and discounts', () => {
  const skills = new Set<string>();
  for (const pool of Object.values(practicalPools)) for (const p of pool) {
    const { block, skill, table } = p.practical!, s = block.scene, f = block.facts;
    skills.add(skill);
    assert.ok(checkAnswer(p.answer, p));
    let expected: number | string;
    if (s.kind === 'plan') {
      const room = (r: string) => s.rooms.find(v => v.role === r)!;
      const surface = (r: string) => cellArea(room(r)) * s.unit ** 2;
      if (skill === 'apartment-labels') expected = ['kitchen','bedroom','storage','living'].map(r=>room(r).label).join('');
      else if (skill === 'plot-labels') expected = ['house','bath','garage','greenhouse'].map(r=>room(r).label).join('');
      else if (skill === 'apartment-tiles') expected = Math.ceil(Math.ceil(Number((surface(['kitchen','bathroom','corridor'][f.tileRoleIndex]) / (f.tileSide / 100) ** 2).toFixed(8))) / f.pack);
      else if (skill === 'apartment-area') expected = surface(['bedroom','living','kitchen-balcony'][f.areaRoleIndex]);
      else if (skill === 'apartment-percent') expected = Number(((surface('bedroom') - surface('kitchen')) / surface('kitchen') * 100).toFixed(1));
      else if (skill === 'apartment-diagonal') expected = Number((Math.sqrt((room('bedroom').w * s.unit) ** 2 + (room('bedroom').h * s.unit) ** 2)).toFixed(1));
      else if (skill === 'apartment-skirting') expected = 2 * (room('living').w + room('living').h) * s.unit - 3 * 2 * s.unit;
      else if (skill === 'apartment-tariff') expected = Math.min(...table!.rows.map(r=>number(r[1]) + Math.max(0, f.usage - number(r[2])) * number(r[3])));
      else if (skill === 'apartment-laminate') expected = Math.min(...table!.rows.map(r=>Math.ceil(Number((surface('bedroom') / number(r[1])).toFixed(8))) * number(r[2]) + number(r[3])));
      else if (skill === 'plot-tiles') {
        let covered = 0;
        for (let x = .5; x < s.width; x++) for (let y = .5; y < s.height; y++) if (s.paving.some(r=>x > r.x && x < r.x+r.w && y > r.y && y < r.y+r.h)) covered++;
        expected = Math.ceil(Number((covered * s.unit ** 2 / (f.tileSide / 100) ** 2 / f.pack).toFixed(8)));
      } else if (skill === 'plot-area') expected = surface('house');
      else if (skill === 'plot-perimeter') {
        const ps = room('house').polygon!;
        expected = ps.reduce((sum, point, j)=>sum+Math.abs(point.x-ps[(j+1)%ps.length].x)+Math.abs(point.y-ps[(j+1)%ps.length].y),0) * s.unit;
      } else if (skill === 'plot-house-garage') {
        const top = room('garage').y, bottom = Math.max(...room('house').polygon!.map(v=>v.y)); expected = (top-bottom) * s.unit;
      } else if (skill === 'plot-garage-bath') {
        const a = room('garage'), b = room('bath'); const dx = Math.max(a.x-b.x-b.w,b.x-a.x-a.w,0),dy=Math.max(a.y-b.y-b.h,b.y-a.y-a.h,0); expected = Number((Math.sqrt(dx*dx+dy*dy)*s.unit).toFixed(1));
      } else if (skill === 'plot-heating') {
        const [gas, electric] = table!.rows;
        const setup = number(gas[1])+number(gas[2])-number(electric[1])-number(electric[2]);
        const usage = (r: string[])=>number(r[3].split(' ')[0])*number(r[4].split(' ')[0]);
        assert.ok(setup>0 && usage(electric)>usage(gas)); expected = setup/(usage(electric)-usage(gas));
      } else if (skill === 'plot-fence') expected = Math.min(...table!.rows.map(r=>(2*(s.width+s.height)*s.unit-4)*number(r[1])+number(r[2])));
      else throw new Error(skill);
    } else {
      const height = s.width*s.ratio/100, oldD = s.rim*25.4+2*height, newD=f.newRim*25.4+2*f.newWidth*f.newRatio/100;
      assert.ok(newD > oldD, `${block.id}: increasing diameter is required`);
      const values = block.table!.rows.filter(r=>r[3] !== '—').map(r=>number(r[0]));
      if (skill==='tyre-min') expected=Math.min(...values);
      else if (skill==='tyre-max') expected=Math.max(...values);
      else if (skill==='tyre-side') expected=height;
      else if (skill==='tyre-disk') expected=s.rim*25.4;
      else if (skill==='tyre-diameter') expected=oldD;
      else if (skill==='tyre-percent') expected=Number(((newD-oldD)/oldD*100).toFixed(1));
      else if (skill==='tyre-turns') expected=Math.round(1000000/(3.14*oldD));
      else if (skill==='tyre-service') expected=Math.min(...table!.rows.map(r=>4*number(r[1])*(1-number(r[2])/100)+number(r[3])));
      else if (skill==='tyre-speed') expected=Number((f.speed*newD/oldD).toFixed(1));
      else if (skill==='tyre-clearance') expected=Number(((newD-oldD)/2).toFixed(1));
      else throw new Error(skill);
      // The replacement used by later questions must exist in the permitted matrix.
      const column = block.table!.headers.findIndex(h=>h===`Диск ${f.newRim}″`);
      assert.ok(block.table!.rows.some(r=>r[column]===`${f.newWidth}/${f.newRatio}`),block.id);
      assert.equal(block.table!.rows.find(r=>r[0]===String(s.width))![2],`${s.width}/${s.ratio}`);
    }
    if (typeof expected==='string') assert.equal(p.answer,expected,p.id);
    else assert.ok(Math.abs(Number(p.answer)-expected)<1e-6,`${p.id} ${skill}: ${p.answer} vs ${expected}`);
  }
  assert.ok(skills.size >= 25, `Only ${skills.size} skills`);
});

// Reference values checked separately by hand, without using generation helpers.
test('canonical apartment, plot and tyre variants match hand-checked answers', () => {
  assert.deepEqual(practicalPools['oge-apartment'].slice(0,5).map(p=>p.answer), ['2415','6','16','33.3','550']);
  assert.deepEqual(practicalPools['oge-plot'].slice(0,5).map(p=>p.answer), ['3246','123','120','8','500']);
  assert.deepEqual(practicalPools['oge-tyres'].slice(0,5).map(p=>p.answer), ['165','111','381','1.4','2592']);
});
