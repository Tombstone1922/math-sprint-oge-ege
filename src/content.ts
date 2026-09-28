export type Exam = 'ОГЭ' | 'ЕГЭ база' | 'ЕГЭ профиль';

export const modules = [
  { id: 'mental-math', title: 'Быстрый счёт', subtitle: 'Сложение и вычитание до 200', icon: '⚡', minutes: 8, topics: ['Арифметика', 'Устный счёт'], exams: ['ОГЭ', 'ЕГЭ база', 'ЕГЭ профиль'] as Exam[], numbers: 'Основа для многих заданий' },
  { id: 'percent', title: 'Проценты', subtitle: 'Доли, скидки и повышение цены', icon: '%', minutes: 12, topics: ['Проценты'], exams: ['ОГЭ', 'ЕГЭ база', 'ЕГЭ профиль'] as Exam[], numbers: 'Текстовые задачи' },
  { id: 'fractions', title: 'Дроби', subtitle: 'Сокращай и считай по частям', icon: '½', minutes: 14, topics: ['Арифметика'], exams: ['ОГЭ', 'ЕГЭ база', 'ЕГЭ профиль'] as Exam[], numbers: 'Числа и вычисления' },
  { id: 'equations', title: 'Уравнения', subtitle: 'Найди неизвестное без догадок', icon: 'x', minutes: 15, topics: ['Алгебра'], exams: ['ОГЭ', 'ЕГЭ база', 'ЕГЭ профиль'] as Exam[], numbers: 'Алгебраические задания' },
  { id: 'geometry', title: 'Геометрия', subtitle: 'Площадь и периметр фигур', icon: '▱', minutes: 13, topics: ['Геометрия'], exams: ['ОГЭ', 'ЕГЭ база', 'ЕГЭ профиль'] as Exam[], numbers: 'Геометрические задачи' },
  { id: 'powers', title: 'Степени и корни', subtitle: 'Квадраты, кубы и точные корни', icon: '√', minutes: 11, topics: ['Алгебра'], exams: ['ОГЭ', 'ЕГЭ база', 'ЕГЭ профиль'] as Exam[], numbers: 'Числа и выражения' },
  { id: 'probability', title: 'Вероятность', subtitle: 'Считай благоприятные исходы', icon: '◉', minutes: 12, topics: ['Вероятность'], exams: ['ОГЭ', 'ЕГЭ база', 'ЕГЭ профиль'] as Exam[], numbers: 'Задачи на вероятность' },
] as const;

export type ModuleId = (typeof modules)[number]['id'];
export type LessonStep = { label: string; title: string; description: string; example: string; steps: string; answer: string };
export function getModule(id: string | undefined) {
  return modules.find(module => module.id === id) ?? modules[0];
}

