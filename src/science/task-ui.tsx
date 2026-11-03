import React from 'react';
import { Pressable, Text, View } from 'react-native';
import * as Linking from 'expo-linking';
import { Disclosure } from '../components';
import { s } from '../subject-ui';
import { colors } from '../theme';
import { physicsSolution } from './courses';
import type { PhysicsTask } from './physics-model';
import { PhysicsFigure } from './physics-figure';
export function PhysicsTaskCard({ task, options, input, onOption }: { task: PhysicsTask; options: string[]; input?: string; onOption?: (digit: string) => void }) {
  return <View testID="physics-task"><Text style={[s.title, { marginBottom: 10 }]}>{task.prompt}</Text>
    {task.kind === 'cloze' && <Text style={s.small}>Вставь слова в пропуски А, Б, В, Г. Цифры могут повторяться.</Text>}
    {task.kind === 'matching' && task.targets.map((target, i) => <View key={i} style={{ flexDirection: 'row', gap: 10, paddingVertical: 9 }}><Text style={s.title}>{'АБВГ'[i]})</Text><Text style={[s.body, { flex: 1, minWidth: 0, marginTop: 0, color: colors.ink }]}>{target}</Text></View>)}
    {task.figure && <PhysicsFigure figure={task.figure} />}
    {task.unit && <Text style={[s.body, { color: colors.navy, fontWeight: '700' }]}>Ответ в {task.unit === 'номер' ? 'виде номера' : task.unit}. Единицу вводить не нужно.</Text>}
    {options.length > 0 && <View style={{ marginTop: 12 }}>{options.map((id, i) => {
      const selected = task.kind === 'choice' && input === String(i + 1), text = task.options.find(o => o.id === id)!.text;
      const content = <><Text style={[s.title, { minWidth: 22 }]}>{i + 1})</Text><Text style={[s.body, { flex: 1, minWidth: 0, marginTop: 0, color: colors.ink }]}>{text}</Text></>;
      return onOption ? <Pressable accessibilityRole="button" accessibilityLabel={`Выбрать вариант ${i + 1}: ${text}`} accessibilityState={{ selected }} key={id} onPress={() => onOption(String(i + 1))} style={({ pressed }) => [{ flexDirection: 'row', gap: 9, minHeight: 50, padding: 11, borderWidth: 1, borderRadius: 12, borderColor: selected ? colors.blue : colors.border, backgroundColor: selected ? colors.bluePale : colors.white, marginTop: 8 }, pressed && s.pressed]}>{content}</Pressable> : <View key={id} style={{ flexDirection: 'row', gap: 9, paddingVertical: 9 }}>{content}</View>;
    })}</View>}
  </View>;
}
export function PhysicsSolution({ task, options }: { task: PhysicsTask; options: string[] }) {
  return <View testID="physics-solution" style={[s.notice, { backgroundColor: colors.mint }]}><Text style={s.title}>Разбор решения</Text>{physicsSolution(task, options).map((text, i) => <Text key={i} style={s.body}>{text}</Text>)}</View>;
}
export function PhysicsTaskSources({ task }: { task: PhysicsTask }) {
  const [error, setError] = React.useState(false);
  const open = (url: string) => { setError(false); void Linking.openURL(url).catch(() => setError(true)); };
  return <Disclosure title="Примеры «Решу ОГЭ» по этой теме"><Text style={s.small}>Учебная карточка составлена по модели задания. По ссылкам — исходные примеры сайта.</Text><Pressable accessibilityRole="link" onPress={() => open(`https://phys-oge.sdamgia.ru/test?category_id=${task.category}&filter=all`)} style={s.sourceLink}><Text style={s.link}>Открыть раздел №{task.number} ↗</Text></Pressable>{task.sourceIds.slice(0, 3).map(id => <Pressable key={id} accessibilityRole="link" onPress={() => open(`https://phys-oge.sdamgia.ru/problem?id=${id}`)} style={s.sourceLink}><Text style={s.link}>Пример №{id} ↗</Text></Pressable>)}{error && <Text accessibilityLiveRegion="polite" style={s.body}>Не удалось открыть источник. Проверь подключение.</Text>}</Disclosure>;
}
