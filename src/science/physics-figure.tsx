import { DiagramCanvas } from '../diagram-canvas';
import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, Text, View, useWindowDimensions } from 'react-native';
import { Button, Screen, type } from '../components';
import { colors } from '../theme';
import { s } from '../subject-ui';
import { fmt, type PhysicsFigure as Figure } from './physics-model';
import { physicsDrawing } from './physics-drawing';
function Canvas({ figure, large = false }: { figure: Figure; large?: boolean }) {
  const label = `${figure.caption} ${figure.kind === 'plot' ? `Ось ${figure.xLabel}; ось ${figure.yLabel}. Деления: ${figure.xTicks.map(fmt).join('; ')} по горизонтали, ${figure.yTicks.map(fmt).join('; ')} по вертикали.${figure.curves ? ' Кривая 1 — сплошная, кривая 2 — штриховая.' : ''}` : 'Для деталей открой увеличенный рисунок.'}`;
  return <DiagramCanvas drawing={physicsDrawing(figure)} label={label} testID="physics-figure" large={large} />;
}
export function PhysicsFigure({ figure }: { figure: Figure }) {
  const [open, setOpen] = useState(false), { width, fontScale } = useWindowDimensions();
  if (figure.kind === 'table') {
    const available = Math.max(200, width - 86), tableWidth = Math.max(available, figure.headers.length * 92 * Math.max(1, fontScale));
    return <View style={{ marginTop: 14 }}><Text style={s.small}>{figure.caption}</Text>{tableWidth > available && <Text style={s.small}>Прокрути таблицу по горизонтали, чтобы увидеть все столбцы.</Text>}<ScrollView horizontal nestedScrollEnabled style={{ marginTop: 8 }}><View style={{ width: tableWidth }}>{[figure.headers, ...figure.rows].map((row, i) => <View key={i} style={{ flexDirection: 'row', backgroundColor: i ? colors.white : colors.bluePale }}>{row.map((cell, j) => <Text key={j} style={[s.body, { flex: 1, minWidth: 0, marginTop: 0, padding: 10, borderWidth: .5, borderColor: colors.border, textAlign: 'center', color: colors.ink }]}>{cell}</Text>)}</View>)}</View></ScrollView></View>;
  }
  return <View style={{ marginTop: 16 }}><Pressable accessibilityRole="button" accessibilityLabel="Увеличить рисунок по физике" onPress={() => setOpen(true)} style={({ pressed }) => [{ alignSelf: 'center', borderWidth: 1, borderColor: colors.border, borderRadius: 12, overflow: 'hidden', backgroundColor: colors.white }, pressed && s.pressed]}><Canvas figure={figure} /></Pressable><Text style={s.small}>{figure.caption}</Text><Button secondary title="Увеличить рисунок ↗" onPress={() => setOpen(true)} /><Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}><Screen modal footer={<Button title="Вернуться к заданию" onPress={() => setOpen(false)} />}><Text style={type.section}>Рисунок к заданию</Text><Text style={s.body}>{figure.caption}</Text><Text style={s.small}>Крупный рисунок можно прокручивать по горизонтали.</Text><ScrollView horizontal nestedScrollEnabled style={{ marginTop: 18 }}><Canvas figure={figure} large /></ScrollView></Screen></Modal></View>;
}
