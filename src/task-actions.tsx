import React, { useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { Button, Screen, type } from './components';
import { colors } from './theme';

function ConditionButton({ children, compact = false }: { children: React.ReactNode; compact?: boolean }) {
  const [open, setOpen] = useState(false);
  return <><Pressable accessibilityRole="button" accessibilityLabel="Условие и рисунок" onPress={() => setOpen(true)} style={{ width: compact ? undefined : 88, minHeight: compact ? 38 : 56, marginTop: compact ? 0 : 12, borderWidth: compact ? 0 : 1, borderColor: colors.border, borderRadius: 15, alignItems: 'center', justifyContent: 'center', padding: 6 }}><Text style={{ color: colors.blue, fontSize: 12, lineHeight: 18, fontWeight: '700', textAlign: 'center' }}>{compact ? 'Условие и рисунок ↗' : 'Условие\nи рисунок ↗'}</Text></Pressable><Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}><Screen modal footer={<Button title="Вернуться к решению" onPress={() => setOpen(false)} />}><Text style={[type.section, { marginTop: 12 }]}>Условие задачи</Text>{children}</Screen></Modal></>;
}
export function TaskActions({ title, onPress, disabled = false, condition, answer }: { title: string; onPress: () => void; disabled?: boolean; condition?: React.ReactNode; answer?: string }) {
  return <>{answer !== undefined && <Text accessibilityLiveRegion="polite" style={{ fontSize: 15, lineHeight: 22, color: colors.ink, fontWeight: '700', paddingTop: 9 }}>Ответ: {answer || '…'}</Text>}<View style={{ flexDirection: 'row', alignItems: 'stretch', gap: 10 }}>
    {condition && <ConditionButton>{condition}</ConditionButton>}<View style={{ flex: 1 }}><Button title={title} disabled={disabled} onPress={onPress} /></View>
  </View></>;
}
export function AssessmentActions({ condition, actions }: { condition: React.ReactNode; actions: { title: string; disabled?: boolean; onPress: () => void }[] }) {
  return <><ConditionButton compact>{condition}</ConditionButton><View style={{ flexDirection: 'row', gap: 7 }}>{actions.map((action, index) => <Pressable key={action.title} accessibilityRole="button" accessibilityLabel={action.title} disabled={action.disabled} onPress={action.onPress} style={{ flex: 1, minHeight: 58, padding: 7, backgroundColor: index === 0 ? colors.blue : colors.white, borderColor: colors.border, borderWidth: 1, borderRadius: 13, alignItems: 'center', justifyContent: 'center', opacity: action.disabled ? .4 : 1 }}><Text style={{ color: index === 0 ? colors.white : colors.navy, fontSize: 12, lineHeight: 18, fontWeight: '700', textAlign: 'center' }}>{action.title}</Text></Pressable>)}</View></>;
}
