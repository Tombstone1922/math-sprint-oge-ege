import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { Button, Screen } from './components';
import { plotLayout, plotNumber, type PlotLayout, type PlotPoint, type PlotRange } from './plot-layout';
import { colors } from './theme';

const background = '#FCFDFE', axisColor = '#526781';
export function PlotStroke({ a, b, color = colors.navy, weight = 1.5 }: { a: PlotPoint; b: PlotPoint; color?: string; weight?: number }) {
  const dx = b[0] - a[0], dy = b[1] - a[1], length = Math.hypot(dx, dy);
  // Axis-aligned lines stay centred on the exact coordinate, without a rotated thin rectangle.
  const geometry = Math.abs(dx) < 1e-8 ? { left: a[0] - weight / 2, top: Math.min(a[1], b[1]), width: weight, height: Math.abs(dy) }
    : Math.abs(dy) < 1e-8 ? { left: Math.min(a[0], b[0]), top: a[1] - weight / 2, width: Math.abs(dx), height: weight }
      : { left: (a[0] + b[0] - length - .7) / 2, top: (a[1] + b[1] - weight) / 2, width: length + .7, height: weight, transform: [{ rotate: `${Math.atan2(dy, dx)}rad` }] };
  return <View pointerEvents="none" style={{ position: 'absolute', backgroundColor: color, ...geometry }} />;
}
function CoordinatePlot({ layout: p, description, children }: { layout: PlotLayout; description: string; children: React.ReactNode }) {
  const [xmin, xmax, ymin, ymax] = p.range, px = p.pixel;
  const [ox, oy] = p.origin, right = px(xmax, 0)[0], top = px(0, ymax)[1];
  const labelStyle = { position: 'absolute' as const, color: axisColor, fontSize: p.fontSize, lineHeight: p.labelHeight, textAlign: 'center' as const, includeFontPadding: false };
  return <View testID="coordinate-plot" accessible accessibilityLabel={`${description} Оси x и y. Сторона клетки ${plotNumber(p.gridStep)} ед.; подписи через ${plotNumber(p.labelStep)} ед. Масштаб по осям одинаковый.`} style={{ width: p.width, height: p.height, backgroundColor: background, borderRadius: 10, alignSelf: 'center' }}>
    {p.xTicks.filter(n => n !== 0).map(n => <PlotStroke key={`gx${n}`} a={px(n, ymin)} b={px(n, ymax)} color="#DDE4ED" weight={.7} />)}
    {p.yTicks.filter(n => n !== 0).map(n => <PlotStroke key={`gy${n}`} a={px(xmin, n)} b={px(xmax, n)} color="#DDE4ED" weight={.7} />)}
    <PlotStroke a={px(xmin, 0)} b={[right + 7, oy]} color={axisColor} weight={1.3} />
    <PlotStroke a={px(0, ymin)} b={[ox, top - 7]} color={axisColor} weight={1.3} />
    <PlotStroke a={[right + 2, oy - 3]} b={[right + 7, oy]} color={axisColor} weight={1.3} />
    <PlotStroke a={[right + 2, oy + 3]} b={[right + 7, oy]} color={axisColor} weight={1.3} />
    <PlotStroke a={[ox - 3, top - 2]} b={[ox, top - 7]} color={axisColor} weight={1.3} />
    <PlotStroke a={[ox + 3, top - 2]} b={[ox, top - 7]} color={axisColor} weight={1.3} />
    {p.xTicks.filter(n => n !== 0).map(n => <PlotStroke key={`tx${n}`} a={[px(n, 0)[0], oy - 3]} b={[px(n, 0)[0], oy + 3]} color={axisColor} weight={1.1} />)}
    {p.yTicks.filter(n => n !== 0).map(n => <PlotStroke key={`ty${n}`} a={[ox - 3, px(0, n)[1]]} b={[ox + 3, px(0, n)[1]]} color={axisColor} weight={1.1} />)}
    {children}
    {[...p.xLabels, ...p.yLabels].map((label, i) => <Text key={i} testID="plot-label" allowFontScaling={false} style={{ ...labelStyle, left: label.x, top: label.y, width: label.width, height: label.height }}>{label.text}</Text>)}
    <Text testID="plot-origin" allowFontScaling={false} style={{ ...labelStyle, left: p.originLabel.x, top: p.originLabel.y, width: p.originLabel.width, height: p.originLabel.height, lineHeight: p.originLabel.height, fontSize: p.originLabel.fontSize }}>0</Text>
    <Text allowFontScaling={false} style={{ ...labelStyle, left: right + 9, top: oy - 19, fontSize: p.fontSize + 2, width: 13, height: 18, fontStyle: 'italic' }}>x</Text>
    <Text allowFontScaling={false} style={{ ...labelStyle, left: ox + 6, top: top - 23, fontSize: p.fontSize + 2, width: 13, height: 18, fontStyle: 'italic' }}>y</Text>
  </View>;
}
export function ResponsivePlot({ range, description, compact = false, title = 'График функции', children }: { range: PlotRange; description: string; compact?: boolean; title?: string; children: (layout: PlotLayout) => React.ReactNode }) {
  const { width: screenWidth } = useWindowDimensions();
  const [available, setAvailable] = useState(0), [open, setOpen] = useState(false);
  const width = Math.max(120, Math.min(compact ? 280 : 380, available || screenWidth - 104));
  const p = plotLayout(range, width, compact ? width : Math.max(264, Math.min(340, width * 1.08)));
  const zoom = plotLayout(range, Math.max(screenWidth - 44, (p.range[1] - p.range[0]) * 32 + 68), (p.range[3] - p.range[2]) * 32 + 58, true);
  return <View onLayout={e => setAvailable(e.nativeEvent.layout.width)} style={{ alignSelf: 'stretch', marginTop: 10, marginBottom: 8 }}>
    <CoordinatePlot layout={p} description={description}>{children(p)}</CoordinatePlot>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', columnGap: 8 }}>
      <Text style={{ color: colors.muted, fontSize: 12, lineHeight: 18 }}>Клетка: {plotNumber(p.gridStep)} ед.</Text>
      <Pressable accessibilityRole="button" accessibilityLabel={`Увеличить: ${title}`} onPress={() => setOpen(true)} style={{ minHeight: 44, justifyContent: 'center', paddingHorizontal: 4 }}><Text style={{ color: colors.blue, fontSize: 13, fontWeight: '700' }}>Увеличить ↗</Text></Pressable>
    </View>
    <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}><Screen modal footer={<Button secondary title="Вернуться к заданию" onPress={() => setOpen(false)} />}>
      <Text style={{ fontSize: 22, fontWeight: '800', color: colors.navy, marginTop: 10 }}>{title}</Text>
      <Text style={{ color: colors.muted, fontSize: 14, lineHeight: 21, marginVertical: 12 }}>Крупный график можно прокручивать вправо. Клетка: {plotNumber(zoom.gridStep)} ед.</Text>
      <ScrollView horizontal nestedScrollEnabled><CoordinatePlot layout={zoom} description={description}>{open && children(zoom)}</CoordinatePlot></ScrollView>
    </Screen></Modal>
  </View>;
}
