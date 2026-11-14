import { task, rng, type TaskBody } from './model.ts';
import { csv, type RobotField, type TrainingFile } from './practical-model.ts';

export const practicalTitles = ['Поиск в тексте и каталогах','Отбор файлов','Презентация или текстовый документ','Электронные таблицы','Исполнитель «Робот»','Обработка последовательности'];
export const practicalGroups:Record<number,string[]> = {
 11:['Имя героя','Номер дня в журнале','Должность','Название места','Участник встречи','Название документа','Подпись автора','Станция назначения','Идентификатор заявки','Итог работы'],
 12:['Два расширения','Две ветки','Точный суффикс','Регистр букв','Рекурсивный поиск','Похожие расширения','Два имени папок','Фильтр по имени','Поиск только в подкаталоге','Исключение папки'],
 13:['13.1 · Экспедиция','13.1 · Городской маршрут','13.1 · Заповедник','13.1 · Музей','13.1 · Научный проект','13.2 · Газетная заметка','13.2 · Отчёт о поездке','13.2 · Школьная инструкция','13.2 · Программа фестиваля','13.2 · Памятка читателю'],
 14:['Количество и среднее','Строгая граница','Другая группа','Выше и не ниже','Пустой отбор: проверка','Две группы','Другой диапазон','Фильтр и диаграмма','Условия с равенством','Среднее по подмножеству'],
 15:['Справа вдоль стены','Слева вдоль стены','Подъём вдоль стены','Спуск вдоль стены','Угол вправо и вниз','Угол влево и вниз','Угол вправо и вверх','Угол влево и вверх','Замкнутый периметр вправо','Замкнутый периметр влево'],
 16:['Кратность и последняя цифра','Число цифр в основании b','Сумма подходящих','Максимум (или 0)','Проверка диапазона','Произведение цифр','Количество остатков','Минимум (или 0)','Количество переходов','Наибольшая серия'],
};
const words=['Кленовый','Северный','Речной','Зелёный','Тихий','Облачный','Каменный','Степной','Долинный','Солнечный','Горный','Сосновый','Лесной','Лунный','Туманный','Полевой','Болотный','Озёрный','Белый','Ледяной'];
const labels=['Имя героя','Номер дня','Должность','Место встречи','Участник','Заголовок','Автор','Станция','Номер заявки','Итог'];
const values=['Тимофей','вторник','геолог','Калина','Алексей','Путешествие','Смирнова','Рябиновая','семь','победа','Илья','четверг','редактор','Вязовая','Арсений','Экспедиция','Попова','Липовая','восемь','ничья'];
const radix=(a:number,b:number)=>a.toString(b).toUpperCase();
const check = (title:string, detail:string)=>({title,detail});
const named=(path:string,text:string):TrainingFile=>({path,text});

