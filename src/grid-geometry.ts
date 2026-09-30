export type GridPoint = readonly [number, number];
export type GridPolygon = { vertices: GridPoint[]; shaded?: boolean };
export type GridCircle = { center: GridPoint; radius: number };
export type GridScene = {
  columns: number; rows: number;
  points: Record<string, GridPoint>;
  polygons: GridPolygon[];
  segments: [GridPoint, GridPoint][];
  circles: GridCircle[];
};
export type GridTask = 'distance' | 'point-line' | 'height' | 'midpoint' | 'median' | 'triangle-midline' | 'trapezoid-midline' | 'area' | 'diagonal' | 'larger-leg' | 'hypotenuse' | 'circle-ratio' | 'segment-ratio';

// Rotation and reflection preserve lengths, angles and the square grid.
export function makeGridScene(
  points: Record<string, GridPoint>, polygons: GridPolygon[] = [],
  segments: [GridPoint, GridPoint][] = [], circles: GridCircle[] = [], variant = 0,
): GridScene {
  const rotate = ([x, y]: GridPoint): GridPoint => {
    const reflected = variant % 2 ? -x : x;
    switch (Math.floor(variant / 2) % 4) {
      case 1: return [-y, reflected];
      case 2: return [-reflected, -y];
      case 3: return [y, -reflected];
      default: return [reflected, y];
    }
  };
  const bounds = [...Object.values(points), ...polygons.flatMap(p => p.vertices), ...segments.flat(),
    ...circles.flatMap(c => [[c.center[0] - c.radius, c.center[1] - c.radius], [c.center[0] + c.radius, c.center[1] + c.radius]] as GridPoint[])].map(rotate);
  const minX = Math.min(...bounds.map(p => p[0])), minY = Math.min(...bounds.map(p => p[1]));
  const maxX = Math.max(...bounds.map(p => p[0])), maxY = Math.max(...bounds.map(p => p[1]));
  const offset = Math.floor(variant / 8) % 2;
  const transform = (p: GridPoint): GridPoint => {
    const [x, y] = rotate(p);
    return [x - minX + 1 + offset, y - minY + 1];
  };
  return {
    columns: Math.ceil(maxX - minX) + 2 + offset, rows: Math.ceil(maxY - minY) + 2,
    points: Object.fromEntries(Object.entries(points).map(([name, p]) => [name, transform(p)])),
    polygons: polygons.map(p => ({ ...p, vertices: p.vertices.map(transform) })),
    segments: segments.map(([a, b]) => [transform(a), transform(b)]),
    circles: circles.map(c => ({ ...c, center: transform(c.center) })),
  };
}

// Horizontal intersections let the native renderer shade any simple polygon.
export function polygonSlice(vertices: readonly GridPoint[], y: number): [number, number][] {
  const xs: number[] = [];
  for (let i = 0; i < vertices.length; i++) {
    const a = vertices[i], b = vertices[(i + 1) % vertices.length];
    if ((a[1] <= y && b[1] > y) || (b[1] <= y && a[1] > y)) {
      xs.push(a[0] + (y - a[1]) * (b[0] - a[0]) / (b[1] - a[1]));
    }
  }
  xs.sort((a, b) => a - b);
  const spans: [number, number][] = [];
  for (let i = 0; i + 1 < xs.length; i += 2) spans.push([xs[i], xs[i + 1]]);
  return spans;
}
