import type { VennModel, TreeModel } from './chance-models.ts';
export type ChancePoint = readonly [number, number];
export const vennEllipses = [{ center: [0.38, 0.55] as ChancePoint, radii: [0.31, 0.27] as ChancePoint }, { center: [0.62, 0.55] as ChancePoint, radii: [0.31, 0.27] as ChancePoint }];
export function vennRegion([x, y]: ChancePoint): number {
  const [a, b] = vennEllipses.map(e => ((x - e.center[0]) / e.radii[0]) ** 2 + ((y - e.center[1]) / e.radii[1]) ** 2 <= 1);
  return a ? b ? 1 : 0 : b ? 2 : 3;
}
export const vennLabels: ChancePoint[] = [[0.23, 0.55], [0.5, 0.55], [0.77, 0.55], [0.18, 0.13]];
export function vennAtoms(model: VennModel): { point: ChancePoint; weight: number; region: number }[] {
  const weighted: ChancePoint[][] = [[[0.22, 0.45], [0.22, 0.65]], [[0.48, 0.45], [0.48, 0.65]], [[0.74, 0.45], [0.74, 0.65]], [[0.25, 0.12], [0.65, 0.9]]];
  return model.regions.flatMap((values, region) => {
    const candidates: ChancePoint[] = [];
    for (let row = 0; row < 7; row++) for (let col = 0; col < 16; col++) {
      const p: ChancePoint = [0.14 + col * 0.045, 0.2 + row * 0.09];
      const margin = vennEllipses.every(e => Math.abs(((p[0] - e.center[0]) / e.radii[0]) ** 2 + ((p[1] - e.center[1]) / e.radii[1]) ** 2 - 1) > 0.16);
      if (vennRegion(p) === region && margin) candidates.push(p);
    }
    if (model.display === 'weighted-points') return values.map((weight, i) => ({ point: weighted[region][i], weight, region }));
    if (values.length > candidates.length) throw new Error('Too many Venn points');
    return values.map((weight, i) => ({ point: candidates[Math.floor((i + 0.5) * candidates.length / values.length)], weight, region }));
  });
}
export const treeNodes: { point: ChancePoint; label: string }[] = [{ point: [0.5, 0.08], label: 'S' }, { point: [0.25, 0.44], label: 'A' }, { point: [0.75, 0.44], label: 'не A' }, { point: [0.1, 0.82], label: 'B' }, { point: [0.4, 0.82], label: 'не B' }, { point: [0.6, 0.82], label: 'B' }, { point: [0.9, 0.82], label: 'не B' }];
export function treeEdges(model: TreeModel) {
  return [[0, 1, model.first], [0, 2, 1 - model.first], [1, 3, model.afterA], [1, 4, 1 - model.afterA], [2, 5, model.afterNotA], [2, 6, 1 - model.afterNotA]].map(([a, b, probability]) => ({ a: treeNodes[a].point, b: treeNodes[b].point, probability }));
}
