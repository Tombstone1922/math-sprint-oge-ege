import { extraPracticalDrawing } from './practical-extra-drawing.ts';
import type { PracticalScene, Point } from './practical-models.ts';
export type Ink = { kind: 'line'; x1: number; y1: number; x2: number; y2: number; stroke: string; weight: number } | { kind: 'rect'; x: number; y: number; w: number; h: number; fill: string; radius?: number } | { kind: 'circle'; x: number; y: number; r: number; fill: string; stroke: string; weight: number } | { kind: 'text'; x: number; y: number; value: string; size: number; color: string; bold?: boolean; maxWidth?: number };
export type Drawing = { width: number; height: number; items: Ink[] };
const black = '#233246';
export function pointInside(p: Point, polygon: Point[]): boolean {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const a = polygon[i], b = polygon[j];
    if ((a.y > p.y) !== (b.y > p.y) && p.x < (b.x - a.x) * (p.y - a.y) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}
export function practicalDrawing(scene: PracticalScene): Drawing {
  if (scene.kind !== 'plan' && scene.kind !== 'tyre') return extraPracticalDrawing(scene);
  const items: Ink[] = [];
  const line = (x1: number, y1: number, x2: number, y2: number, weight = 2, stroke = black) => items.push({ kind: 'line', x1, y1, x2, y2, weight, stroke });
  const text = (x: number, y: number, value: string, size = 18, bold = false) => items.push({ kind: 'text', x, y, value, size, color: black, bold });
  const rect = (x: number, y: number, w: number, h: number, fill: string, radius = 0) => items.push({ kind: 'rect', x, y, w, h, fill, radius });
  const roundedBox = (x: number, y: number, w: number, h: number, r: number, fill: string) => {
    rect(x, y, w, h, fill, r);
    line(x + r, y, x + w - r, y); line(x + w, y + r, x + w, y + h - r); line(x + r, y + h, x + w - r, y + h); line(x, y + r, x, y + h - r);
    for (const [cx, cy, start] of [[x + w - r, y + r, -Math.PI / 2], [x + w - r, y + h - r, 0], [x + r, y + h - r, Math.PI / 2], [x + r, y + r, Math.PI]]) {
      for (let j = 0; j < 12; j++) { const a = start + j / 12 * Math.PI / 2, b = start + (j + 1) / 12 * Math.PI / 2; line(cx + r * Math.cos(a), cy + r * Math.sin(a), cx + r * Math.cos(b), cy + r * Math.sin(b)); }
    }
  };
  const circle = (x: number, y: number, r: number, fill = '#FFFFFF', stroke = black, weight = 2) => items.push({ kind: 'circle', x, y, r, fill, stroke, weight });
  const arrow = (x1: number, y1: number, x2: number, y2: number, both = false) => {
    line(x1, y1, x2, y2, 1.5); const angle = Math.atan2(y2 - y1, x2 - x1);
    for (const end of both ? [0, 1] : [1]) { const x = end ? x2 : x1, y = end ? y2 : y1, a = angle + (end ? 0 : Math.PI); for (const sign of [-1, 1]) line(x, y, x - 7 * Math.cos(a + sign * .4), y - 7 * Math.sin(a + sign * .4), 1.5); }
  };
  if (scene.kind === 'tyre') {
    text(330, 23, `${scene.width}/${scene.ratio} R${scene.rim}`, 24, true);
    circle(185, 165, 106, '#F2F4F6'); circle(185, 165, 68); circle(185, 165, 58, '#F8F9FA', '#A0A7AF', 1);
    line(166, 165, 204, 165, 1); line(185, 146, 185, 184, 1);
    line(66, 59, 185, 59, 1, '#8893A1'); line(66, 271, 185, 271, 1, '#8893A1'); arrow(66, 59, 66, 271, true); text(43, 165, 'D', 23, true);
    arrow(117, 165, 253, 165, true); text(185, 143, 'd', 23, true);
    line(185, 59, 315, 59, 1, '#8893A1'); line(185, 97, 315, 97, 1, '#8893A1'); arrow(315, 59, 315, 97, true); text(339, 79, 'H', 23, true);
    // A section drawn separately makes width B distinct from the side-view diameter.
    roundedBox(447, 59, 106, 212, 22, '#E6EAEE'); roundedBox(466, 97, 68, 136, 12, '#FFFFFF');
    for (let j = 0; j < 6; j++) line(468 + j * 13, 60, 468 + j * 13, 72, 1);
    line(447, 271, 447, 301, 1, '#8893A1'); line(553, 271, 553, 301, 1, '#8893A1'); arrow(447, 296, 553, 296, true); text(500, 321, 'B', 23, true);
    text(185, 307, 'Вид сбоку', 18); text(500, 352, 'Поперечное сечение', 18);
    text(330, 392, 'D — колесо · d — диск · H — боковина · B — ширина', 17);
    return { width: 660, height: 420, items };
  }
  const cell = 20, margin = 30, X = (x: number) => margin + x * cell, Y = (y: number) => margin + y * cell;
  rect(X(0), Y(0), scene.width * cell, scene.height * cell, '#FFFFFF');
  for (const room of scene.rooms) {
    const fill = room.role === 'garden' ? '#F0F4EB' : room.role === 'orchard' ? '#F6F7F2' : '#F7F8FA';
    if (room.polygon) {
      for (let x = room.x; x < room.x + room.w; x++) for (let y = room.y; y < room.y + room.h; y++) if (pointInside({ x: x + .5, y: y + .5 }, room.polygon)) rect(X(x), Y(y), cell, cell, fill);
    } else rect(X(room.x), Y(room.y), room.w * cell, room.h * cell, fill);
  }
  for (const r of scene.paving) rect(X(r.x), Y(r.y), r.w * cell, r.h * cell, '#D7DEE6');
  for (let x = 0; x <= scene.width; x++) line(X(x), Y(0), X(x), Y(scene.height), .65, '#CCD4DD');
  for (let y = 0; y <= scene.height; y++) line(X(0), Y(y), X(scene.width), Y(y), .65, '#CCD4DD');
  for (const room of scene.rooms) {
    const p = room.polygon ?? [{ x: room.x, y: room.y }, { x: room.x + room.w, y: room.y }, { x: room.x + room.w, y: room.y + room.h }, { x: room.x, y: room.y + room.h }];
    p.forEach((point, i) => { const next = p[(i + 1) % p.length]; line(X(point.x), Y(point.y), X(next.x), Y(next.y), room.role === 'garden' || room.role === 'orchard' ? 1.3 : 3); });
    if (room.role === 'orchard') for (let x = room.x + .7; x < room.x + room.w; x += 1.3) for (let y = room.y + .7; y < room.y + room.h; y += 1.3) circle(X(x), Y(y), 5, '#FFFFFF', '#8E9A8B', 1);
  }
  line(X(0), Y(0), X(scene.width), Y(0), 3.5); line(X(scene.width), Y(0), X(scene.width), Y(scene.height), 3.5); line(X(scene.width), Y(scene.height), X(0), Y(scene.height), 3.5); line(X(0), Y(scene.height), X(0), Y(0), 3.5);
  for (const o of scene.openings) {
    const x = X(o.x), y = Y(o.y), len = o.length * cell, h = o.axis === 'h';
    line(x, y, x + (h ? len : 0), y + (h ? 0 : len), 7, '#FFFFFF');
    if (o.kind === 'window') {
      for (const offset of [-3, 3]) line(x + (h ? 0 : offset), y + (h ? offset : 0), x + (h ? len : offset), y + (h ? offset : len), 1.3);
    } else {
      const upward = o.from === 'outside', direction = upward ? -1 : 1;
      line(x, y, x + (h ? 0 : len), y + (h ? direction * len : 0), 1.5);
      let prev: Point | null = null;
      for (let j = 0; j <= 16; j++) { const a = j / 16 * Math.PI / 2, p = h ? { x: x + len * Math.cos(a), y: y + direction * len * Math.sin(a) } : { x: x + len * Math.sin(a), y: y + len * Math.cos(a) }; if (prev) line(prev.x, prev.y, p.x, p.y, 1, '#637184'); prev = p; }
      if (upward) { arrow(x + len / 2, y + 30, x + len / 2, y + 4); text(x + len / 2, y + 47, o.kind === 'gate' ? 'Ворота' : 'Вход', 17); }
    }
  }
  for (const r of scene.rooms) {
    // Garden label sits in its free lower strip, not on the nested greenhouse.
    const cy = r.role === 'garden' ? r.y + r.h - .55 : r.role === 'house' ? r.y + 2 : r.y + r.h / 2;
    circle(X(r.x + r.w / 2), Y(cy), r.role === 'garden' ? 10 : 14, '#FFFFFF', '#FFFFFF', 1);
    text(X(r.x + r.w / 2), Y(cy), r.label, r.role === 'garden' ? 17 : 23, true);
  }
  const legendY = Y(scene.height) + 83;
  text(X(scene.width / 2), legendY, `Сторона клетки ${String(scene.unit).replace('.', ',')} м`, 18);
  if (scene.theme === 'apartment') {
    line(35, legendY + 34, 65, legendY + 34, 4); text(120, legendY + 34, 'Стена', 16);
    for (const y of [legendY + 31, legendY + 37]) line(195, y, 230, y, 1.3); text(275, legendY + 34, 'Окно', 16);
    line(355, legendY + 34, 355, legendY + 12, 1.5); line(355, legendY + 34, 378, legendY + 34, .7); text(430, legendY + 34, 'Дверь', 16);
  } else { rect(38, legendY + 23, 26, 18, '#D7DEE6'); text(225, legendY + 34, 'Дорожки и площадка', 17); }
  return { width: X(scene.width) + margin, height: legendY + 58, items };
}
