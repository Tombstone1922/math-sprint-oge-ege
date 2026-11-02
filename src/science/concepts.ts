export const conceptTitles: Record<string, string> = { quantity: 'Физическая величина', unit: 'Единица физической величины', instrument: 'Измерительный прибор', phenomenon: 'Физическое явление' };
export const conceptExamples = [
  ...['давление', 'масса', 'температура', 'скорость', 'плотность', 'сила тока', 'напряжение', 'энергия', 'время', 'сила'].map((text, i) => ({ id: `concept-quantity-${i}`, text, category: 'quantity' })),
  ...['метр', 'килограмм', 'секунда', 'ньютон', 'паскаль', 'джоуль', 'ватт', 'ампер', 'вольт', 'ом'].map((text, i) => ({ id: `concept-unit-${i}`, text, category: 'unit' })),
  ...['линейка', 'весы', 'секундомер', 'термометр', 'динамометр', 'барометр', 'амперметр', 'вольтметр', 'манометр', 'спидометр'].map((text, i) => ({ id: `concept-instrument-${i}`, text, category: 'instrument' })),
  ...['диффузия', 'испарение', 'конденсация', 'плавление', 'кристаллизация', 'преломление света', 'отражение света', 'электризация', 'теплопроводность', 'свободное падение'].map((text, i) => ({ id: `concept-phenomenon-${i}`, text, category: 'phenomenon' })),
];
export const conceptExample = (id: string) => conceptExamples.find(e => e.id === id)!;
export const conceptReason: Record<string, string> = {
  quantity: 'Величину можно измерить и выразить числом с единицей.',
  unit: 'Единицу используют как образец при выражении значения величины.',
  instrument: 'Прибор служит для измерения физической величины.',
  phenomenon: 'Явление — наблюдаемый процесс или изменение в природе.',
};
