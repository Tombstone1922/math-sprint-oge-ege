import type { GridPoint, GridScene } from './grid-geometry.ts';
export type LabelBox = { name: string; x: number; y: number; width: number; height: number; point: GridPoint };
export function labelsOverlap(a: LabelBox, b: LabelBox, margin = 0): boolean {
  return a.x < b.x + b.width + margin && a.x + a.width + margin > b.x && a.y < b.y + b.height + margin && a.y + a.height + margin > b.y;
}
export function geometryLayout(scene: GridScene, width: number, height: number, fontSize = 14) {
  const cell = Math.min((width - 28) / scene.columns, (height - 28) / scene.rows), left = (width - scene.columns * cell) / 2, top = (height - scene.rows * cell) / 2;
  const pixel = ([x, y]: GridPoint): GridPoint => [left + x * cell, top + (scene.rows - y) * cell];
  const visible = Object.entries(scene.points).filter(([name]) => !scene.hiddenPoints?.includes(name)).map(([name, point]) => ({ name, point: pixel(point) }));
  const edges = [...scene.segments, ...scene.polygons.flatMap(p => p.vertices.map((a, i): [GridPoint, GridPoint] => [a, p.vertices[(i + 1) % p.vertices.length]]))].map(([a, b]) => [pixel(a), pixel(b)] as const);
  const distance = (a: GridPoint, b: GridPoint) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const nearest = (p: typeof visible[number]) => Math.min(...visible.filter(q => q !== p).map(q => distance(p.point, q.point)), Infinity);
  const labels: LabelBox[] = [], boxWidth = fontSize * .9, boxHeight = fontSize + 4;
  // Place crowded labels first. Their position depends only on the drawing, never on the answer.
  for (const p of [...visible].sort((a, b) => nearest(a) - nearest(b))) {
    const [x, y] = p.point, candidates: LabelBox[] = [];
    for (const gap of [5, 14, 25, 36]) for (const [dx, dy] of [[-boxWidth - gap, -boxHeight - gap], [gap, -boxHeight - gap], [-boxWidth - gap, gap], [gap, gap], [-boxWidth - gap, -boxHeight / 2], [gap, -boxHeight / 2], [-boxWidth / 2, -boxHeight - gap], [-boxWidth / 2, gap]]) {
      candidates.push({ name: p.name, point: p.point, width: boxWidth, height: boxHeight, x: Math.max(2, Math.min(width - boxWidth - 2, x + dx)), y: Math.max(2, Math.min(height - boxHeight - 2, y + dy)) });
    }
    const inside = (q: GridPoint, r: LabelBox, margin = 0) => q[0] > r.x - margin && q[0] < r.x + r.width + margin && q[1] > r.y - margin && q[1] < r.y + r.height + margin;
    const cost = (r: LabelBox) => {
      let score = labels.filter(other => labelsOverlap(r, other, 2)).length * 100000;
      score += visible.filter(q => inside(q.point, r, 3)).length * 100000;
      // A few samples discourage placing text over geometry strokes or a circle.
      for (const [a, b] of edges) for (let i = 0; i <= 30; i++) if (inside([a[0] + (b[0] - a[0]) * i / 30, a[1] + (b[1] - a[1]) * i / 30], r, 1)) score += 2;
      for (const c of scene.circles) { const center = pixel(c.center); for (let i = 0; i < 90; i++) if (inside([center[0] + c.radius * cell * Math.cos(i / 90 * 2 * Math.PI), center[1] + c.radius * cell * Math.sin(i / 90 * 2 * Math.PI)], r, 1)) score += 2; }
      const center: GridPoint = [r.x + r.width / 2, r.y + r.height / 2];
      score += distance(center, p.point) * .06;
      // Prefer labels outside the body of the figure when several placements are equally clear.
      score += distance(center, [x < width / 2 ? x - 12 : x + 12, y < height / 2 ? y - 15 : y + 15]) * .02;
      return score;
    };
    labels.push(candidates.map(box => ({ box, score: cost(box) })).reduce((best, item) => item.score < best.score ? item : best).box);
  }
  return { width, height, cell, left, top, fontSize, labels, pixel };
}
