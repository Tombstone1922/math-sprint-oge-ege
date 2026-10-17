import React, { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View, useWindowDimensions } from 'react-native';
import type { DataTable, PracticalBlock, PracticalQuestion } from './practical-models';
import { practicalDrawing } from './practical-drawing';
import { colors } from './theme';
import { Button, Pill, Screen, type } from './components';

function Drawing({ block, enlarged = false }: { block: PracticalBlock; enlarged?: boolean }) {
  const { width } = useWindowDimensions();
  const drawing = useMemo(() => practicalDrawing(block.scene), [block.scene]);
  const scale = enlarged ? 1.2 : Math.min(1, (width - 100) / drawing.width);
  return <View accessible accessibilityLabel={`${block.title}. ${block.scene.kind === 'plan' ? `План на клетчатой сетке, сторона клетки ${block.scene.unit} м. Для чтения деталей откройте увеличенный рисунок.` : 'Размерные стрелки D, d, H и B на виде колеса и сечении.'}`} style={{ width: drawing.width * scale, height: drawing.height * scale, backgroundColor: colors.white }}>
    {drawing.items.map((p, i) => {
      if (p.kind === 'rect') return <View key={i} style={{ position: 'absolute', left: p.x * scale, top: p.y * scale, width: p.w * scale, height: p.h * scale, borderRadius: (p.radius ?? 0) * scale, backgroundColor: p.fill }} />;
      if (p.kind === 'circle') return <View key={i} style={{ position: 'absolute', left: (p.x - p.r) * scale, top: (p.y - p.r) * scale, width: p.r * 2 * scale, height: p.r * 2 * scale, borderRadius: p.r * scale, backgroundColor: p.fill, borderWidth: Math.max(.6, p.weight * scale), borderColor: p.stroke }} />;
      if (p.kind === 'text') return <Text key={i} numberOfLines={1} adjustsFontSizeToFit style={{ position: 'absolute', left: (p.x - 160) * scale, top: p.y * scale - Math.max(9, p.size * scale) * .65, width: 320 * scale, textAlign: 'center', fontSize: Math.max(9, p.size * scale), color: p.color, fontWeight: p.bold ? '800' : '400' }}>{p.value}</Text>;
      const length = Math.hypot(p.x2 - p.x1, p.y2 - p.y1) * scale, weight = Math.max(.5, p.weight * scale);
      return <View key={i} style={{ position: 'absolute', left: (p.x1 + p.x2) / 2 * scale - length / 2, top: (p.y1 + p.y2) / 2 * scale - weight / 2, width: length, height: weight, backgroundColor: p.stroke, transform: [{ rotate: `${Math.atan2(p.y2 - p.y1, p.x2 - p.x1)}rad` }] }} />;
    })}
  </View>;
}
function Table({ table }: { table: DataTable }) {
  return <View style={{ alignSelf: 'stretch', marginTop: 14 }}>
    {table.caption && <Text style={styles.tableCaption}>{table.caption}</Text>}
    <Text style={styles.caption}>Таблицу можно прокручивать вправо.</Text>
    <ScrollView horizontal nestedScrollEnabled><View style={{ width: table.headers.length * 130, borderWidth: 1, borderColor: '#CBD5E1' }}>{[table.headers, ...table.rows].map((row, i) => <View key={i} style={{ flexDirection: 'row', backgroundColor: i === 0 ? '#EEF2F7' : '#FFFFFF' }}>{row.map((value, j) => <Text key={j} style={[styles.cell, i === 0 && { fontWeight: '800' }]}>{value}</Text>)}</View>)}</View></ScrollView>
  </View>;
}
export function PracticalFigure({ block, question }: { block: PracticalBlock; question?: PracticalQuestion }) {
  const [open, setOpen] = useState(false), [expanded, setExpanded] = useState(question?.number === 1);
  return <View style={{ width: '100%', marginTop: 14 }}>
    <Pill tone="mint">{block.title.toUpperCase()}</Pill>
    <Text style={[styles.tableCaption, { marginTop: 14 }]}>Общее условие к заданиям 1–5</Text>
    <Text numberOfLines={expanded ? undefined : 4} style={styles.condition}>{block.text}</Text>
    <Pressable accessibilityRole="button" accessibilityLabel={expanded ? 'Свернуть общее условие' : 'Прочитать общее условие полностью'} onPress={() => setExpanded(v => !v)} style={styles.expand}><Text style={styles.expandText}>{expanded ? 'Свернуть условие ↑' : 'Прочитать полностью ↓'}</Text></Pressable>
    <Pressable accessibilityRole="button" accessibilityLabel="Открыть крупный рисунок" onPress={() => setOpen(true)} style={styles.preview}><Drawing block={block} /></Pressable>
    <Button secondary title="Крупный рисунок и условие ↗" onPress={() => setOpen(true)} />
    {block.table && <Table table={block.table} />}
    {question?.table && <Table table={question.table} />}
    <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}><Screen>
      <Button secondary title="Вернуться к вопросу" onPress={() => setOpen(false)} />
      <Text style={[type.section, { marginTop: 20 }]}>{block.title}</Text>
      <Text style={styles.condition}>{block.text}</Text>
      <Text style={styles.caption}>Крупный рисунок прокручивается по горизонтали.</Text>
      <ScrollView horizontal nestedScrollEnabled style={{ marginVertical: 12 }}><Drawing block={block} enlarged /></ScrollView>
      {block.table && <Table table={block.table} />}{question?.table && <Table table={question.table} />}
      <Button title="Вернуться к вопросу" onPress={() => setOpen(false)} />
    </Screen></Modal>
  </View>;
}
const styles = StyleSheet.create({ caption: { color: colors.muted, fontSize: 12, lineHeight: 18, marginVertical: 4 }, condition: { color: colors.ink, fontSize: 15, lineHeight: 23, marginTop: 10 }, tableCaption: { color: colors.navy, fontWeight: '800', fontSize: 14, lineHeight: 21 }, expand: { paddingVertical: 10, minHeight: 44, justifyContent: 'center' }, expandText: { color: colors.blue, fontWeight: '700', fontSize: 14 }, preview: { alignSelf: 'center', marginTop: 8, borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: colors.border }, cell: { width: 130, padding: 10, fontSize: 13, lineHeight: 18, color: colors.ink, borderWidth: .5, borderColor: '#CBD5E1', textAlign: 'center' } });
