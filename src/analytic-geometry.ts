import { makeGridScene, type GridCircle, type GridPoint, type GridScene } from './grid-geometry.ts';

export type GeometryMeasure =
  | { kind: 'length'; points: [string, string] }
  | { kind: 'angle'; points: [string, string, string] }
  | { kind: 'area'; points: string[] };
export type Drawing = { scene: GridScene; unit: number };
export const rad = (degrees: number) => degrees * Math.PI / 180;
export const polar = (radius: number, angle: number): GridPoint => [radius * Math.cos(rad(angle)), radius * Math.sin(rad(angle))];
export const midpoint = (a: GridPoint, b: GridPoint): GridPoint => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
export function foot(p: GridPoint, a: GridPoint, b: GridPoint): GridPoint {
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const t = ((p[0] - a[0]) * dx + (p[1] - a[1]) * dy) / (dx * dx + dy * dy);
  return [a[0] + t * dx, a[1] + t * dy];
}

// Fit exact Euclidean coordinates without stretching either axis. Lengths are given in the question.
export function drawing(points: Record<string, GridPoint>, outline: string[] = [], lines: [string, string][] = [], circles: GridCircle[] = [], shaded = false): Drawing {
  const bounds = [...Object.values(points), ...circles.flatMap(c => [[c.center[0] - c.radius, c.center[1] - c.radius], [c.center[0] + c.radius, c.center[1] + c.radius]] as GridPoint[])];
  const span = Math.max(Math.max(...bounds.map(p => p[0])) - Math.min(...bounds.map(p => p[0])), Math.max(...bounds.map(p => p[1])) - Math.min(...bounds.map(p => p[1])));
  const unit = span / 8;
  const convert = ([x, y]: GridPoint): GridPoint => [x / unit, y / unit];
  const scene = makeGridScene(Object.fromEntries(Object.entries(points).map(([name, p]) => [name, convert(p)])), outline.length ? [{ vertices: outline.map(n => convert(points[n])), shaded }] : [], lines.map(([a, b]) => [convert(points[a]), convert(points[b])]), circles.map(c => ({ center: convert(c.center), radius: c.radius / unit })));
  return { scene: { ...scene, grid: false }, unit };
}

