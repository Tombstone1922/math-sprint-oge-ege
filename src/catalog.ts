import { modules, type ModuleId } from './content.ts';
import { topicGroupNames } from './module-groups.ts';
import { extendedModules } from './extended/bank.ts';
export type CatalogSection = 'skills' | 'first' | 'second';
export type CatalogFilter = 'all' | CatalogSection | 'ege';
export type CatalogItem = { id: string; title: string; subtitle: string; section: CatalogSection; numbers: number[]; groups: readonly string[]; moduleId?: ModuleId; extendedNumber?: number; ege: boolean };
export const sectionTitles: Record<CatalogSection, string> = { skills: 'Базовые навыки', first: 'ОГЭ · первая часть', second: 'ОГЭ · вторая часть' };
export const catalog: CatalogItem[] = [
  ...modules.map(module => ({ id: module.id, title: module.title.replace(/^ОГЭ №\d+(?:–\d+)? · /, ''), subtitle: module.subtitle, section: module.id.startsWith('oge-') ? 'first' as const : 'skills' as const, numbers: module.numbers === '№1–5' ? [1, 2, 3, 4, 5] : /^oge-\d+$/.test(module.id) ? [Number(module.id.slice(4))] : [], groups: topicGroupNames[module.id] ?? [], moduleId: module.id, ege: module.exams.some(exam => exam.startsWith('ЕГЭ')) })),
  ...extendedModules.map(module => ({ id: `extended-${module.number}`, title: module.title, subtitle: module.subtitle, section: 'second' as const, numbers: [module.number], groups: module.groups, extendedNumber: module.number, ege: false })),
];
const normalize = (s: string) => s.toLocaleLowerCase('ru-RU').replace(/ё/g, 'е').trim().replace(/\s+/g, ' ');
export function searchCatalog(query: string, filter: CatalogFilter = 'all'): CatalogItem[] {
  const q = normalize(query), numeric = /^(?:(?:огэ\s*)?(?:№\s*|номер\s*|задани[ея]\s*)?)?(\d{1,2})$/.exec(q);
  const range = /^(?:огэ\s*)?№?\s*(\d{1,2})\s*[–—-]\s*(\d{1,2})$/.exec(q);
  const tokens = q.split(' ').filter(Boolean);
  return catalog.filter(item => {
    if (filter !== 'all' && (filter === 'ege' ? !item.ege : item.section !== filter)) return false;
    if (numeric) return item.numbers.includes(Number(numeric[1]));
    if (range) return item.numbers.some(n => n >= Number(range[1]) && n <= Number(range[2]));
    const haystack = normalize(`${item.title} ${item.subtitle} ${item.groups.join(' ')} ${sectionTitles[item.section]} ${item.numbers.join(' ')} ${item.ege ? 'ЕГЭ' : ''}`);
    return tokens.every(token => haystack.includes(token));
  });
}
