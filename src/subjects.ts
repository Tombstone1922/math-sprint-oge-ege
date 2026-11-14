import { physicsEge, informaticsEge } from './exam-outlines.ts';
import { informaticsCourses } from './informatics/courses.ts';
import type { InformaticsCourseId } from './informatics/model.ts';
import { physicsCourses, type ScienceCourseId } from './science/courses.ts';
export type SubjectId = 'math' | 'physics' | 'informatics';
export type PlannedSubjectId = Exclude<SubjectId, 'math'>;
export type ExamId = 'oge' | 'ege';
export type ModuleFormat = 'short' | 'written' | 'experiment' | 'file' | 'program';
export type SubjectModule = {
  id: string; subject: PlannedSubjectId; exam: ExamId; number: number;
  title: string; focus: string; format: ModuleFormat; part: 1 | 2 | null;
  status: 'planned' | 'ready'; readyTasks: number; courseId?: ScienceCourseId | InformaticsCourseId; note?: string;
};
export const subjects = [
  { id: 'math', title: 'Математика', subtitle: 'Тренировки, варианты ОГЭ и рабочая тетрадь', status: 'ready' },
  { id: 'physics', title: 'Физика', subtitle: 'Явления, законы, расчёты и эксперименты', status: 'planned' },
  { id: 'informatics', title: 'Информатика', subtitle: 'Логика, алгоритмы, данные и программирование', status: 'planned' },
] as const;
export const examTitles: Record<ExamId, string> = { oge: 'ОГЭ', ege: 'ЕГЭ' };
export const formatTitles: Record<ModuleFormat, string> = { short: 'Краткий ответ', written: 'Развёрнутый ответ', experiment: 'Эксперимент', file: 'Работа с файлами', program: 'Программирование' };
export const subjectRevision = { year: 2027, status: 'approved', reviewedAt: '2026-11-14', label: 'ФИПИ · 2027' } as const;
export const fipiSources: Record<ExamId, string> = { oge: 'https://fipi.ru/oge/demoversii-specifikacii-kodifikatory', ege: 'https://fipi.ru/ege/demoversii-specifikacii-kodifikatory' };
export const catalogSources: Record<PlannedSubjectId, Record<ExamId, string>> = {
  physics: { oge: 'https://phys-oge.sdamgia.ru/prob_catalog', ege: 'https://phys-ege.sdamgia.ru/prob_catalog' },
  informatics: { oge: 'https://inf-oge.sdamgia.ru/prob_catalog', ege: 'https://inf-ege.sdamgia.ru/prob_catalog' },
};
type Outline = readonly [title: string, focus: string];
const physicsOge: readonly Outline[] = [
  ['Физические понятия и единицы СИ', 'Величины, явления, приборы и единицы измерения.'],
  ['Приборы и технические устройства', 'Какие явления и законы лежат в основе работы устройства.'],
  ['Узнаём физическое явление', 'Существенные признаки механических, тепловых и электромагнитных явлений.'],
  ['Свойства физических явлений', 'Условия протекания явления и выводы из описания опыта.'],
  ['Объясняем физическое явление', 'Связь наблюдаемого эффекта с величинами и законами.'],
  ['Механика: вычисления', 'Движение, силы и давление; выбор формулы и перевод единиц.'],
  ['Механика: графики и условия', 'Чтение графиков движения и расчёт величины по условию.'],
  ['Тепловые явления: вычисления', 'Нагревание, теплообмен и изменение состояния вещества.'],
  ['Электромагнитные явления: расчёт', 'Электрические величины, схемы и связи между ними.'],
  ['Электричество и оптика', 'Расчёт по схеме, таблице или текстовому условию.'],
  ['Квантовая и ядерная физика', 'Строение атома, состав ядра и ядерные превращения.'],
  ['Изменение величин: механика и тепло', 'Как меняются связанные величины при изменении условий.'],
  ['Изменение величин: электричество и свет', 'Изменения в электрических, оптических и квантовых процессах.'],
  ['Графики, таблицы и схемы', 'Проверка утверждений по физической модели и данным.'],
  ['Прямые измерения', 'Шкалы приборов, цена деления и выбор оборудования.'],
  ['Разбираем результаты опыта', 'Зависимости между величинами и выводы из исследования.'],
  ['Лабораторный эксперимент', 'План опыта, косвенное измерение, таблица и вывод.'],
  ['Физика в тексте', 'Выделение данных из текста и обоснование ответа.'],
  ['Качественная задача', 'Последовательное объяснение процесса с опорой на законы.'],
  ['Расчётная задача', 'Дано, система уравнений, вычисления и проверка единиц.'],
  ['Расчётная задача высокого уровня', 'Несколько физических связей в одной задаче.'],
  ['Комбинированная задача', 'Объединение нескольких явлений в одной модели решения.'],
];
const informaticsOge: readonly Outline[] = [
  ['Объём текстовой информации', 'Алфавит, биты и байты, объём сообщения и изменение текста.'],
  ['Кодирование и декодирование', 'Восстановление сообщения по таблице кодов.'],
  ['Логические выражения', 'Истинность условий и поиск подходящего значения.'],
  ['Таблицы и модели', 'Чтение связей, расстояний и других данных модели.'],
  ['Команды исполнителя', 'Линейный алгоритм и восстановление его команд или исходного числа.'],
  ['Программа с условием', 'Присваивания, ветвления и результаты выполнения программы.'],
  ['Адреса в Интернете', 'Составление сетевого адреса и адреса информационного ресурса.'],
  ['Поисковые запросы', 'Логические операции в запросах и подсчёт результатов поиска.'],
  ['Пути в графе', 'Подсчёт маршрутов с обязательными и запрещёнными вершинами.'],
  ['Системы счисления', 'Перевод чисел, сравнение записей и свойства цифр.'],
  ['Поиск в тексте и каталогах', 'Поиск информации средствами системы и текстового редактора.'],
  ['Отбор файлов', 'Расширения, условия поиска, количество и объём файлов.'],
  ['Презентация или текстовый документ', '№13.1 — презентация; №13.2 — форматирование документа.'],
  ['Электронные таблицы', 'Формулы, отбор записей и обработка массива данных.'],
  ['Исполнитель «Робот»', 'Составление и проверка алгоритма для заданного исполнителя.'],
  ['Программа на языке программирования', 'Условия, циклы и обработка входных данных.'],
];
export const informatics2027Notes: Record<number, string> = {
  10: 'По окончательной спецификации 2027 года здесь поиск в текстовом процессоре.',
  13: 'Маски подсетей остаются в задании №13.',
  23: 'Здесь проверяется анализ исполнения алгоритма.',
  27: 'Данные находятся в одном файле, ответ записывается одной строкой из двух чисел.',
};
function makeModules(subject: PlannedSubjectId, exam: ExamId, rows: readonly Outline[]): SubjectModule[] {
  return rows.map(([title, focus], index) => {
    const number = index + 1;
    const format: ModuleFormat = subject === 'physics' ? exam === 'oge' ? number === 17 ? 'experiment' : number >= 18 ? 'written' : 'short' : number >= 21 ? 'written' : 'short'
      : exam === 'oge' ? number >= 15 ? 'program' : number >= 11 ? 'file' : 'short' : number >= 24 ? 'program' : [3, 9, 10, 17, 18, 22].includes(number) ? 'file' : 'short';
    const part = subject === 'physics' ? number <= (exam === 'oge' ? 16 : 20) ? 1 : 2 : exam === 'oge' ? number <= 10 ? 1 : 2 : null;
    const note = subject === 'informatics' && exam === 'ege' ? informatics2027Notes[number] : number === 17 && subject === 'physics' && exam === 'oge' ? 'На экзамене это опыт на реальном оборудовании. Учебный модуль будет помогать готовиться к нему.' : undefined;
    const course = (subject === 'physics' ? physicsCourses : informaticsCourses).find(c => c.id === `${subject}-${exam}-${number}`);
    const ready = Boolean(course);
    return { id: `${subject}-${exam}-2027-${number}`, subject, exam, number, title, focus, format, part, status: ready ? 'ready' : 'planned', readyTasks: course?.tasks.length ?? 0, ...(course ? { courseId: course.id } : {}), ...(note ? { note } : {}) };
  });
}
export const subjectModules = [
  ...makeModules('physics', 'oge', physicsOge), ...makeModules('physics', 'ege', physicsEge),
  ...makeModules('informatics', 'oge', informaticsOge), ...makeModules('informatics', 'ege', informaticsEge),
];
export const plannedSubject = (id: unknown): PlannedSubjectId | undefined => id === 'physics' || id === 'informatics' ? id : undefined;
export const examId = (id: unknown): ExamId | undefined => id === 'oge' || id === 'ege' ? id : undefined;
const normalize = (s: string) => s.toLocaleLowerCase('ru-RU').replaceAll('ё', 'е').trim();
export function searchSubjectModules(subject: PlannedSubjectId, exam: ExamId, query = ''): SubjectModule[] {
  const q = normalize(query), number = /^(?:(?:огэ|егэ)\s*)?(?:(?:№|номер|задани[ея])\s*)?(\d{1,2})(?:\.([12]))?$/.exec(q);
  return subjectModules.filter(m => m.subject === subject && m.exam === exam && (number ? m.number === Number(number[1]) && (!number[2] || subject === 'informatics' && exam === 'oge' && m.number === 13) : q.split(/\s+/).every(token => normalize(`${m.title} ${m.focus} ${formatTitles[m.format]}`).includes(token))));
}
export function subjectModule(subject: unknown, exam: unknown, number: unknown): SubjectModule | undefined {
  if (!plannedSubject(subject) || !examId(exam) || typeof number !== 'string' || !/^\d{1,2}$/.test(number)) return undefined;
  return subjectModules.find(m => m.subject === subject && m.exam === exam && m.number === Number(number));
}