export function circleTriangle(central: number): Drawing {
  const A = polar(4, -central / 2), B = polar(4, central / 2), C: GridPoint = [-4, 0], O: GridPoint = [0, 0];
  return drawing({ A, B, C, O }, ['A', 'B', 'C'], [['O', 'A'], ['O', 'B']], [{ center: O, radius: 4 }]);
}
export function diameterTriangle(angle: number): Drawing {
  const A: GridPoint = [-4, 0], B: GridPoint = [4, 0], C = polar(4, 2 * angle), O: GridPoint = [0, 0];
  return drawing({ A, B, C, O }, ['A', 'B', 'C'], [], [{ center: O, radius: 4 }]);
}
export function tangentDrawing(radius: number, distance: number): Drawing {
  const O: GridPoint = [0, 0], P: GridPoint = [distance, 0];
  const A: GridPoint = [radius * radius / distance, radius * Math.sqrt(distance ** 2 - radius ** 2) / distance];
  return drawing({ O, P, A }, [], [['O', 'P'], ['O', 'A'], ['P', 'A']], [{ center: O, radius }]);
}
export function twoTangents(angle: number): Drawing {
  const O: GridPoint = [0, 0], A = polar(3, (180 - angle) / 2), B = polar(3, -(180 - angle) / 2), P: GridPoint = [3 / Math.sin(rad(angle / 2)), 0];
  return drawing({ O, A, B, P }, [], [['P', 'A'], ['P', 'B'], ['O', 'A'], ['O', 'B'], ['A', 'B']], [{ center: O, radius: 3 }]);
}
export function parallelogram(a: number, b: number, angle: number, diagonals = false): Drawing {
  const A: GridPoint = [0, 0], B = polar(b, angle), D: GridPoint = [a, 0], C: GridPoint = [a + B[0], B[1]], O = midpoint(A, C);
  return drawing({ A, B, C, D, ...(diagonals ? { O } : {}) }, ['A', 'B', 'C', 'D'], diagonals ? [['A', 'C'], ['B', 'D']] : []);
}
export function rhombus(side: number, acute: number, height = false, fromCenter = false): Drawing {
  const A: GridPoint = [0, 0], B = polar(side, acute / 2), C: GridPoint = [2 * B[0], 0], D: GridPoint = [B[0], -B[1]], O = midpoint(A, C);
  const H = foot(fromCenter ? O : D, A, B);
  const T: GridPoint = [D[0] + (H[0] - D[0]) * (-D[1]) / (H[1] - D[1]), 0];
  const result = drawing({ A, B, C, D, O, ...(height ? { H, ...(!fromCenter ? { T } : {}) } : {}) }, ['A', 'B', 'C', 'D'], [['A', 'C'], ['B', 'D'], ...(height ? [[fromCenter ? 'O' : 'D', 'H'] as [string, string]] : [])]);
  if (height && !fromCenter) result.scene.hiddenPoints = ['T'];
  return result;
}
export function trapezoid(small: number, large: number, height: number, middle = false): Drawing {
  const A: GridPoint = [-large / 2, 0], B: GridPoint = [-small / 2, height], C: GridPoint = [small / 2, height], D: GridPoint = [large / 2, 0], H: GridPoint = [C[0], 0];
  const M = midpoint(A, B), N = midpoint(C, D), K = midpoint(A, C);
  return drawing({ A, B, C, D, ...(middle ? { M, N, K } : { H }) }, ['A', 'B', 'C', 'D'], middle ? [['M', 'N'], ['A', 'C']] : [['C', 'H']]);
}
export function splitTrapezoid(baseAngle: number, diagonalAngle: number): Drawing {
  const h = 4, offset = h / Math.tan(rad(baseAngle)), diagonalX = h / Math.tan(rad(diagonalAngle));
  const A: GridPoint = [0, 0], B: GridPoint = [offset, h], C: GridPoint = [diagonalX, h], D: GridPoint = [diagonalX + offset, 0];
  return drawing({ A, B, C, D }, ['A', 'B', 'C', 'D'], [['A', 'C']]);
}

export function rightAngleStrokes(scene: GridScene): [GridPoint, GridPoint][] {
  const edges: [GridPoint, GridPoint][] = [...scene.segments, ...scene.polygons.flatMap(p => p.vertices.map((a, i): [GridPoint, GridPoint] => [a, p.vertices[(i + 1) % p.vertices.length]]))];
  const strokes: [GridPoint, GridPoint][] = [];
  for (const p of Object.values(scene.points)) {
    const rays: GridPoint[] = [];
    for (const [a, b] of edges) {
      const cross = (p[0] - a[0]) * (b[1] - a[1]) - (p[1] - a[1]) * (b[0] - a[0]);
      if (Math.abs(cross) > 1e-8 || (p[0] - a[0]) * (p[0] - b[0]) + (p[1] - a[1]) * (p[1] - b[1]) > 1e-8) continue;
      for (const q of [a, b]) {
        const dx = q[0] - p[0], dy = q[1] - p[1], norm = Math.hypot(dx, dy);
        if (norm > 1e-8) rays.push([dx / norm, dy / norm]);
      }
    }
    let marked = false;
    for (let i = 0; i < rays.length && !marked; i++) for (let j = i + 1; j < rays.length; j++) {
      const a = rays[i], b = rays[j];
      if (Math.abs(a[0] * b[0] + a[1] * b[1]) < 1e-8) {
        const step = 0.23, first: GridPoint = [p[0] + step * a[0], p[1] + step * a[1]], corner: GridPoint = [first[0] + step * b[0], first[1] + step * b[1]], last: GridPoint = [p[0] + step * b[0], p[1] + step * b[1]];
        strokes.push([first, corner], [corner, last]);
        marked = true;
        break;
      }
    }
  }
  return strokes;
}
