import assert from 'node:assert/strict';
import test from 'node:test';
import { plotLayout, clipPlotSegment } from '../src/plot-layout.ts';
import { graphTasks } from '../src/extended/graphs.ts';
import { graphMarkers } from '../src/extended/model.ts';

const near = (a: number, b: number) => assert.ok(Math.abs(a - b) < 1e-7, `${a} != ${b}`);
const overlaps = (a: { x: number; y: number; width: number; height: number }, b: typeof a) => a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

test('all 200 task plots and reference graphs have square cells, visible origins and unclipped labels at phone widths', () => {
  const ranges = [...graphTasks.map(t => t.graph!.range), [-6, 6, -6, 6], [-1, 5, -7, 5], [-1, 6, -4, 10]] as [number, number, number, number][];
  for (const range of ranges) for (const [width, height, enlarged] of [[200, 200, false], [216, 264, false], [280, 304, false], [380, 340, false], [620, 560, true]] as const) {
    const p = plotLayout(range, width, height, enlarged), [ox, oy] = p.origin;
    assert.ok(ox >= 24 && ox < width - 20 && oy > 20 && oy < height - 24);
    near(p.pixel(1, 0)[0] - ox, oy - p.pixel(0, 1)[1]);
    assert.ok(Number.isInteger(p.gridStep) && Number.isInteger(p.labelStep));
    assert.equal(p.labelStep % p.gridStep, 0);
    for (const ticks of [p.xTicks, p.yTicks]) for (let i = 0; i < ticks.length; i++) {
      near(ticks[i] / p.gridStep, Math.round(ticks[i] / p.gridStep));
      if (i) near(ticks[i] - ticks[i - 1], p.gridStep);
    }
    const numbered = [...p.xLabels, ...p.yLabels];
    assert.ok(numbered.every(l => l.value !== 0 && !/[.,]/.test(l.text)));
    const labels = [...numbered, { ...p.originLabel, text: '0' }];
    for (let i = 0; i < labels.length; i++) {
      const l = labels[i];
      assert.ok(l.x >= 0 && l.y >= 0 && l.x + l.width <= width && l.y + l.height <= height, `${range} ${width}: ${JSON.stringify(l)}`);
      for (const other of labels.slice(i + 1)) assert.ok(!overlaps(l, other), `${range} ${width}: ${l.text}/${other.text}`);
    }
  }
});

test('plot bounds preserve every requested region and every marked point, including far-shifted graphs', () => {
  for (const t of graphTasks) {
    const g = t.graph!, p = plotLayout(g.range, 216, 264);
    assert.ok(p.range[0] <= g.range[0] && p.range[1] >= g.range[1] && p.range[2] <= g.range[2] && p.range[3] >= g.range[3]);
    for (const point of graphMarkers(g)) {
      assert.ok(point.x >= p.range[0] && point.x <= p.range[1] && point.y >= p.range[2] && point.y <= p.range[3], t.id);
      const [x, y] = p.pixel(point.x, point.y);
      assert.ok(x >= 4 && x <= p.width - 4 && y >= 4 && y <= p.height - 4, t.id);
    }
  }
});

test('clipping retains crossing segments without drawing outside the plot or accepting invalid points', () => {
  const range = [-6, 6, -6, 6] as const;
  assert.deepEqual(clipPlotSegment([-10, 2], [10, 2], range), [[-6, 2], [6, 2]]);
  assert.deepEqual(clipPlotSegment([2, 10], [2, -10], range), [[2, 6], [2, -6]]);
  assert.deepEqual(clipPlotSegment([-10, -10], [10, 10], range), [[-6, -6], [6, 6]]);
  assert.equal(clipPlotSegment([8, 0], [8, 10], range), null);
  assert.equal(clipPlotSegment([NaN, 0], [0, 1], range), null);
  assert.equal(clipPlotSegment([0, 0], [0, Infinity], range), null);
});
