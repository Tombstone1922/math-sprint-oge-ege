import type { Problem } from './engine.ts';
import type { FormulaTask } from './calculation-models.ts';
import { displayNumber as fmt } from './function-graphs.ts';
export const formulaGroups = ['Мощность: сопротивление', 'Мощность: сила тока', 'Закон Джоуля–Ленца', 'Кинетическая энергия', 'Потенциальная энергия', 'Сила Архимеда', 'Центростремительное ускорение', 'Шкалы температуры', 'Стоимость по формуле', 'Площадь по диагоналям'] as const;
const pool: Problem[] = [];
const clean = (n: number) => Number(n.toFixed(8));
function add(group: number, expression: string, answer: number, hint: string, formulaTask: FormulaTask) {
  pool.push({ id: `oge-12-g${group}-${pool.length % 20 + 1}`, expression, answer: String(clean(answer)), hint, formulaTask, colorIndex: pool.length % 20 });
}
for (let group = 1; group <= 10; group++) for (let j = 0; j < 20; j++) {
  const k = j + 1, second = j % 2 === 1;
  if (group === 1 || group === 2) {
    const I = 2 + j % 7, R = group === 1 ? k / 2 : 3 + j, P = I * I * R;
    add(group, `Мощность тока определяется формулой P=I²R, где P — в ваттах, I — в амперах, R — в омах. ${group === 1 ? `P=${fmt(P)}, I=${I}. Найдите R (Ом).` : `P=${fmt(P)}, R=${R}. Найдите I (А).`}`, group === 1 ? R : I, group === 1 ? `R=P/I²=${fmt(P)}/${I}²=${fmt(R)} Ом.` : `I²=P/R=${fmt(P)}/${R}=${I * I}. Сила тока неотрицательна: I=${I} А.`, { relation: 'power', known: group === 1 ? { P, I } : { P, R }, unknown: group === 1 ? 'R' : 'I' });
  } else if (group === 3) {
    const I = 2 + j % 5, R = 3 + j, t = 2 + j % 4, Q = I * I * R * t;
    add(group, `Количество теплоты Q=I²Rt (Дж). ${second ? `Q=${Q}, I=${I} А, R=${R} Ом. Найдите t (с).` : `Q=${Q}, I=${I} А, t=${t} с. Найдите R (Ом).`}`, second ? t : R, second ? `t=Q/(I²R)=${Q}/(${I}²·${R})=${t} с.` : `R=Q/(I²t)=${Q}/(${I}²·${t})=${R} Ом.`, { relation: 'heat', known: second ? { Q, I, R } : { Q, I, t }, unknown: second ? 't' : 'R' });
  } else if (group === 4) {
    const m = 600 + 100 * j, v = 4 + j, E = m * v * v / 2;
    add(group, `Кинетическая энергия E=mv²/2, где m — масса (кг), v — скорость (м/с), E — энергия (Дж). ${second ? `E=${E}, v=${v}. Найдите m.` : `E=${E}, m=${m}. Найдите v, v≥0.`}`, second ? m : v, second ? `m=2E/v²=2·${E}/${v}²=${m} кг.` : `v²=2E/m=2·${E}/${m}=${v * v}. v=${v} м/с.`, { relation: 'kinetic', known: second ? { E, v } : { E, m }, unknown: second ? 'm' : 'v' });
  } else if (group === 5) {
    const m = 5 + j, h = 2 + j % 7, g = 9.8, E = clean(m * g * h);
    add(group, `Потенциальная энергия E=mgh, g=9,8 м/с². ${second ? `E=${fmt(E)} Дж, m=${m} кг. Найдите h (м).` : `E=${fmt(E)} Дж, h=${h} м. Найдите m (кг).`}`, second ? h : m, second ? `h=E/(mg)=${fmt(E)}/(${m}·9,8)=${h} м.` : `m=E/(gh)=${fmt(E)}/(9,8·${h})=${m} кг.`, { relation: 'potential', known: second ? { E, m, g } : { E, g, h }, unknown: second ? 'h' : 'm' });
  } else if (group === 6) {
    const rho = 1000, g = 9.8, V = k / 100, F = clean(rho * g * V);
    add(group, `Сила Архимеда F=ρgV, ρ=1000 кг/м³, g=9,8 м/с². ${second ? `F=${fmt(F)} Н. Найдите объём V (м³).` : `Объём V=${fmt(V)} м³. Найдите F (Н).`}`, second ? V : F, second ? `V=F/(ρg)=${fmt(F)}/9800=${fmt(V)} м³.` : `F=1000·9,8·${fmt(V)}=${fmt(F)} Н.`, { relation: 'buoyancy', known: second ? { F, rho, g } : { rho, g, V }, unknown: second ? 'V' : 'F' });
  } else if (group === 7) {
    const omega = 2 + j % 6, R = k / 10, a = clean(omega * omega * R);
    add(group, `Центростремительное ускорение a=ω²R, где ω — угловая скорость (с⁻¹), R — радиус (м). ${second ? `a=${fmt(a)} м/с², R=${fmt(R)}. Найдите ω≥0.` : `a=${fmt(a)} м/с², ω=${omega}. Найдите R.`}`, second ? omega : R, second ? `ω²=a/R=${fmt(a)}/${fmt(R)}=${omega * omega}. ω=${omega} с⁻¹.` : `R=a/ω²=${fmt(a)}/${omega}²=${fmt(R)} м.`, { relation: 'centripetal', known: second ? { a, R } : { a, omega }, unknown: second ? 'omega' : 'R' });
  } else if (group === 8) {
    const C = j - 14, F = clean(1.8 * C + 32);
    add(group, `Температуры Фаренгейта F и Цельсия C связаны формулой F=1,8C+32. ${second ? `C=${fmt(C)} °C. Найдите F (°F).` : `F=${fmt(F)} °F. Найдите C (°C).`}`, second ? F : C, second ? `F=1,8·(${fmt(C)})+32=${fmt(F)} °F.` : `C=(F−32)/1,8=(${fmt(F)}−32)/1,8=${fmt(C)} °C. Отрицательный ответ допустим.`, { relation: 'temperature', known: second ? { C } : { F }, unknown: second ? 'F' : 'C' });
  } else if (group === 9) {
    const A = 4800 + 100 * j, B = 3200, n = 3 + j, C = A + B * n;
    add(group, `Стоимость колодца C=${A}+${B}n рублей, где n — число колец. ${second ? `Стоимость ${C} рублей. Найдите n.` : `Найдите стоимость колодца из ${n} колец (руб.).`}`, second ? n : C, second ? `n=(C−${A})/${B}=(${C}−${A})/${B}=${n}.` : `C=${A}+${B}·${n}=${C} рублей.`, { relation: 'cost', known: second ? { C, A, B } : { A, B, n }, unknown: second ? 'n' : 'C' });
  } else {
    const d1 = k + 2, d2 = 10 + 5 * j, sine = 0.8, S = clean(d1 * d2 * sine / 2);
    add(group, `Площадь четырёхугольника S=d₁d₂·sinα/2, d₁ и d₂ — диагонали, α — угол между ними. ${second ? `S=${fmt(S)}, d₂=${d2}, sinα=0,8. Найдите d₁.` : `d₁=${d1}, d₂=${d2}, sinα=0,8. Найдите S.`}`, second ? d1 : S, second ? `d₁=2S/(d₂·sinα)=2·${fmt(S)}/(${d2}·0,8)=${d1}.` : `S=${d1}·${d2}·0,8/2=${fmt(S)}.`, { relation: 'diagonal-area', known: second ? { S, d2, sine } : { d1, d2, sine }, unknown: second ? 'd1' : 'S' });
  }
}
export const formulaProblemPool: readonly Problem[] = pool;
