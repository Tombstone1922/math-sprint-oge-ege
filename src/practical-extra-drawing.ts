import type { ExtraScene } from './practical-models.ts';
import type { Drawing, Ink } from './practical-drawing.ts';

export function extraPracticalDrawing(scene: ExtraScene): Drawing {
  const items: Ink[] = [], ink = '#233246', muted = '#6E7B8B';
  const line = (x1: number, y1: number, x2: number, y2: number, weight = 2, stroke = ink) => items.push({ kind: 'line', x1, y1, x2, y2, weight, stroke });
  const text = (x: number, y: number, value: string, size = 18, bold = false, color = ink, maxWidth = 320) => items.push({ kind: 'text', x, y, value, size, bold, color, maxWidth });
  const rect = (x: number, y: number, w: number, h: number, fill = '#F5F7FA') => items.push({ kind: 'rect', x, y, w, h, fill });
  const circle = (x: number, y: number, r: number, fill = '#FFFFFF', stroke = ink) => items.push({ kind: 'circle', x, y, r, fill, stroke, weight: 2 });
  const arrow = (x1: number, y1: number, x2: number, y2: number, both = true) => {
    line(x1, y1, x2, y2, 1.4); const a = Math.atan2(y2 - y1, x2 - x1);
    for (const end of both ? [0, 1] : [1]) for (const sign of [-1, 1]) { const x = end ? x2 : x1, y = end ? y2 : y1, angle = a + (end ? 0 : Math.PI) + sign * .4; line(x, y, x - 7 * Math.cos(angle), y - 7 * Math.sin(angle), 1.4); }
  };
  const dash = (x1: number, y1: number, x2: number, y2: number) => {
    const length = Math.hypot(x2 - x1, y2 - y1), n = Math.ceil(length / 14);
    for (let j = 0; j < n; j++) { const a = j / n, b = Math.min(1, (j + .55) / n); line(x1 + (x2 - x1) * a, y1 + (y2 - y1) * a, x1 + (x2 - x1) * b, y1 + (y2 - y1) * b, 2, '#68788B'); }
  };
  const fmt = (n: number) => String(Number(n.toFixed(4))).replace('.', ',');
  if (scene.kind === 'route') {
    const cell = Math.min(448 / scene.width, 336 / scene.height);
    const X = (x: number) => scene.grid ? 90 + (448 - scene.width * cell) / 2 + x * cell : 90 + x / scene.width * 448;
    const Y = (y: number) => scene.grid ? 70 + (336 - scene.height * cell) / 2 + y * cell : 70 + y / scene.height * 336;
    if (scene.grid) {
      for (let x = 0; x <= scene.width; x++) line(X(x), Y(0), X(x), Y(scene.height), .65, '#D4DBE3');
      for (let y = 0; y <= scene.height; y++) line(X(0), Y(y), X(scene.width), Y(y), .65, '#D4DBE3');
    }
    for (const r of scene.roads) {
      const a = scene.nodes.find(n => n.role === r.from)!, b = scene.nodes.find(n => n.role === r.to)!;
      if (r.surface === 'track') dash(X(a.x), Y(a.y), X(b.x), Y(b.y));
      else {
        line(X(a.x), Y(a.y), X(b.x), Y(b.y), 4);
        if (!scene.grid) {
          const x = X((a.x + b.x) / 2) + (a.x === b.x ? (a.x === 0 ? -37 : 37) : 0), y = Y((a.y + b.y) / 2) + (a.y === b.y ? (a.y === 0 ? -25 : 30) : 0);
          rect(x - 27, y - 13, 54, 26, '#FFFFFF'); text(x, y, fmt(r.length), 19, true);
        }
      }
    }
    for (const n of scene.nodes) { circle(X(n.x), Y(n.y), 16); text(X(n.x), Y(n.y), n.label, 22, true); }
    arrow(590, 130, 590, 70, false); text(590, 48, 'С', 20, true);
    text(330, 476, scene.grid ? `Сторона клетки ${fmt(scene.unit)} км` : 'Длины шоссе — в км · схема без масштаба', 19, true, ink, 620);
    line(100, 516, 145, 516, 4); text(205, 516, 'Шоссе', 18);
    dash(325, 516, 370, 516); text(475, 516, 'Грунтовая дорога', 18);
    return { width: 660, height: 550, items };
  }
  if (scene.kind === 'tariff') {
    const chart = (values: number[], top: number, max: number, step: number, title: string, color: string) => {
      const left = 72, bottom = top + 190, dx = 45, Y = (v: number) => bottom - v / max * 190;
      text(330, top - 42, title, 22, true);
      for (let v = 0; v <= max; v += step) { line(left, Y(v), 605, Y(v), .7, '#D8E0E9'); text(43, Y(v), String(v), 16, false, muted); }
      line(left, top, left, bottom, 1.5); line(left, bottom, 605, bottom, 1.5);
      values.forEach((v, j) => {
        const x = left + 12 + j * dx, y = Y(v);
        if (j) line(x - dx, Y(values[j - 1]), x, y, 2.4, color);
        circle(x, y, 4, color, color); text(x, y - 15, String(v), 15, true, color); text(x, bottom + 24, String(j + 1), 16);
      });
      text(330, bottom + 52, 'Месяц', 17, false, muted);
    };
    chart(scene.minutes, 75, 700, 100, 'Исходящие звонки · минуты', '#3E6288');
    chart(scene.internet, 405, 35, 5, 'Интернет · ГБ', '#477A70');
    return { width: 660, height: 660, items };
  }
  if (scene.kind === 'paper') {
    const x = 65, y = 65, w = 530, h = w / Math.SQRT2;
    text(330, 26, 'Раскрой листа A0', 24, true);
    rect(x, y, w, h, '#FFFFFF');
    // Each cut divides only the remaining half. Areas are 1/2, 1/4, ... 1/64, 1/64.
    let rx = x, ry = y, rw = w, rh = h;
    const fills = ['#EDF2F7', '#E5EDEB', '#F3EEE3', '#EDE9F2', '#E6EEF4', '#EBEFE6'];
    for (let j = 1; j <= 6; j++) {
      const vertical = rw > rh;
      const pw = vertical ? rw / 2 : rw, ph = vertical ? rh : rh / 2;
      rect(rx, ry, pw, ph, fills[j - 1]);
      for (const [a, b, c, d] of [[rx, ry, rx + pw, ry], [rx + pw, ry, rx + pw, ry + ph], [rx + pw, ry + ph, rx, ry + ph], [rx, ry + ph, rx, ry]]) line(a, b, c, d, 1.6);
      text(rx + pw / 2, ry + ph / 2, `A${j}`, j < 4 ? 29 : 20, true);
      if (vertical) { rx += pw; rw = pw; } else { ry += ph; rh = ph; }
    }
    rect(rx, ry, rw, rh, '#F5F6F7'); text(rx + rw / 2, ry + rh / 2, 'A6', 20, true);
    line(x, y, x + w, y, 2.5); line(x + w, y, x + w, y + h, 2.5); line(x + w, y + h, x, y + h, 2.5); line(x, y + h, x, y, 2.5);
    text(330, 475, 'Каждый следующий формат — половина предыдущего', 19, false, ink, 620);
    text(330, 509, 'Площадь A0 = 1 м² · схема раскроя, не таблица размеров', 17, false, muted, 620);
    return { width: 660, height: 540, items };
  }
  // Steam room and stove housing are separate views with explicit units.
  text(188, 32, 'Парная · размеры в метрах', 19, true); text(566, 32, 'Кожух · размеры в см', 19, true);
  const front = [[70, 160], [280, 160], [280, 345], [70, 345]], back = [[120, 105], [330, 105], [330, 290], [120, 290]];
  rect(70, 160, 210, 185, '#F5F7F9');
  for (let j = 0; j < 4; j++) { const a = front[j], b = front[(j + 1) % 4], c = back[j], d = back[(j + 1) % 4]; line(a[0], a[1], b[0], b[1]); if (j < 2) line(c[0], c[1], d[0], d[1]); if (j !== 3) line(a[0], a[1], c[0], c[1]); }
  rect(103, 240, 47, 105, '#E0E7EE'); line(103, 240, 150, 240); line(103, 240, 103, 345); line(150, 240, 150, 345); circle(141, 300, 2, ink);
  arrow(70, 375, 280, 375); text(175, 400, fmt(scene.length), 20, true);
  arrow(302, 358, 352, 303); text(350, 355, fmt(scene.width), 20, true);
  arrow(41, 160, 41, 345); text(22, 250, fmt(scene.height), 19, true);
  text(188, 447, `Дверь ${fmt(scene.doorWidth)} × ${fmt(scene.doorHeight)} м`, 18);
  const ox = 555, oy = 350, scale = 90 / (scene.archWidth / 2), half = 90, height = scene.archHeight * scale, R = Math.hypot(half, height);
  const left = ox - half, right = ox + half, edgeY = oy - height;
  rect(left, edgeY, half * 2, height, '#EEF1F4');
  line(left, edgeY, left, oy); line(left, oy, right, oy); line(right, oy, right, edgeY);
  const start = Math.atan2(-height, -half), end = Math.atan2(-height, half);
  for (let j = 0; j < 60; j++) { const a = start + (end - start) * j / 60, b = start + (end - start) * (j + 1) / 60; line(ox + R * Math.cos(a), oy + R * Math.sin(a), ox + R * Math.cos(b), oy + R * Math.sin(b), 2.5); }
  circle(ox, oy, 3, ink); text(ox, oy + 18, 'O', 18, true);
  line(ox, oy, right, edgeY, 1.5, '#5A7695'); text(ox + 24, oy - height / 2, 'R', 22, true);
  arrow(left, 403, right, 403); text(ox, 428, String(scene.archWidth), 20, true);
  line(right, edgeY, 682, edgeY, 1, muted); line(right, oy, 682, oy, 1, muted); arrow(674, edgeY, 674, oy); text(704, (edgeY + oy) / 2, String(scene.archHeight), 19, true);
  text(380, 491, 'Рисунки схематические · пользуйтесь указанными размерами', 18, false, muted, 720);
  return { width: 760, height: 525, items };
}
