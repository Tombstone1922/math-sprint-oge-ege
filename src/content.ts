export type Exam = 'ОГЭ' | 'ЕГЭ база' | 'ЕГЭ профиль';

export const modules = [
  { id: 'mental-math', title: 'Быстрый счёт', subtitle: 'Считай увереннее без калькулятора', icon: '⚡', minutes: 8, available: true, topics: ['Арифметика', 'Устный счёт'], exams: ['ОГЭ', 'ЕГЭ база', 'ЕГЭ профиль'] as Exam[], numbers: 'Основа для многих заданий' },
  { id: 'percent', title: 'Проценты', subtitle: 'Скидки, доли и изменения', icon: '◕', minutes: 12, available: false, topics: ['Проценты'], exams: ['ОГЭ', 'ЕГЭ база'] as Exam[], numbers: 'По темам экзамена' },
  { id: 'fractions', title: 'Дроби', subtitle: 'Сравнение и действия', icon: '½', minutes: 14, available: false, topics: ['Арифметика'], exams: ['ОГЭ', 'ЕГЭ база'] as Exam[], numbers: 'По темам экзамена' },
  { id: 'equations', title: 'Уравнения', subtitle: 'От простых до экзаменационных', icon: 'x', minutes: 16, available: false, topics: ['Алгебра'], exams: ['ОГЭ', 'ЕГЭ профиль'] as Exam[], numbers: 'По темам экзамена' },
] as const;

export const lesson = [
  { label: 'ПРИЁМ 01', title: 'Считай через круглое число', description: 'Добавь до ближайшего десятка, а затем верни разницу. Так легче удержать вычисление в голове.', example: '48 + 27', steps: '50 + 27 − 2', answer: '75' },
  { label: 'ПРИЁМ 02', title: 'Разбей число на части', description: 'При вычитании сначала убери десятки, затем единицы. Один шаг за другим.', example: '83 − 29', steps: '83 − 20 − 9', answer: '54' },
  { label: 'ПРИЁМ 03', title: 'Прибавь по частям', description: 'Сначала прибавь десятки, потом единицы. Работает даже с переходом через десяток.', example: '19 + 22', steps: '19 + 20 + 2', answer: '41' },
];
