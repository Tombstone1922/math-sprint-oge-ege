import { fmt, type PhysicsFigure } from './physics-model.ts';
import type { PhysicsInk } from './physics-drawing.ts';
type Scale = Extract<PhysicsFigure, { kind: 'scale' }>;
const ink = '#20334B', blue = '#3565E8', water = '#E3F1FA', red = '#B53040';
export function instrumentDrawing(f: Scale): PhysicsInk[] {
  const items: PhysicsInk[] = [], step = (f.max - f.min) / f.divisions;
  const line = (x1: number, y1: number, x2: number, y2: number, weight = 1.5, stroke = ink) => items.push({ kind: 'line', x1, y1, x2, y2, weight, stroke });
  const text = (x: number, y: number, value: string, size = 14, width = 90, bold = false) => items.push({ kind: 'text', x, y, value, size, width, bold, color: ink });
  const rect = (x: number, y: number, width: number, height: number, fill = '#FFFFFF', radius = 0, weight = 1.3) => items.push({ kind: 'rect', x, y, width, height, fill, radius, stroke: ink, weight });
  const circle = (x: number, y: number, r: number, fill = '#FFFFFF') => items.push({ kind: 'circle', x, y, r, fill });
  const arrow = (x1: number, y1: number, x2: number, y2: number) => { line(x1, y1, x2, y2, 2.4, blue); const a = Math.atan2(y2 - y1, x2 - x1); for (const s of [-1, 1]) line(x2, y2, x2 - 7 * Math.cos(a + s * .45), y2 - 7 * Math.sin(a + s * .45), 2, blue); };
  const fraction = (f.reading - f.min) / (f.max - f.min);
  if (f.instrument === 'Динамометр') {
    circle(165, 19, 8); line(165, 27, 165, 33); rect(132, 33, 126, 207, '#F8FAFC', 5); text(231, 56, f.unit, 18, 36, true);
    const springEnd = 76 + fraction * 18; let x = 165, y = 49;
    line(165, 33, 165, 49);
    for (let i = 0; i < 12; i++) { const nx = i % 2 ? 155 : 175, ny = 49 + (springEnd - 49) * (i + 1) / 12; line(x, y, nx, ny); x = nx; y = ny; }
    line(x, y, 165, springEnd + 3);
    const top = 101, bottom = 219, Y = (v: number) => top + (v - f.min) / (f.max - f.min) * (bottom - top);
    for (let i = 0; i <= f.divisions; i++) { const yy = top + i / f.divisions * (bottom - top), major = i % 5 === 0; line(major ? 188 : 197, yy, 212, yy, 1.2); if (major) text(233, yy + 3, fmt(f.min + i * step), 14, 44); }
    line(165, springEnd + 3, 165, 251); arrow(165, Y(f.reading), 188, Y(f.reading));
    let px = 165, py = 254; line(165, 251, px, py);
    for (let i = 1; i <= 18; i++) { const a = Math.PI + 1.5 * Math.PI * i / 18, nx = 174 + 9 * Math.cos(a), ny = 254 + 9 * Math.sin(a); line(px, py, nx, ny); px = nx; py = ny; }
  } else if (f.instrument === 'Термометр') {
    const top = 55, bottom = 219, Y = (v: number) => bottom - (v - f.min) / (f.max - f.min) * (bottom - top);
    text(194, 19, f.unit, 18, 80, true); rect(176, 39, 37, 191, '#FFFFFF', 16); circle(194.5, 234, 16); rect(191, Y(f.reading), 7, 234 - Y(f.reading), red, 2); circle(194.5, 234, 10, red);
    for (let i = 0; i <= f.divisions; i++) { const yy = bottom - i / f.divisions * (bottom - top), major = i % 5 === 0; line(221, yy, major ? 241 : 234, yy, 1.2); if (major) text(277, yy + 3, fmt(f.min + i * step), 14, 70); }
  } else if (f.instrument === 'Мензурка') {
    const top = 55, bottom = 220, Y = (v: number) => bottom - (v - f.min) / (f.max - f.min) * (bottom - top), level = Y(f.reading);
    text(196, 22, f.unit, 17, 90, true); rect(146, level, 93, bottom - level, water, 0, 0); line(145, 40, 145, 223); line(145, 223, 241, 223); line(241, 223, 241, 40); line(145, 40, 135, 35); line(130, 240, 255, 240, 3);
    line(147, level - 3, 193, level, 1.6, blue); line(193, level, 239, level - 3, 1.6, blue);
    for (let i = 0; i <= f.divisions; i++) { const yy = bottom - i / f.divisions * (bottom - top), major = i % 5 === 0; line(major ? 207 : 220, yy, 239, yy, 1.2); if (major) text(279, yy + 3, fmt(f.min + i * step), 14, 70); }
  } else if (f.instrument === 'Амперметр' || f.instrument === 'Вольтметр') {
    text(195, 20, f.instrument, 17, 300, true); rect(34, 42, 322, 215, '#FAFBFD', 8);
    const cx = 195, cy = 210, radius = 135, angle = (i: number) => (210 + 120 * i / f.divisions) * Math.PI / 180;
    let px = cx + radius * Math.cos(angle(0)), py = cy + radius * Math.sin(angle(0));
    for (let i = 1; i <= 60; i++) { const a = (210 + 120 * i / 60) * Math.PI / 180, x = cx + radius * Math.cos(a), y = cy + radius * Math.sin(a); line(px, py, x, y, 1.2); px = x; py = y; }
    for (let i = 0; i <= f.divisions; i++) { const a = angle(i), major = i % 5 === 0, r = radius - (major ? 17 : 9); line(cx + r * Math.cos(a), cy + r * Math.sin(a), cx + radius * Math.cos(a), cy + radius * Math.sin(a), 1.2); if (major) text(cx + 98 * Math.cos(a), cy + 98 * Math.sin(a) + 3, fmt(f.min + i * step), 14, 60); }
    text(195, 174, f.unit, 26, 80, true); const a = (210 + 120 * fraction) * Math.PI / 180; arrow(cx, cy, cx + 123 * Math.cos(a), cy + 123 * Math.sin(a)); circle(cx, cy, 5, ink); circle(82, 238, 5); circle(307, 238, 5); text(104, 241, '−', 15, 22); text(285, 241, '+', 15, 22);
  } else {
    const left = 42, right = 348, y = 130, X = (v: number) => left + (v - f.min) / (f.max - f.min) * (right - left);
    text(195, 20, f.instrument, 17, 300, true); rect(29, 112, 334, 83, '#FBF8EE', 3);
    for (let i = 0; i <= f.divisions; i++) { const x = left + (right - left) * i / f.divisions, major = i % 5 === 0; line(x, y - 17, x, y + (major ? 16 : 7), 1.2); if (major) text(x, 174, fmt(f.min + i * step), 14, 60); }
    if (f.start !== undefined) { const a = X(f.start), b = X(f.reading); if (f.instrument === 'Оптическая скамья') { arrow(a, 106, a, 65); arrow(a, 65, a, 106); rect(b - 2, 63, 4, 46, '#DDE4ED'); line(a, 88, b, 88, 1); } else rect(a, 76, b - a, 30, water, 2); text(a, 53, 'А', 16, 30, true); text(b, 53, 'Б', 16, 30, true); }
    else arrow(X(f.reading), 73, X(f.reading), 108);
    text(195, 231, `Единица: ${f.unit}`, 16, 300);
  }
  return items;
}
