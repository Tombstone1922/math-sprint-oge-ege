import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Button, PageHeader, Screen } from './components';
import { StudyModal } from './motion';
import { colors, layout, radius, surface } from './theme';

function ConditionButton({ children, compact = false }: { children: React.ReactNode; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  return <>
    <Pressable accessibilityRole="button" accessibilityLabel="Условие и рисунок" onPress={() => setOpen(true)} style={({ pressed }) => [styles.condition, !compact && styles.conditionTile, pressed && surface.pressed]}>
      <Text style={styles.conditionText}>{compact ? 'Условие и рисунок' : 'Условие\nи рисунок'}</Text>
    </Pressable>
    <StudyModal visible={open} onRequestClose={() => setOpen(false)}>
      <Screen modal footer={<Button title="Вернуться к решению" onPress={() => setOpen(false)} />}>
        <PageHeader label="МАТЕРИАЛЫ ЗАДАНИЯ" title="Условие задачи" />
        {children}
      </Screen>
    </StudyModal>
  </>;
}
export function TaskActions({ title, onPress, disabled = false, condition, answer }: { title: string; onPress: () => void; disabled?: boolean; condition?: React.ReactNode; answer?: string }) {
  return <>
    {answer !== undefined && <Text accessibilityLiveRegion="polite" style={styles.answer}>Ответ: {answer || '…'}</Text>}
    <View style={[styles.row, { marginTop: 12 }]}>
      {condition && <ConditionButton>{condition}</ConditionButton>}
      <Button title={title} disabled={disabled} onPress={onPress} style={styles.submit} />
    </View>
  </>;
}
export function AssessmentActions({ condition, actions }: { condition: React.ReactNode; actions: { title: string; disabled?: boolean; onPress: () => void }[] }) {
  return <>
    <ConditionButton compact>{condition}</ConditionButton>
    <View style={styles.row}>
      {actions.map((action, index) => <Pressable key={action.title} accessibilityRole="button" accessibilityLabel={action.title} accessibilityState={{ disabled: !!action.disabled }} disabled={action.disabled} onPress={action.onPress} style={({ pressed }) => [styles.score, index === 0 && styles.scorePrimary, action.disabled && styles.scoreDisabled, pressed && surface.pressed]}>
        <Text style={[styles.scoreText, { color: action.disabled ? colors.muted : index === 0 ? colors.white : colors.navy }]}>{action.title}</Text>
      </Pressable>)}
    </View>
  </>;
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'stretch', gap: 8 },
  condition: { minHeight: layout.hitTarget, alignItems: 'center', justifyContent: 'center', padding: 6 },
  conditionTile: { ...surface.field, width: 86 },
  conditionText: { color: colors.blue, fontSize: 12, lineHeight: 17, fontWeight: '700', textAlign: 'center' },
  answer: { fontSize: 15, lineHeight: 22, color: colors.ink, fontWeight: '700', paddingTop: 9 },
  submit: { flex: 1, marginTop: 0 },
  score: { ...surface.field, flex: 1, minHeight: 54, padding: 7, alignItems: 'center', justifyContent: 'center' },
  scorePrimary: { backgroundColor: colors.blue, borderColor: colors.blue, borderRadius: radius.field },
  scoreDisabled: { backgroundColor: colors.background, borderColor: colors.border },
  scoreText: { fontSize: 12, lineHeight: 18, fontWeight: '700', textAlign: 'center' },
});
