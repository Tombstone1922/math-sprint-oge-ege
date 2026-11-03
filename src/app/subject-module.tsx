import React from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { Back, Button, Pill, Screen, type } from '../components';
import { examTitles, formatTitles, subjectModule, subjects } from '../subjects';
import { SubjectSources, subjectTint, s } from '../subject-ui';
import { PhysicsOverview } from '../science/overview';

export default function SubjectModule() {
  const params = useLocalSearchParams<{ subject?: string; exam?: string; number?: string }>();
  const module = subjectModule(params.subject, params.exam, params.number);
  if (!module) return <Screen><Back /><Text style={type.title}>Такого модуля пока нет</Text><Text style={s.body}>Проверь предмет, экзамен и номер в карте подготовки.</Text><Button title="Выбрать предмет" onPress={() => router.replace('/subjects')} /></Screen>;
  if (module.courseId) return <PhysicsOverview key={module.courseId} courseId={module.courseId} />;
  const subject = subjects.find(s => s.id === module.subject)!;
  const stages = [
    ['Короткий урок', 'Главная идея, обозначения и типичные ошибки.'],
    ['Примеры с разбором', module.subject === 'physics' ? 'Наглядные схемы, рисунки и объяснение каждого шага.' : 'Таблицы, схемы и пошаговое выполнение алгоритмов.'],
    ['Тренировка', module.format === 'program' ? 'Практика составления и проверки программ.' : module.format === 'file' ? 'Задания с учебными файлами и проверкой результата.' : module.format === 'experiment' ? 'Подготовка к опыту: план, измерения и выводы.' : 'Карточки без готового ответа с постепенными подсказками.'],
    ['Закрепление', 'Разбор ошибок и возвращение к трудным заданиям.'],
  ];
  return <Screen><Back /><Pill tone={module.subject === 'physics' ? 'mint' : 'amber'}>{subject.title.toUpperCase()} · {examTitles[module.exam]} · №{module.number}</Pill>
    <Text accessibilityRole="header" style={[type.title, { marginTop: 20 }]}>{module.title}</Text><Text style={s.body}>{formatTitles[module.format]}{module.part ? ` · часть ${module.part}` : ''}</Text>
    <View style={[s.notice, { backgroundColor: subjectTint(module.subject) }]}><Text style={s.title}>Модуль готовится</Text><Text style={s.body}>Здесь пока план будущего обучения. Урок и задачи появятся после подготовки и проверки материалов.</Text></View>
    <View style={s.card}><Text style={s.title}>Что будем разбирать</Text><Text style={s.body}>{module.focus}</Text>{module.note && <Text style={s.body}>{module.note}</Text>}</View>
    <Text style={[type.section, { marginTop: 26 }]}>Как будет устроен модуль</Text>
    {stages.map(([title, text], i) => <View key={title} style={[s.card, { marginTop: 10 }]}><View style={s.row}><View style={[s.number, { backgroundColor: subjectTint(module.subject) }]}><Text style={s.badge}>{i + 1}</Text></View><Text style={[s.title, { flex: 1 }]}>{title}</Text></View><Text style={s.body}>{text}</Text></View>)}
    <Text style={[s.small, { marginTop: 22 }]}>Материалов для запуска ещё нет</Text><Button disabled title="Урок скоро появится" onPress={() => {}} /><Button disabled secondary title="Тренировка скоро появится" onPress={() => {}} />
    <Button secondary title={`К карте ${examTitles[module.exam]}`} onPress={() => router.dismissTo({ pathname: '/subject', params: { subject: module.subject, exam: module.exam } })} />
    <SubjectSources subject={module.subject} exam={module.exam} />
  </Screen>;
}
