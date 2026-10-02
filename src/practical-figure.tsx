import React, { useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { PracticalBlock, PracticalScene } from './oge-practical';
import { colors } from './theme';
import { Button, Screen, type } from './components';

function Drawing({ scene, enlarged = false }: { scene: PracticalScene; enlarged?: boolean }) {
  if (scene.kind === 'tyre') return <View accessible accessibilityLabel={`Схема колеса: B — ширина ${scene.width} мм, H — боковина ${scene.ratio}% ширины, d — диаметр диска ${scene.rim} дюймов, D — внешний диаметр`} style={{ width: enlarged ? 420 : 240, alignItems: 'center', paddingVertical: 18 }}>
    <View style={styles.tyre}><View style={styles.rim}><Text style={styles.label}>d</Text></View><Text style={styles.side}>H</Text></View>
    <Text style={styles.caption}>D — весь диаметр · d — диск</Text><Text style={styles.caption}>H — боковина · B — ширина</Text><Text style={styles.label}>{scene.width}/{scene.ratio} R{scene.rim}</Text>
  </View>;
  const cell = enlarged ? 28 : Math.min(18, 230 / scene.width);
  const width = scene.width * cell, height = scene.height * cell;
  return <View style={{ paddingVertical: 12, alignItems: 'center' }}>
    <View accessible accessibilityLabel={`План ${scene.width} на ${scene.height} клеток; клетка ${scene.unit} м. ${scene.rooms.map(r => `Объект ${r.label}: ${r.w} на ${r.h} клеток`).join('. ')}`} style={{ width, height, backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: colors.ink }}>
      {Array.from({ length: scene.width - 1 }, (_, i) => <View key={`x${i}`} style={{ position: 'absolute', left: (i + 1) * cell - 2, top: 0, height: height - 4, width: 1, backgroundColor: '#CFD8E1' }} />)}
      {Array.from({ length: scene.height - 1 }, (_, i) => <View key={`y${i}`} style={{ position: 'absolute', top: (i + 1) * cell - 2, left: 0, width: width - 4, height: 1, backgroundColor: '#CFD8E1' }} />)}
      {scene.rooms.map(room => <View key={room.label} style={{ position: 'absolute', left: room.x * cell - 2, top: room.y * cell - 2, width: room.w * cell, height: room.h * cell, borderWidth: 2, borderColor: colors.ink, alignItems: 'center', justifyContent: 'center' }}><Text style={styles.roomLabel}>{room.label}</Text></View>)}
    </View>
    <Text style={styles.caption}>1 клетка = {String(scene.unit).replace('.', ',')} м · {scene.width} × {scene.height} клеток</Text>
  </View>;
}
function DataTable({ table }: { table: NonNullable<PracticalBlock['table']> }) {
  return <View style={styles.table}>{[table.headers, ...table.rows].map((row, i) => <View key={i} style={styles.row}>{row.map((text, j) => <Text key={j} style={[styles.cell, i === 0 && styles.header]}>{text}</Text>)}</View>)}</View>;
}
export function PracticalFigure({ block }: { block: PracticalBlock }) {
  const [open, setOpen] = useState(false);
  return <View style={{ width: '100%', alignItems: 'center', marginTop: 12 }}>
    <Pressable accessibilityRole="button" accessibilityLabel="Увеличить рисунок и открыть общее условие" onPress={() => setOpen(true)}><Drawing scene={block.scene} /></Pressable>
    <Button secondary title="Условие и рисунок ↗" onPress={() => setOpen(true)} />
    <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
      <Screen><Button secondary title="Закрыть условие" onPress={() => setOpen(false)} /><Text style={[type.section, { marginTop: 20 }]}>{block.title}</Text><Text style={[type.body, { marginVertical: 16, color: colors.ink }]}>{block.text}</Text>
        <Text style={styles.caption}>Большой рисунок можно прокручивать по горизонтали.</Text><ScrollView horizontal><Drawing scene={block.scene} enlarged /></ScrollView>
        {block.table && <DataTable table={block.table} />}
        <Text style={[type.body, { marginTop: 15 }]}>Общее условие относится ко всем пяти вопросам этого варианта.</Text><Button title="Вернуться к вопросу" onPress={() => setOpen(false)} />
      </Screen>
    </Modal>
  </View>;
}
const styles = StyleSheet.create({ label: { fontSize: 18, fontWeight: '800', color: colors.ink }, roomLabel: { fontSize: 17, fontWeight: '800', color: colors.ink, backgroundColor: '#FFFFFF', paddingHorizontal: 3 }, caption: { fontSize: 12, lineHeight: 18, color: colors.muted, marginTop: 6 }, tyre: { width: 172, height: 172, borderRadius: 86, borderWidth: 25, borderColor: '#63768B', justifyContent: 'center', alignItems: 'center' }, rim: { width: 110, height: 110, borderRadius: 55, borderWidth: 2, borderColor: colors.ink, alignItems: 'center', justifyContent: 'center', backgroundColor: '#EFF3F7' }, side: { position: 'absolute', top: -24, color: '#FFFFFF', fontWeight: '800' }, table: { marginTop: 15, borderWidth: 1, borderColor: colors.border }, row: { flexDirection: 'row' }, cell: { flex: 1, padding: 8, borderWidth: 0.5, borderColor: colors.border, color: colors.ink, fontSize: 13, textAlign: 'center' }, header: { backgroundColor: colors.bluePale, fontWeight: '800' } });
