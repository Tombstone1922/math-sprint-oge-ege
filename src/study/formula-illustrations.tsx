import React from 'react';
import { Text, View } from 'react-native';
import { GraphFigure } from '../extended/figure';
import { colors } from '../theme';
const text = { color: colors.navy, fontSize: 13, lineHeight: 19, textAlign: 'center' as const };
const label = (value: string) => <Text style={[text, { fontWeight: '700' }]}>{value}</Text>;
const box = (value: string, color = colors.bluePale) => <View style={{ backgroundColor: color, padding: 11, borderRadius: 12, minWidth: 65, flex: 1 }}>{label(value)}</View>;
function Bars({ values, names, caption }: { values: number[]; names: string[]; caption: string }) {
  return <View><Text style={text}>{caption}</Text><View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center', gap: 9, height: 128 }}>{values.map((value, i) => <View key={i} style={{ alignItems: 'center', width: 30 }}>{label(String(value))}<View style={{ height: value / Math.max(...values) * 76, minHeight: 3, width: 26, backgroundColor: colors.blue, borderRadius: 4, marginTop: 5 }} /><Text style={text}>{names[i]}</Text></View>)}</View></View>;
}
function Axis({ inequality = false }: { inequality?: boolean }) {
  const width = 220, start = inequality ? 4 : 15, end = inequality ? 7 : 22, low = inequality ? 2 : 14, high = inequality ? 7 : 23;
  const px = (n: number) => 16 + (n - low) / (high - low) * 188;
  return <View style={{ alignSelf: 'center', width, height: 125 }}>
    <View style={{ position: 'absolute', left: 13, right: 12, top: 77, height: 1, backgroundColor: colors.muted }} />
    {Array.from({ length: high - low + 1 }, (_, i) => low + i).map(n => <React.Fragment key={n}><View style={{ position: 'absolute', left: px(n), top: 74, height: 7, width: 1, backgroundColor: colors.muted }} /><Text style={[text, { position: 'absolute', left: px(n) - 10, top: 88, width: 20, fontSize: 10 }]}>{n}</Text></React.Fragment>)}
    <View style={{ position: 'absolute', left: px(start), top: 53, width: px(end) - px(start), height: 3, backgroundColor: colors.blue }} /><Text style={{ position: 'absolute', left: px(end) - 3, top: 44, fontSize: 16, color: colors.blue }}>▶</Text><View style={{ position: 'absolute', left: px(start) - 4, top: 74, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.blue }} />
    <Text style={[text, { position: 'absolute', top: 12, left: 15, right: 15 }]}>{inequality ? 'x ≥ 4: граница включена, луч вправо' : '15 − (−7) = 15 + 7: двигаемся вправо'}</Text>
  </View>;
}
export function FormulaIllustration({ id }: { id: string }) {
  let picture: React.ReactNode;
  if (id === 'linear-function' || id === 'parabola' || id === 'quadratic') {
    const coefficients: [number, number, number] = id === 'linear-function' ? [0, -2, 3] : id === 'parabola' ? [1, -4, 1] : [1, -5, 6];
    picture = <><GraphFigure graph={{ branches: [{ coefficients, from: null, to: null, fromClosed: false, toClosed: false }], holes: [], target: 0, range: id === 'linear-function' ? [-1, 5, -7, 5] : [-1, 6, -4, 10] }} /><Text style={text}>{id === 'linear-function' ? 'y = −2x + 3: линия убывает' : id === 'parabola' ? 'Вершина (2; −3), ось симметрии x = 2' : 'Корни 2 и 3 — пересечения с осью Ox'}</Text></>;
  } else if (id === 'signed' || id === 'inequality') picture = <Axis inequality={id === 'inequality'} />;
  else if (id === 'arithmetic-sequence') picture = <Bars values={[3, 7, 11, 15, 19]} names={['a₁', 'a₂', 'a₃', 'a₄', 'a₅']} caption="Каждый следующий столбик выше на 4" />;
  else if (id === 'geometric-sequence') picture = <Bars values={[5, 10, 20, 40]} names={['b₁', 'b₂', 'b₃', 'b₄']} caption="Каждый следующий столбик в 2 раза выше" />;
  else if (id === 'fractions-add') picture = <View style={{ gap: 7 }}>{['1/4 = 3/12', '1/6 = 2/12', 'Сумма 5/12'].map((caption, row) => <View key={row}><Text style={text}>{caption}</Text><View style={{ flexDirection: 'row', gap: 2, marginTop: 5 }}>{Array.from({ length: 12 }, (_, i) => <View key={i} style={{ flex: 1, height: 20, backgroundColor: i < [3, 2, 5][row] ? row === 1 ? '#E7BB55' : colors.blue : colors.border, borderRadius: 2 }} />)}</View></View>)}</View>;
  else if (id === 'fractions-divide') picture = <><Text style={text}>18 предметов распределены в 3 равные группы</Text><View style={{ flexDirection: 'row', gap: 7, marginTop: 12 }}>{[0, 1, 2].map(g => <View key={g} style={{ flex: 1, backgroundColor: colors.white, borderRadius: 10, padding: 7 }}><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 4, justifyContent: 'center' }}>{[0, 1, 2, 3, 4, 5].map(n => <View key={n} style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: n < 4 ? colors.blue : '#E7BB55' }} />)}</View><Text style={[text, { marginTop: 8 }]}>4 + 2 = 6</Text></View>)}</View></>;
  else if (id === 'fraction-product') picture = <><Text style={text}>15/8 — одна целая и семь восьмых</Text>{[0, 1].map(row => <View key={row} style={{ flexDirection: 'row', gap: 3, marginTop: 7 }}>{Array.from({ length: 8 }, (_, col) => <View key={col} style={{ flex: 1, height: 24, borderRadius: 3, backgroundColor: row === 0 ? colors.blue : col < 7 ? '#70B99B' : colors.white, borderWidth: 1, borderColor: colors.border }} />)}</View>)}</>;
  else if (id === 'percent' || id === 'probability-opposite') {
    const count = id === 'percent' ? 15 : 4;
    picture = <><Text style={text}>{id === 'percent' ? '15 из 100 равных долей: 15%' : '4% бракованных, 96% годных'}</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', width: 160, alignSelf: 'center', gap: 2, marginTop: 12 }}>{Array.from({ length: 100 }, (_, i) => <View key={i} style={{ width: 14, height: 14, borderRadius: 2, backgroundColor: i < count ? id === 'percent' ? colors.blue : colors.red : id === 'percent' ? colors.border : '#A2D7BC' }} />)}</View></>;
  } else if (id === 'percent-change') picture = <View style={{ gap: 9 }}>{[['Было', 1000], ['+20%', 1200], ['−20% от новой', 960]].map(([name, value], i) => <View key={i}><Text style={text}>{name}</Text><View style={{ width: `${Number(value) / 1200 * 100}%`, backgroundColor: i === 2 ? colors.mint : colors.bluePale, borderRadius: 8, padding: 7, marginTop: 4 }}><Text style={text}>{value} руб.</Text></View></View>)}</View>;
  else if (id === 'speed') picture = <><Text style={text}>180 км за 3 часа при постоянной скорости</Text><View style={{ flexDirection: 'row', gap: 3, marginTop: 15 }}>{[1, 2, 3].map(i => <View key={i} style={{ flex: 1 }}>{box('60 км')}<Text style={text}>{i}-й час</Text></View>)}</View></>;
  else if (id === 'brackets' || id === 'zero-product' || id === 'vieta') picture = <View style={{ gap: 9 }}>
    {box(id === 'brackets' ? '−3(x − 4)' : id === 'zero-product' ? 'x(x − 6) = 0' : 'Корни: 3 и 4')}
    <View style={{ flexDirection: 'row', justifyContent: 'space-around' }}><Text style={text}>↙</Text><Text style={text}>↘</Text></View>
    <View style={{ flexDirection: 'row', gap: 7 }}>{box(id === 'brackets' ? '(−3) · x\n−3x' : id === 'zero-product' ? 'x = 0' : '3 + 4 = 7')}{box(id === 'brackets' ? '(−3) · (−4)\n+12' : id === 'zero-product' ? 'x − 6 = 0\nx = 6' : '3 · 4 = 12', colors.mint)}</View>
    <Text style={text}>{id === 'brackets' ? 'Множитель относится к каждому слагаемому' : id === 'zero-product' ? 'Два случая соединяются словом «или»' : 'Сумма и произведение задают пару корней'}</Text>
  </View>;
  else if (id === 'powers') picture = <><Text style={text}>2³ · 2⁴ — семь множителей 2</Text><View style={{ flexDirection: 'row', gap: 4, justifyContent: 'center', marginTop: 15 }}>{Array.from({ length: 7 }, (_, i) => <View key={i} style={{ width: 25, paddingVertical: 9, borderRadius: 6, backgroundColor: i < 3 ? colors.amber : colors.bluePale }}>{label('2')}</View>)}</View><Text style={[text, { marginTop: 12 }]}>3 + 4 = 7, поэтому результат 2⁷</Text></>;
  else if (id === 'root-square' || id === 'square-sum' || id === 'difference-squares') {
    const side = 160, ratio = id === 'square-sum' ? 20 / 23 : 29 / 31;
    picture = <View style={{ alignItems: 'center' }}><View style={{ width: side, height: side, backgroundColor: colors.bluePale, borderWidth: 1, borderColor: colors.blue, position: 'relative' }}>
      {id === 'root-square' ? <Text style={[text, { position: 'absolute', top: 65, left: 0, right: 0, fontSize: 23 }]}>144</Text> : id === 'square-sum' ? <>
        <View style={{ position: 'absolute', left: 0, top: 0, width: side * ratio, height: side * ratio, justifyContent: 'center', backgroundColor: '#DDE8FF' }}>{label('20² = 400')}</View>
        <View style={{ position: 'absolute', right: 0, top: 0, width: side * (1 - ratio), height: side * ratio, backgroundColor: colors.amber, justifyContent: 'center' }}>{label('60')}</View>
        <View style={{ position: 'absolute', left: 0, bottom: 0, width: side * ratio, height: side * (1 - ratio), backgroundColor: colors.amber, justifyContent: 'center' }}>{label('60')}</View>
        <View style={{ position: 'absolute', right: 0, bottom: 0, width: side * (1 - ratio), height: side * (1 - ratio), backgroundColor: colors.mint, justifyContent: 'center' }}>{label('9')}</View>
      </> : <><View style={{ position: 'absolute', right: 0, top: 0, width: side * ratio, height: side * ratio, backgroundColor: colors.white, justifyContent: 'center' }}>{label('29²')}</View><Text style={[text, { position: 'absolute', bottom: 0, left: 10, fontSize: 10 }]}>Оставшаяся площадь: 31² − 29²</Text></>}
    </View><Text style={[text, { marginTop: 10 }]}>{id === 'root-square' ? 'Площадь 144 → положительная сторона 12' : id === 'square-sum' ? '(20 + 3)² = 400 + 60 + 60 + 9' : 'Разность квадратов даёт площадь двух полос'}</Text></View>;
  } else if (id === 'probability') picture = <><Text style={text}>Выбор одного из 10 равновозможных шаров</Text><View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 9, alignSelf: 'center', width: 156, marginTop: 14 }}>{Array.from({ length: 10 }, (_, i) => <View key={i} style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: i < 3 ? colors.red : colors.blue }} />)}</View><Text style={[text, { marginTop: 10 }]}>Красных 3: P = 3/10 = 0,3</Text></>;
  else return null;
  return <View style={{ marginTop: 17, backgroundColor: '#F7F9FC', padding: 11, borderRadius: 16 }}>{picture}</View>;
}
