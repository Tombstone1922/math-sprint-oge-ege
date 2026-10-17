export type Point = { x: number; y: number };
export type PlanRoom = { role: string; label: string; x: number; y: number; w: number; h: number; polygon?: Point[] };
export type Opening = { x: number; y: number; length: number; axis: 'h' | 'v'; from: string; to: string; kind: 'door' | 'window' | 'gate' };
export type PlanScene = { kind: 'plan'; theme: 'apartment' | 'plot'; width: number; height: number; unit: number; rooms: PlanRoom[]; openings: Opening[]; paving: { x: number; y: number; w: number; h: number }[]; mirrored: boolean };
export type TyreScene = { kind: 'tyre'; width: number; ratio: number; rim: number };
export type PracticalScene = PlanScene | TyreScene;
export type DataTable = { headers: string[]; rows: string[][]; caption?: string };
export type PracticalBlock = { id: string; title: string; text: string; scene: PracticalScene; table?: DataTable; facts: Record<string, number> };
export type PracticalQuestion = { block: PracticalBlock; number: number; skill: string; table?: DataTable };
export const fmt = (n: number, digits = 6) => String(Number(n.toFixed(digits))).replace('.', ',');
export const rounded = (n: number, digits = 1) => Number(n.toFixed(digits));
export function area(room: PlanRoom): number {
  if (!room.polygon) return room.w * room.h;
  return Math.abs(room.polygon.reduce((s, p, i, a) => s + p.x * a[(i + 1) % a.length].y - p.y * a[(i + 1) % a.length].x, 0)) / 2;
}
export function perimeter(room: PlanRoom): number {
  if (!room.polygon) return 2 * (room.w + room.h);
  return room.polygon.reduce((s, p, i, a) => s + Math.hypot(p.x - a[(i + 1) % a.length].x, p.y - a[(i + 1) % a.length].y), 0);
}
export function mirroredScene(scene: PlanScene): PlanScene {
  if (!scene.mirrored) return scene;
  return { ...scene, rooms: scene.rooms.map(r => ({ ...r, x: scene.width - r.x - r.w, polygon: r.polygon?.map(p => ({ x: scene.width - p.x, y: p.y })) })), paving: scene.paving.map(r => ({ ...r, x: scene.width - r.x - r.w })), openings: scene.openings.map(o => ({ ...o, x: scene.width - o.x - (o.axis === 'h' ? o.length : 0) })) };
}
export function rectangleDistance(a: PlanRoom, b: PlanRoom): number {
  return Math.hypot(Math.max(a.x - b.x - b.w, b.x - a.x - a.w, 0), Math.max(a.y - b.y - b.h, b.y - a.y - a.h, 0));
}
