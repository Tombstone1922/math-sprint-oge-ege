export type AxisScene = { lo: number; hi: number; ticks: { value: number; label: string }[]; points: { value: number; label: string }[] };
export type OrderTask = { values: number[]; rule: 'equals' | 'between' | 'positive' | 'negative' | 'max' | 'true' | 'false'; target?: number; lo?: number; hi?: number; closed?: boolean };
export function axisPosition(scene: AxisScene, value: number): number { return 0.08 + (value - scene.lo) / (scene.hi - scene.lo) * 0.84; }