export function textSearch(g:number,i:number):TaskBody {
 const token=`проект «${words[i]}»`, label=labels[g], index=(i+3*g)%20;
 const answer=g===1?String(i+1):values[index];
 const files=Array.from({length:12},(_,j)=>named(`Архив/Раздел-${Math.floor(j/4)+1}/запись-${j+1}.txt`,
  [`Служебная запись №${j+1}. Это учебный архив.`,j===((i+g)%12)?`В карточке упомянут ${token}.`:`В карточке упомянут проект «${words[(i+j+1)%20]}-резерв».`,`${label}: ${j===((i+g)%12)?answer:values[(index+j+1)%20]}`].join('\n')));
 return {kind:g===1?'number':'text',prompt:`В учебном архиве есть запись, в которой упомянут ${token}. Найди её и выпиши значение поля «${label}». Ищи точное упоминание, без суффиксов.`,answer,
  format:g===1?'Номер дня числом':'Одно слово',steps:[`Ищи по содержимому, используя точную строку «${words[i]}» (без суффикса).`,`В нужной записи найди поле «${label}». Ответ: ${answer}.`],practical:{files},category:0,model:{rule:'file-text',data:{token,label}}};
}
function folderSearch(g:number,i:number):TaskBody {
 const random=rng(6000+20*g+i), root=`Коллекция-${i+1}`, exts=['txt','csv','png','svg','txt.bak','CSV','md'];
 const folders=['Проза','Схемы','Черновики'], dirs=['Город','Лес','Река'], base=folders[g%3], dir=dirs[(g+i)%3], specific=g===2||g===8;
 const suffixes= g===0||g===7 ? ['txt','svg'] : g===5 ? ['txt.bak'] : ['txt','csv'];
 const prefix=g===7?'report-':'';
 const files=folders.flatMap(f=>dirs.flatMap(d=>Array.from({length:3+Math.floor(random()*5)},(_,j)=>{
  const e=exts[Math.floor(random()*exts.length)], name=`${j%2?'report':'note'}-${j+1}.${e}`;
  return named(`${root}/${f}/${d}/${name}`,['svg','png'].includes(e)?'Учебная запись: содержимое не используется при поиске.':`Учебные данные ${i+1}.`);
 })));
 // Use text-compatible file extensions; MIME/content must match the supplied file.
 const assets=files.map(f=>f.path.endsWith('.png')?{...f,path:f.path.replace(/\.png$/,'.log')}:f.path.endsWith('.svg')?{...f,text:'<svg xmlns="http://www.w3.org/2000/svg" width="80" height="64"><circle cx="32" cy="32" r="20" fill="navy"/></svg>'}:f);
 const count=assets.filter(({path})=>{
  const [,f,d,fname]=path.split('/');return (g===9?f!==base:f===base)&&(!specific||d===dir)&&fname.startsWith(prefix)&&suffixes.some(ext=>fname.toLowerCase().endsWith('.'+ext)&& (ext.includes('.') || !fname.toLowerCase().endsWith('.txt.bak')));
 }).length;
 return {kind:'number',prompt:`Распакуй папку «${root}». Сколько файлов имеют окончания ${suffixes.map(x=>'.'+x).join(' или ')} ${g===9?`во всех папках, кроме «${base}»`:`в папке «${base}${specific?'/'+dir:''}» и её подкаталогах`}, без учёта регистра?${prefix?' Имя должно начинаться с report-.':''} Считай только файлы, а не папки.`,
 answer:String(count),steps:['Распакуй архив и ограничь поиск указанными папками.','Проверь именно конец имени: .txt.bak не заканчивается на .txt.',`Объединение результатов без дублей даёт ${count}.`],practical:{files:assets},category:0,model:{rule:'folder',data:{base,dir,specific,suffixes,prefix,excluding:g===9}}};
}
const document = ['Открой план и исходный текст','Проверь структуру и форматирование','Сохрани результат в нужном формате'];
function office(g:number,i:number):TaskBody {
 const slides=g<5, place=words[i], topic=practicalGroups[13][g].slice(7), title=`${topic}: «${place}»`, length=12+i, date=`${i+1}.06.2027`;
 const text=`${title}\n\nМаршрут\nКоманда стартует ${date}. Протяжённость маршрута — ${length} км. Первая остановка находится у ${['реки','смотровой площадки','музея','вокзала','моста'][g%5]}.\n\nПодготовка\nВозьмите карту, воду и блокнот. Участники работают парами, отмечая наблюдения.\n\nПлан\n09:00 — сбор\n10:00 — начало\n15:00 — итоги`;
 const art=(n:number)=>`<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180"><rect width="320" height="180" fill="#eaf0ff"/><path d="M0 150 L90 ${60+n*10} L155 120 L260 ${30+i} L320 160 V180 H0Z" fill="#486d8e"/><circle cx="${65+n*45}" cy="43" r="20" fill="#e6b75b"/></svg>`;
 const sample = slides ? `Слайд 1: ${title}.\nСлайд 2: маршрут, ${date}, ${length} км, иллюстрации 1 и 2 с отдельными подписями.\nСлайд 3: карта, вода, блокнот, иллюстрации 3–5, подписи.` : `Заголовок «${title}» расположен по центру.\nРазделы «Маршрут» и «Подготовка» выделены полужирным.\nТри пункта плана записаны в двух столбцах «Время» и «Действие».`;
 return {kind:'written',answer:'',format:slides?'Презентация из трёх слайдов':'Текстовый документ',prompt:slides?`Собери презентацию «${title}» из трёх слайдов 16:9. Первый — титульный. На втором — заголовок «Маршрут», два изображения и два текста. На третьем — заголовок «Подготовка», три изображения и три коротких подписи. Используй материалы архива. Сохрани как PPTX или ODP.`:`Воспроизведи документ «${title}» из архива. Страница A4, поля 2 см, основной текст 14 пт с выравниванием по ширине и отступом первой строки 1,25 см. Заголовок по центру, названия разделов полужирные. План оформи таблицей «Время | Действие» без потери данных. Сохрани как DOCX или ODT.`,
 steps:[...document,sample],written:{criteria:[check('Содержание','Все сведения перенесены без подмены; лишнего текста нет.'),check('Структура',slides?'Три слайда; все блоки и иллюстрации на своих местах.':'Заголовки, абзацы и таблица соответствуют условию.'),check('Оформление',slides?'Размер 16:9, единый стиль и читаемые подписи.':'Размер страницы, поля, шрифт, отступ и выравнивание соблюдены.')]},
 practical:{files:[named('материал.txt',text),...(slides?Array.from({length:5},(_,j)=>named(`рисунки/${j+1}.svg`,art(j+1))):[])],sampleFiles:[named('образец.txt',sample)]},category:0,model:{rule:'office',data:{slides}}};
}
function spreadsheet(g:number,i:number):TaskBody {
 const random=rng(43000+g*200+i), limit=g===4?170:75+g*3+i, cl=7+g%3, meanClass=7+(g+1)%3;
 const rows=Array.from({length:72+2*i},(_,j)=>[j+1,j<3?7+j:7+Math.floor(random()*3),40+Math.floor(random()*111),1+j%12]);
 const groups=[7,8,9], counts=groups.map(c=>rows.filter(r=>r[1]===c).length);
 const inclusive=g%2===1, hits=rows.filter(r=>r[1]===cl&&(inclusive?r[2]>=limit:r[2]>limit)).length;
 const points=rows.filter(r=>r[1]===meanClass).map(r=>r[2]), mean=(points.reduce((a,b)=>a+b,0)/points.length).toFixed(2);
 const last=rows.length+1, sheet=csv([['Участник','Класс','Балл','Школа'],...rows]);
 const formulas=`H2: =COUNTIFS(B2:B${last};${cl};C2:C${last};"${inclusive?'>=':'>'}${limit}")\nH3: =AVERAGEIF(B2:B${last};${meanClass};C2:C${last})`;
 return {kind:'written',answer:'',format:'Таблица с двумя расчётами и диаграммой',
 prompt:`Импортируй таблицу «баллы.csv» (разделитель «;»). В H2 укажи, сколько учеников ${cl}-го класса набрали ${inclusive?'не менее':'больше'} ${limit} баллов. В H3 запиши средний балл ${meanClass}-го класса с точностью до сотых. Построй круговую диаграмму количества участников в 7, 8 и 9 классах с подписями значений. Сохрани как XLSX или ODS.`,
 steps:[`Класс — колонка B, балл — C. ${formulas}`,`H2 = ${hits}; H3 = ${mean.replace('.',',')}.`,`Для диаграммы используй значения ${counts.join(', ')} для 7, 8 и 9 классов соответственно.`],
 written:{criteria:[check('Количество',`H2 содержит верное число ${hits}.`),check('Среднее',`В H3 — ${mean.replace('.',',')} с округлением до сотых.`),check('Диаграмма','Сектора соответствуют трём классам; есть подписи и легенда.')]},
 practical:{files:[named('баллы.csv',sheet)],sampleFiles:[named('разбор.txt',formulas),named('данные-диаграммы.csv',csv([['класс','число участников'],...groups.map((c,j)=>[c,counts[j]])]))]},category:0,model:{rule:'spreadsheet',data:{rows,limit,cl,meanClass,inclusive,hits,mean}}};
}
const directions=['вправо','влево','вверх','вниз'];
const freedoms=['справа','слева','сверху','снизу'];
const vectors=[[1,0],[-1,0],[0,-1],[0,1]];
const moves=[[0],[1],[2],[3],[0,3],[1,3],[0,2],[1,2],[0,3,1,2],[1,3,0,2]];
function robot(g:number,i:number):TaskBody {
 const path=moves[g], verticalEdge=path.includes(2), reverse=path[0]===1;
 const shape=(w:number,h:number,x:number,y:number):RobotField=>{
  const maxX=x+w-1,maxY=y+h-1;
  const start:[number,number]=[reverse?maxX:x,verticalEdge&&path.length!==4?maxY:y];
  const walls:RobotField['walls']=[];
  for(let j=x;j<=maxX;j++) {if(y>0)walls.push([j,y-1,'D']);walls.push([j,maxY,'D']);}
  for(let j=y;j<=maxY;j++) {if(x>0)walls.push([x-1,j,'R']);walls.push([maxX,j,'R']);}
  let [cx,cy]=start;const target=new Map<string,[number,number]>();
  for(const move of path) {
   const [dx,dy]=vectors[move];
   while(cx>=x&&cx<=maxX&&cy>=y&&cy<=maxY){target.set(`${cx},${cy}`,[cx,cy]);cx+=dx;cy+=dy;}
   cx-=dx;cy-=dy;
  }
  return {columns:maxX+2,rows:maxY+2,start,walls,target:[...target.values()]};
 };
 const w=3+i%5,h=3+Math.floor(i/5), preview=shape(w,h,1,1), tests=[shape(w+1,h+1,0,1),shape(w+2,h,2,0),shape(w,h+2,1,2)];
 const sample=path.map(move=>`нц пока ${freedoms[move]} свободно\n  закрасить\n  ${directions[move]}\nкц\nзакрасить`).join('\n');
 return {kind:'written',answer:'',format:'Команды Робота, по одной на строку',prompt:`Робот стоит в отмеченном углу прямоугольной комнаты. Размеры комнаты заранее неизвестны. Двигайся по указанным сторонам в порядке: ${path.map(x=>directions[x]).join(' → ')}. На каждом участке иди до стены. Закрась все клетки этого маршрута, включая углы, и только их. Алгоритм должен работать при любом размере комнаты от 2×2.`,
 steps:['Применяй цикл «нц пока [сторона] свободно» и завершай его строкой «кц».','Закрась конечную клетку после выхода из каждого цикла: на ней условие продолжения уже ложно.'],
 written:{criteria:[check('Алгоритм останавливается','Нет столкновений со стеной или бесконечного цикла.'),check('Точный маршрут','Закрашены все необходимые клетки и только они.'),check('Универсальность','Размер, ширина и высота не зашиты в алгоритме.')]},
 practical:{robot:{preview,tests,sample},sampleFiles:[named('робот.txt',sample)]},category:0,model:{rule:'robot',data:{g,w,h}}};
}
function program(g:number,i:number):TaskBody {
 const n=i+1,b=3+i, r=2+n, lo=24+3*n, hi=lo+60+g, d=1+i%8;
 const expressions=[
  [`кратных ${r} и оканчивающихся десятичной цифрой ${d}`,`x % ${r} == 0 and x % 10 == ${d}`,(x:number)=>x%r===0&&x%10===d,'count'],
  [`трёхзначных в системе с основанием ${b}, последняя цифра ${n%b}`,`${b*b} <= x < ${b**3} and x % ${b} == ${n%b}`,(x:number)=>x>=b*b&&x<b**3&&x%b===n%b,'count'],
  [`делящихся на ${r} без остатка`,`x % ${r} == 0`,(x:number)=>x%r===0,'sum'],
  [`с остатком 1 при делении на ${r}`,`x % ${r} == 1`,(x:number)=>x%r===1,'max'],
  [`из отрезка [${lo}; ${hi}]`,`${lo} <= x <= ${hi}`,(x:number)=>x>=lo&&x<=hi,'count'],
  [`у которых произведение последних двух десятичных цифр делится на ${r}`,`((x // 10 % 10) * (x % 10)) % ${r} == 0`,(x:number)=>Math.floor(x/10)%10*(x%10)%r===0,'count'],
  [`с остатком ${n%r} при делении на ${r}`,`x % ${r} == ${n%r}`,(x:number)=>x%r===n%r,'count'],
  [`кратных ${r}`,`x % ${r} == 0`,(x:number)=>x%r===0,'min'],
 ] as const;
 const pick=expressions[Math.min(g,7)], mode=g===8?'pairs':g===9?'run':pick[3], predicate=pick[2];
 const title=mode==='pairs'?`число соседних пар, в которых оба числа кратны ${r}`:mode==='run'?`длину самой длинной подряд идущей серии чисел, кратных ${r}`:`${{count:'количество',sum:'сумму',max:'наибольшее значение',min:'наименьшее значение'}[mode]} элементов, ${pick[0]}`;
 function solve(input:number[]){
  const arr=input.slice(0,-1); if(mode==='pairs')return arr.slice(1).filter((x,j)=>x%r===0&&arr[j]%r===0).length;
  if(mode==='run'){let best=0,cur=0;for(const x of arr){cur=x%r===0?cur+1:0;best=Math.max(best,cur);}return best;}
  const hits=arr.filter(predicate);return mode==='sum'?hits.reduce((a,b)=>a+b,0):mode==='max'?Math.max(0,...hits):mode==='min'?hits.length?Math.min(...hits):0:hits.length;
 }
 const random=rng(74000+200*g+i), make=(l:number)=>[...Array.from({length:l},()=>1+Math.floor(random()*Math.max(550,b**3))),0];
 const cases=[make(9),make(14),[r,2*r,3*r,3*r+1,lo,hi,0],[0],make(99),make(1000)].map(input=>({input,output:solve(input)}));
 const body=mode==='pairs'?`if previous and previous % ${r} == 0 and x % ${r} == 0:\n        answer += 1\n    previous = x`:mode==='run'?`run = run + 1 if x % ${r} == 0 else 0\n    answer = max(answer, run)`:`if ${pick[1]}:\n        ${{count:'answer += 1',sum:'answer += x',max:'answer = max(answer, x)',min:'answer = min(answer, x) if answer else x'}[mode]}`;
 const sample=`answer = 0\n${mode==='pairs'?'previous = 0\n':mode==='run'?'run = 0\n':''}while True:\n    x = int(input())\n    if x == 0:\n        break\n    ${body}\nprint(answer)`;
 return {kind:'written',answer:'',format:'Программа, печатающая одно целое число',
 prompt:`Напиши программу, которая вычисляет ${title}. Подаются натуральные числа (до 1000 штук), по одному в строке. Последний 0 обозначает конец ввода и не входит в последовательность. Напечатай одно целое число; если искомых элементов нет, результат равен 0.`,
 steps:['В цикле считывай число и проверяй признак завершения до любых расчётов.','Обновляй накопитель только согласно условию. Проверь один элемент, отсутствие подходящих элементов и границы.'],
 written:{criteria:[check('Чтение','Цикл читает последовательность до первого 0 и не обрабатывает 0.'),check('Алгоритм','Правильно выбран критерий отбора и операция над результатом.'),check('Проверка решения','Программа печатает только ответ и проходит примеры и контрольные наборы.')]},
 practical:{program:{examples:cases.slice(0,2),checks:cases.slice(2),sample},sampleFiles:[named('решение.py',sample)]},category:0,model:{rule:'program',data:{mode,base:b,sampleInput:radix(n,b)}}};
}
const makers=[textSearch,folderSearch,office,spreadsheet,robot,program];
export const practicalTasks=makers.flatMap((make,k)=>practicalGroups[k+11].flatMap((_,g)=>Array.from({length:20},(_,i)=>task(k+11,g+1,i,make(g,i)))));
const tips=[
 ['Поиск по содержимому','Открой файлы или используй поиск по тексту внутри распакованной папки.','Запрос «кленовый» и точная фраза «проект „Кленовый“» могут совпадать с разными строками.'],
 ['Сначала задай область поиска','Выбери правильную папку, включи вложенные и проверь окончания имён.','report.txt.bak заканчивается на .bak, а не на .txt.'],
 ['Разметка перед оформлением','Сначала разложи материал по требуемым блокам; затем сверь размеры и форматы.','В презентации образец задаёт количество блоков, а не размер шрифта каждого слова.'],
 ['Раздели отбор и вычисление','Проверь колонки класса и балла. Количество, среднее и диаграмма требуют разных диапазонов.','СЧЁТЕСЛИМН считает строки, удовлетворяющие всем условиям одновременно.'],
 ['Стены вместо фиксированного числа шагов','Цикл с условием «свободно» работает для разных размеров поля.','Закрашивай и клетку после окончания цикла.'],
 ['Ноль — только сигнал окончания','Проверяй 0 сразу после чтения; в вычисление его не включай.','Для трёхзначного числа в базе b нужно b² ≤ x < b³.'],
];
export const practicalLessons=tips.map(([title,text,example],i)=>[
 {title,text,example},
 {title:'Как выполнить на практике',text:i<=1?'Скачай учебные файлы из карточки. Для удобства можно сразу открыть краткий просмотр.':i<=3?'Сделай работу в редакторе и сверь файл с критериями. Баллы в приложении выставляешь ты.':i===4?'Введите команды и проверьте их на нескольких размерах комнаты.':'Запусти программу в своей среде Python; входы для проверки есть в архиве.',example},
 {title:'Что проверить перед сдачей',text:i<=1?'Ответ должен соответствовать исходной записи и требуемому формату.':'Нажми «Сравнить с образцом» после своего решения. Проверь каждый критерий отдельно.',example},
]);
