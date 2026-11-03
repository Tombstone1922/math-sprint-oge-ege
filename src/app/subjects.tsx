import React from 'react';
import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { Back, Screen, type } from '../components';
import { searchSubjectModules, subjects } from '../subjects';
import { SubjectIcon, s } from '../subject-ui';
import { colors } from '../theme';

export default function Subjects() {
  return <Screen><Back /><Text style={type.eyebrow}>ПОДГОТОВКА К ЭКЗАМЕНАМ</Text><Text accessibilityRole="header" style={[type.title, { marginTop: 10 }]}>Выбери предмет</Text><Text style={[type.body, { marginTop: 10 }]}>Математику уже можно тренировать. В физике доступны номера ОГЭ 1–20. Другие номера и информатика пополнятся постепенно.</Text>
    {subjects.map(subject => <Pressable key={subject.id} accessibilityRole="button" accessibilityLabel={`Открыть предмет: ${subject.title}`} onPress={() => subject.id === 'math' ? router.dismissTo('/topics') : router.push({ pathname: '/subject', params: { subject: subject.id, exam: 'oge' } })} style={({ pressed }) => [s.card, pressed && s.pressed]}>
      <View style={s.row}><SubjectIcon subject={subject.id} /><View style={{ flex: 1 }}><Text style={s.title}>{subject.title}</Text><Text style={[s.small, { color: colors.navy }]}>{subject.status === 'ready' ? 'Практика доступна' : searchSubjectModules(subject.id, 'oge').some(m => m.status === 'ready') ? 'Доступны ОГЭ №1–20' : 'Раздел в разработке'}</Text></View><Text style={{ color: colors.blue, fontSize: 24 }}>›</Text></View>
      <Text style={s.body}>{subject.subtitle}</Text><Text style={s.small}>{subject.id === 'math' ? 'Готовые модули и полный пробник ОГЭ. Базовые навыки для ЕГЭ.' : `ОГЭ: №1–${searchSubjectModules(subject.id, 'oge').length} · ЕГЭ: №1–${searchSubjectModules(subject.id, 'ege').length}`}</Text>
    </Pressable>)}
    <View style={s.notice}><Text style={s.title}>Один предмет — свой маршрут</Text><Text style={s.body}>Готовые модули отмечены в карте. Для остальных номеров можно посмотреть план будущего обучения.</Text></View>
  </Screen>;
}
