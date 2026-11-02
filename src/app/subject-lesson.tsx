import React, { useState } from 'react';
import { router, useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { Button, Disclosure, Pill, ProgressBar, Screen, type } from '../components';
import { SubjectSources, s } from '../subject-ui';
import { scienceCourse, physicsTasks } from '../science/bank';
import { CourseBack, courseRoute, MatchingCard, MatchingSolution, UnitsReference } from '../science/ui';
const pages = [
  { title: 'Что измеряем — и в чём', text: 'Давление — физическая величина, килограмм — единица, линейка — прибор, диффузия — явление. Масса — величина, килограмм — единица её измерения. Сначала прочитай название величины, затем ищи единицу. Вес — сила: его измеряют в ньютонах, а не в килограммах.', example: 'Масса → килограмм → кг\nВес → ньютон → Н' },
  { title: 'Вспомни формулу', text: 'Если единица забылась, подставь в знакомую формулу единицы вместо чисел. Мощность — работа за время: джоуль в секунду называется ваттом. Ускорение — изменение скорости за время: (м/с)/с = м/с².', example: 'P = A/t → Дж/с = Вт\nF = ma → кг·м/с² = Н' },
  { title: 'Различай похожие величины', text: 'Работа и энергия измеряются в джоулях, мощность — в ваттах. Удельная теплоёмкость: Дж/(кг·К), теплоёмкость всего тела: Дж/К. Удельная теплота плавления или сгорания: Дж/кг. Изменение температуры на 1 К равно изменению на 1 °C.', example: 'Импульс: кг·м/с = Н·с\nЗапись Н/с для импульса неверна.' },
  { title: 'Ответ в порядке А, Б, В', text: 'В задании три позиции и пять вариантов. Нужно сопоставить понятия с примерами или величины с единицами. Для каждой буквы найди свой номер, затем собери три цифры. Два варианта останутся лишними. Ниже — учебный пример с разбором.', example: '' },
];
export default function SubjectLesson() {
  const { course } = useLocalSearchParams<{ course?: string }>(), [index, setIndex] = useState(0);
  if (!scienceCourse(course)) return <Screen><CourseBack /><Text style={type.title}>Урок пока недоступен</Text></Screen>;
  const page = pages[index], task = physicsTasks[0];
  return <Screen key={index} footer={<Button title={index === pages.length - 1 ? 'К группам физики →' : 'Следующий шаг →'} onPress={() => index === pages.length - 1 ? router.dismissTo(courseRoute) : setIndex(index + 1)} />}><CourseBack /><Pill tone="mint">ФИЗИКА · ОГЭ №1 · УРОК</Pill><View style={{ marginTop: 16 }}><ProgressBar current={index + 1} total={pages.length} /></View><Text style={s.small}>Шаг {index + 1} из {pages.length}</Text><Text accessibilityRole="header" style={[type.title, { marginTop: 22 }]}>{page.title}</Text><Text style={s.body}>{page.text}</Text>{page.example ? <View style={s.card}><Text style={[s.title, { lineHeight: 30 }]}>{page.example}</Text></View> : <><View style={s.card}><MatchingCard task={task} /></View><MatchingSolution task={task} /></>}
    <Disclosure title="Памятка единиц СИ"><UnitsReference /></Disclosure>{index === pages.length - 1 && <SubjectSources subject="physics" exam="oge" />}
  </Screen>;
}
