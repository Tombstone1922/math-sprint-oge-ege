import React, { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { Button, Pill, ProgressBar, Screen, type } from '../components';
import { s } from '../subject-ui';
import { physicsCourse } from '../science/courses';
import { CourseBack, courseRouteFor } from '../science/ui';
import { PhysicsTaskCard, PhysicsSolution, PhysicsTaskSources } from '../science/task-ui';
export default function SubjectLesson() {
  const { course: id } = useLocalSearchParams<{ course?: string }>(), [index, setIndex] = useState(0), course = physicsCourse(id);
  if (!course) return <Screen><CourseBack /><Text style={type.title}>Урок пока недоступен</Text></Screen>;
  const example = index === course.lesson.length, page = course.lesson[index], task = course.tasks[0], options = task.options.map(o => o.id);
  return <Screen key={`${course.id}-${index}`} footer={<Button title={example ? 'К группам физики →' : 'Следующий шаг →'} onPress={() => example ? router.dismissTo(courseRouteFor(course.id)) : setIndex(index + 1)} />}><CourseBack course={course.id} /><Pill tone="mint">ФИЗИКА · ОГЭ №{course.number} · УРОК</Pill><View style={{ marginTop: 16 }}><ProgressBar current={index + 1} total={course.lesson.length + 1} /></View><Text style={s.small}>Шаг {index + 1} из {course.lesson.length + 1}</Text>
    <Text accessibilityRole="header" style={[type.title, { marginTop: 22 }]}>{example ? 'Пример с разбором' : page.title}</Text>{example ? <><View style={s.card}><PhysicsTaskCard task={task} options={options} /></View><PhysicsSolution task={task} options={options} /><PhysicsTaskSources task={task} /></> : <><Text style={s.body}>{page.text}</Text>{page.example && <View style={s.card}><Text style={s.title}>{page.example}</Text></View>}</>}
  </Screen>;
}