export const lessons: Record<ModuleId, LessonStep[]> = {
  'mental-math': [
    { label: 'ПРИЁМ 01', title: 'Считай через круглое число', description: 'Добавь до ближайшего десятка, а затем верни разницу.', example: '48 + 27', steps: '50 + 27 − 2', answer: '75' },
    { label: 'ПРИЁМ 02', title: 'Разбей число на части', description: 'При вычитании сначала убери десятки, затем единицы.', example: '83 − 29', steps: '83 − 20 − 9', answer: '54' },
    { label: 'ПРИЁМ 03', title: 'Прибавь по частям', description: 'Сначала прибавь десятки, потом единицы.', example: '19 + 22', steps: '19 + 20 + 2', answer: '41' },
  ],
  percent: [
    { label: 'ПРИЁМ 01', title: 'Найди часть от числа', description: '10% — это одна десятая. Для 20% найди 10% и удвой.', example: '20% от 150', steps: '150 ÷ 10 × 2', answer: '30' },
    { label: 'ПРИЁМ 02', title: 'Вычти скидку', description: 'Сначала вычисли размер скидки, потом вычти его из цены.', example: '200 ₽, скидка 25%', steps: '200 − (200 ÷ 4)', answer: '150' },
    { label: 'ПРИЁМ 03', title: 'Прибавь повышение', description: 'Найди процент от старой цены и прибавь его.', example: '120 ₽, рост 50%', steps: '120 + (120 ÷ 2)', answer: '180' },
  ],
  fractions: [
    { label: 'ПРИЁМ 01', title: 'Сложи числители', description: 'Если знаменатели равны, сложи числители. Ответ сократи.', example: '1/6 + 2/6', steps: '3/6 = 1/2', answer: '1/2' },
    { label: 'ПРИЁМ 02', title: 'Вычти доли', description: 'При одинаковом знаменателе вычитай только числители.', example: '5/8 − 1/8', steps: '4/8 = 1/2', answer: '1/2' },
    { label: 'ПРИЁМ 03', title: 'Найди часть числа', description: 'Раздели число на знаменатель и умножь на числитель.', example: '3/4 от 80', steps: '80 ÷ 4 × 3', answer: '60' },
  ],
  equations: [
    { label: 'ПРИЁМ 01', title: 'Отмени прибавление', description: 'Вычти одинаковое число из обеих частей уравнения.', example: 'x + 7 = 19', steps: 'x = 19 − 7', answer: '12' },
    { label: 'ПРИЁМ 02', title: 'Отмени умножение', description: 'После переноса свободного числа раздели обе части на коэффициент.', example: '3x − 5 = 22', steps: '3x = 27; x = 27 ÷ 3', answer: '9' },
    { label: 'ПРИЁМ 03', title: 'Сначала раздели', description: 'Раздели обе части на число перед скобкой, затем найди x.', example: '2(x + 4) = 26', steps: 'x + 4 = 13; x = 9', answer: '9' },
  ],
  geometry: [
    { label: 'ПРИЁМ 01', title: 'Площадь прямоугольника', description: 'Умножь длину на ширину.', example: 'Стороны 6 и 4. S?', steps: '6 × 4', answer: '24' },
    { label: 'ПРИЁМ 02', title: 'Периметр прямоугольника', description: 'Сложи две соседние стороны и удвой сумму.', example: 'Стороны 6 и 4. P?', steps: '(6 + 4) × 2', answer: '20' },
    { label: 'ПРИЁМ 03', title: 'Площадь треугольника', description: 'Умножь основание на высоту и раздели на два.', example: 'Основание 8, высота 5. S?', steps: '8 × 5 ÷ 2', answer: '20' },
  ],
  powers: [
    { label: 'ПРИЁМ 01', title: 'Квадрат числа', description: 'Во второй степени число умножается само на себя.', example: '12²', steps: '12 × 12', answer: '144' },
    { label: 'ПРИЁМ 02', title: 'Точный квадратный корень', description: 'Найди неотрицательное число, квадрат которого равен подкоренному.', example: '√81', steps: '9² = 81', answer: '9' },
    { label: 'ПРИЁМ 03', title: 'Куб числа', description: 'Умножь число на себя три раза.', example: '4³', steps: '4 × 4 × 4', answer: '64' },
  ],
  probability: [
    { label: 'ПРИЁМ 01', title: 'Посчитай все исходы', description: 'Вероятность — подходящие исходы, делённые на все равновозможные исходы.', example: '3 красных из 8 шаров', steps: 'Подходящих 3; всего 8', answer: '3/8' },
    { label: 'ПРИЁМ 02', title: 'Сократи дробь', description: 'Ответ можно записать равной сокращённой дробью.', example: '4 синих из 10 шаров', steps: '4/10 = 2/5', answer: '2/5' },
    { label: 'ПРИЁМ 03', title: 'Проверь границы', description: 'Вероятность находится между 0 и 1; у достоверного события она равна 1.', example: '6 выигрышных из 6', steps: '6/6', answer: '1' },
  ],
};
