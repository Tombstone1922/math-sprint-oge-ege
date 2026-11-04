import React from 'react';
import { Text, View, useWindowDimensions } from 'react-native';
import { colors } from './theme';
import type { VectorDrawing } from './vector-drawing';
export function DiagramCanvas({ drawing, label, testID = 'diagram', large = false }: { drawing: VectorDrawing; label: string; testID?: string; large?: boolean }) {
  const { width } = useWindowDimensions(), scale = large ? 1.4 : Math.min(1, (width - 86) / drawing.width);
  return <View testID={testID} accessible accessibilityLabel={label} style={{ width: drawing.width * scale, height: drawing.height * scale, backgroundColor: colors.white }}>
    {drawing.items.map((p, i) => p.kind === 'line' ? <View key={i} style={{ position: 'absolute', left: (p.x1 + p.x2) / 2 * scale - (Math.hypot(p.x2 - p.x1, p.y2 - p.y1) * scale + .8) / 2, top: (p.y1 + p.y2) / 2 * scale - p.weight * scale / 2, width: Math.hypot(p.x2 - p.x1, p.y2 - p.y1) * scale + .8, height: Math.max(.6, p.weight * scale), backgroundColor: p.stroke, transform: [{ rotate: `${Math.atan2(p.y2 - p.y1, p.x2 - p.x1)}rad` }] }} /> : p.kind === 'text' ? <Text key={i} allowFontScaling={false} style={{ position: 'absolute', left: (p.x - p.width / 2) * scale, top: (p.y - 10) * scale, width: p.width * scale, fontSize: p.size * scale, lineHeight: p.size * 1.25 * scale, textAlign: 'center', color: p.color, fontWeight: p.bold ? '700' : '400' }}>{p.value}</Text> : p.kind === 'rect' ? <View key={i} style={{ position: 'absolute', left: p.x * scale, top: p.y * scale, width: p.width * scale, height: p.height * scale, borderWidth: p.weight * scale, borderColor: p.stroke, borderRadius: p.radius * scale, backgroundColor: p.fill }} /> : <View key={i} style={{ position: 'absolute', left: (p.x - p.r) * scale, top: (p.y - p.r) * scale, width: 2 * p.r * scale, height: 2 * p.r * scale, borderRadius: p.r * scale, borderWidth: 1.5 * scale, borderColor: colors.navy, backgroundColor: p.fill ?? colors.white }} />)}
  </View>;
}
