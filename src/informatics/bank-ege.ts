import { table, rng, shuffled, task, type TaskBody } from './model.ts';
import { csv, type TrainingFile } from './practical-model.ts';

type Variant=TaskBody;
const f=(path:string,text:string):TrainingFile=>({path,text});
const num=(prompt:string,answer:number,steps:string[],extra:Partial<Variant>={}):Variant=>({prompt,answer:String(answer),steps,...extra,model:{rule:'ege-informatics',data:{...extra.model?.data}}});
const text=(prompt:string,answer:string,steps:string[],extra:Partial<Variant>={}):Variant=>({...num(prompt,0,steps,extra),kind:extra.kind??'text',answer});
const pair=(prompt:string,answer:number[],steps:string[],extra:Partial<Variant>={}):Variant=>text(prompt,answer.join(' '),steps,{format:`${answer.length} чисел по порядку, через пробел`,...extra,kind:'pair'});
const rowsFile=(name:string,rows:(number|string)[][])=>({files:[f(name,csv(rows))]});
const bits=(a:number)=>Math.ceil(Math.log2(a));
const pop=(x:number)=>x.toString(2).replace(/0/g,'').length;
function pairsGame(k:number){
 const goal=52+4*k;
 const next=(x:number)=>[x+1,x+3,x*2];
 const table=new Map<string,boolean>();
 const can=(s:number,m:number):boolean=>{
  if(s>=goal)return m%2===0;
  if(m===0)return false;
  const key=`${s}:${m}`, cached=table.get(key);if(cached!==undefined)return cached;
  const result=m%2===1?next(s).some(n=>can(n,m-1)):next(s).every(n=>can(n,m-1));table.set(key,result);return result;
 };
 const values=Array.from({length:goal-1},(_,i)=>i+1);
 return {goal,can,values};
}
export function longestExpression(chars:string):number {
 let best=0, start=-1, end=-1;
 for(let j=0;j<chars.length;){
  if(chars[j]==='-'||chars[j]==='*'){j++;continue;}
  const a=j;while(j<chars.length&&chars[j]!=='-'&&chars[j]!=='*')j++;
  const joins=end===a-1&&start>=0;
  let first=a;while(first+1<j&&chars[first]==='0')first++;
  if(first!==a&&joins)best=Math.max(best,a+1-start);
  if(first!==a||!joins)start=first;
  best=Math.max(best,j-start);end=j;
 }
 return best;
}
function exercise(number:number,g:number,i:number):Variant {
 const k=g*20+i+1, a=2+g, b=3+i, n=12+k, random=rng(573000+number*500+k);
 const limit=50+g*13+i, rand=(m:number)=>Math.floor(random()*m);
 switch(number){
  case 1:{
   const es=[[0,1],[0,2],[0,3],[0,4],[1,2],[2,3],[3,4],[4,5],[5,6]];
   const perm=shuffled([0,1,2,3,4,5,6],random), labels=['А','Б','В','Г','Д','Е','Ж'];
   const edges=es.map(([from,to],j)=>({from,to,weight:10+n+2*j})), from=0,to=g%4+1;
   const matrix=perm.map((u,r)=>[`П${r+1}`,...perm.map(v=>edges.find(e=>e.from===u&&e.to===v||e.from===v&&e.to===u)?.weight??'—')]);
   return num(`На рисунке соединения между пунктами, а в таблице — длины тех же дорог после смены имён на П1–П7. Найди длину дороги ${labels[from]}–${labels[to]}. Строки соответствуют столбцам и графу, прочерк означает отсутствие дороги.`,edges[to-1].weight,
    ['Ж — единственная вершина степени 1. Из неё последовательно определяются Е и Д.','Из двух оставшихся соседей Д у А степень 4, у Г — 3. Из соседей А, отличных от Д и Г, у Б степень 2, у В — 3.',`Искомая длина в строке П${perm.indexOf(from)+1}, столбце П${perm.indexOf(to)+1}.`],
    {figures:[{kind:'graph',labels,edges:edges.map(({from,to})=>({from,to})),directed:false,caption:'Связи без подписей расстояния.'},table(['Пункт',...perm.map((_,j)=>`П${j+1}`)],matrix,'Матрица расстояний')]});
  }
  case 2:{
   const permutation=shuffled(['x','y','z','w'],random), mask=(g+i)%3;
   const valid=Array.from({length:16},(_,j)=>[j>>3&1,j>>2&1,j>>1&1,j&1]).filter(([x,y,z,w])=>((!x||y)&&(!y||z)&&(!z||w))===Boolean(mask%2));
   const ordered=shuffled(valid,random).map(r=>permutation.map(c=>r['xyzw'.indexOf(c)]));
   return text(`Дан фрагмент таблицы для F = (x → y) ∧ (y → z) ∧ (z → w). Подписи перемешаны. Все приведённые строки различны; вычисли порядок букв в столбцах. Код фрагмента: ${k}.`,permutation.join(''),
    ['Импликация ложна только при 1 → 0.','Перебери 24 перестановки столбцов, сравнивая набор строк. У цепочки импликаций каждая переменная имеет собственную позицию.'],
    {figures:[table(['1','2','3','4','F'],ordered.map(r=>[...r,mask%2]),'Фрагмент таблицы')],format:'Четыре латинские буквы без пробелов'});
  }
  case 3:{
   const products=Array.from({length:14},(_,j)=>[100+j,j%3===0?'Книги':j%3===1?'Спорт':'Техника',50+rand(200)]);
   const locations=Array.from({length:7},(_,j)=>[10+j,['Центр','Север','Юг'][j%3]]);
   const records=Array.from({length:70+i},(_,j)=>[j+1,10+rand(locations.length),100+rand(products.length),1+rand(12),j%4?'Продажа':'Возврат']);
   const area=locations[g%7][1], dept=products[(g+i)%14][1], eligible=records.filter(([,s,p,,kind])=>locations[Number(s)-10][1]===area&&products[Number(p)-100][1]===dept&&kind==='Продажа');
   const total=eligible.reduce((sum,[,,p,q])=>sum+Number(products[Number(p)-100][2])*Number(q),0);
   return num(`Архив №${k} содержит три связанные таблицы. Найди выручку от продаж товаров отдела «${dept}» в районе «${area}». Возвраты не учитывай. Количество умножается на цену единицы.`,total,
    ['Соедини операции с товарами по артикулу, а с магазинами по ID.','Оставь нужные отдел, район и тип операции; суммируй произведения.'],{practical:{files:[f('товары.csv',csv([['Артикул','Отдел','Цена'],...products])),f('магазины.csv',csv([['ID','Район'],...locations])),f('операции.csv',csv([['Запись','Магазин','Артикул','Количество','Операция'],...records]))]}});
  }
  case 4:{
   const known=(g%2?['00','010','111']:['0','100','111']), wordA=2+i%4,wordB=1+Math.floor(i/4);
   const available=Array.from({length:63},(_,q)=>(q+1).toString(2).slice(1)).filter(Boolean).filter(s=>known.every(w=>!s.startsWith(w)&&!w.startsWith(s)));
   const best=Math.min(...available.flatMap(x=>available.filter(y=>!x.startsWith(y)&&!y.startsWith(x)).map(y=>wordA*x.length+wordB*y.length)));
   return num(`Для букв А, Б, В уже выбраны коды ${known.join(', ')}. Подбери коды для Г и Д, чтобы ни один код не был началом другого. Какова минимальная длина кодирования слова «${'Г'.repeat(wordA)}${'Д'.repeat(wordB)}»? Вариант ${k}.`,best,
    ['Отметь занятые ветви двоичного дерева. Часть дерева под известным кодом целиком закрыта.','Для двух новых букв проверь все пары свободных несовместимых ветвей. Умножь длины кодов на частоты букв.']);
  }
  case 5:{
   const transform=(x:number)=>{const s=x.toString(2);return parseInt(x%2===0?'1'+s+'01':s+(g%2?'01':'10'),2);};
   const best=Math.min(...Array.from({length:limit},(_,j)=>transform(j+1)).filter(v=>v>limit));
   return num(`Натуральное N записали в двоичной системе. Для чётного N добавляют слева 1, справа 01; для нечётного только справа ${g%2?'01':'10'}. Получают R. Найди наименьшее R > ${limit}.`,best,
    ['Перебери N от 1 до порога: если N больше порога, его удлинённая запись даст R больше кандидата, найденного раньше, так как умножение справа не меньше чем на 4, а на нечётном N поблизости оно даёт меньший R.','Строй именно строки; переводи результат из двоичной системы и оставляй только превышения порога.']);
  }
  case 6:{
   const w=8+a, h=12+b, x=a-1,y=b-1,W=4+i,H=3+g;
   const common=(Math.min(w,x+W)-x+1)*(Math.min(h,y+H)-y+1);
   return num(`Черепаха в (0;0), смотрит вправо, рисует. Выполняет «Повтори 2 [Вперёд ${w}; Налево 90; Вперёд ${h}; Налево 90]». Поднимает перо, идёт вправо ${x} и вверх ${y}, поворачивается вправо и опускает перо. Затем выполняет «Повтори 2 [Вперёд ${W}; Налево 90; Вперёд ${H}; Налево 90]». Сколько целочисленных точек в пересечении прямоугольников, включая границу?`,common,
    [`Интервалы x: [0; ${w}] и [${x}; ${x+W}]; y: [0; ${h}] и [${y}; ${y+H}].`,'В каждом пересечении посчитай целые точки с обоими концами; перемножь.']);
  }
  case 7:{
   const stereo=g%2+1, sec=n+8;
   if(g%2===0){const depth=8+2*(g/2), w=96*(1+i%5), h=64+n;
    return num(`Растровый рисунок ${w} × ${h} пикселей. Палитра из ${2**depth-1} цветов. Каждый пиксель занимает минимальное одинаковое число бит. Найди минимальный размер файла в Кбайт, округляя вверх. Заголовка нет, 1 Кбайт = 1024 байта.`,Math.ceil(w*h*depth/8192),['В коде должно хватить комбинаций для всей палитры.','Умножь биты на число пикселей, раздели на 8192 и округли вверх.']);}
   return num(`Звуковая запись длится ${sec} с. Частота 32 768 Гц, ${stereo} канала, глубина ${a*8} бит. Сколько Кбайт занимает звук без заголовка и сжатия? 1 Кбайт = 1024 байта.`,4*stereo*sec*a*8,['На канал приходится 32 768 отсчётов каждую секунду.','Умножь на число каналов, длительность и глубину. Биты переведи в Кбайт.']);
  }
  case 8:{
   const L=4+i%5,special=1+g%3, alphabet=4+Math.floor(i/5)+4*g;
   const choose=(x:number,y:number):number => y===0?1:x<y?0:Math.round(choose(x-1,y-1)*x/y);
   const ans=choose(L-1,special)*(alphabet-1)**(L-special);
   return num(`В слове ${L} букв из алфавита мощности ${alphabet}. Буква А встречается ровно ${special} раз и не стоит первой. Остальные буквы можно повторять. Сколько слов можно составить?`,ans,['Выбери позиции для всех букв А среди L−1 позиций.','В каждую из остальных позиций можно поставить любую букву кроме А; перемножь варианты.']);
  }
  case 9:{
   const rows=Array.from({length:75+k},()=>Array.from({length:5},()=>1+rand(24))), d=1+g%5, focus=g%2===0;
   const valid=rows.filter(row=>{const max=Math.max(...row),min=Math.min(...row),sum=row.reduce((a,b)=>a+b,0);return focus?new Set(row).size===5&&2*(max+min)>sum:max-min>=d&&row.filter(x=>x===max).length===1;});
   return num(`В файле №${k} по пять целых чисел в строке. Сколько строк удовлетворяют обоим условиям: ${focus?'все числа различны, а сумма минимума с максимумом больше суммы остальных':'максимум встречается один раз, размах не меньше '+d}?`,valid.length,['Для строки найди минимум, максимум и число повторов.','Проверяй оба условия одновременно и считай строки, а не отдельные элементы.'],{practical:rowsFile('числа.csv',rows)});
  }
  case 10:{
   const word=['книга','река','письмо','пруд','школа','лето','метр','сад','ветер','труд'][g];
   const sample=Array.from({length:45+i},(_,j)=>j%7===0?word.toUpperCase():j%3===0?word:j%2===0?word+'а':'дорога');
   const body=sample.map((w,j)=>j%6===0?`${w}.`:w).join(' ');
   return num(`В файле «текст.txt» найдите число вхождений слова «${word}» целиком, без учёта регистра. Формы с добавочными буквами не считайте. Вариант ${k}.`,sample.filter(w=>w.toLowerCase()===word).length,['В поиске текстового редактора отключи учёт регистра.','Включи поиск целого слова. Сверь, что точка после слова не мешает совпадению.'],{practical:{files:[f('текст.txt',body)]}});
  }
  case 11:{
   const alphabet=35+n, len=6+a, count=40+b, bytesEach=Math.ceil(len*bits(alphabet)/8);
   return num(`Серийный номер состоит из ${len} символов алфавита мощности ${alphabet}. Каждый символ кодируют минимальным одинаковым числом бит, запись каждого номера занимает целое минимальное число байтов. Сколько байтов занимают ${count} номеров?`,bytesEach*count,
    [`На символ требуется ${bits(alphabet)} бит.`,`Округли размер одного номера до ${bytesEach} байт, затем умножь на ${count}.`]);
  }
  case 12:{
   if(g%2){
    const len=4+i, steps=2+g+i*2, start=1+g%3;
    const tape=Array.from({length:len},(_,j)=>(j+i)%3===0?1:0);
    let head=start, state='A';
    for(let j=0;j<steps;j++){
     if(state==='A'){state=tape[head]?'B':'A';tape[head]=1;head=(head+1)%len;}
     else{tape[head]=0;head=(head+len-1)%len;state='A';}
    }
    return num(`Машина Тьюринга с кольцевой лентой из ${len} ячеек. Исходная запись: ${Array.from({length:len},(_,j)=>(j+i)%3===0?1:0).join('')}. Головка начинает на ячейке ${start+1} в A. Вправо из последней переходит в первую, влево из первой — в последнюю. Сколько единиц будет после ровно ${steps} команд?`,tape.reduce<number>((a,b)=>a+b,0),
     ['Читай текущий символ, затем запиши новый, передвинь головку и поменяй состояние строго по таблице.',`Итог: ${tape.join('')}; головка в ячейке ${head+1}.`],
     {figures:[table(['Состояние','Читаем','Пишем','Шаг','Новое'],[['A',0,1,'вправо','A'],['A',1,1,'вправо','B'],['B',0,0,'влево','A'],['B',1,0,'влево','A']],'Таблица переходов')]});
   }
   const initial='1'.repeat(12+k)+'2'.repeat(digit(g));
   let tape=initial;
   while(tape.includes('111')||tape.includes('22')) {if(tape.includes('111'))tape=tape.replace('111','2');else tape=tape.replace('22','1');}
   return num(`Редактор получил ${12+k} единиц, затем ${digit(g)} двоек. Пока есть 111 или 22, он заменяет первое слева 111 на 2, а если 111 нет — первое слева 22 на 1. Чему равна сумма цифр итоговой строки?`,[...tape].reduce((s,c)=>s+Number(c),0),
    ['На каждом шаге проверяй 111 заново. Приоритет важнее позиции 22.',`Длина уменьшается на каждом шаге. Итоговая строка: ${tape}.`]);
  }
  case 13:{
   const host=6+i%6, third=16+g*3, base=((7*g+i)%32)*8, min=1+(i%7);
   const mask=32-host;
   // The last two octets share the host field when the mask is shorter than /24.
   const raw=third*256+base, network=Math.floor(raw/2**host)*2**host;
   const count=Array.from({length:2**host},(_,h)=>Number(pop(network+h)>=min)).reduce((s,x)=>s+x,0);
   return num(`Дан узел 10.42.${third}.${base} с маской /${mask}. Сколько адресов в его сети имеют не менее ${min} единиц суммарно в двоичной записи двух младших октетов? Включи адрес сети и широковещательный.`,count,
    [`У маски ${host} нулей; занули их у IP, чтобы получить начало сети.`,`Перебери подряд ${2**host} адресов, считая единицы только в младших 16 битах.`]);
  }
  case 14:{
   const base=22+g, u=i+1,v=2+g,modulus=base-1,w=base**3+u*base+v,z=(g+2)*base**2+1;
   const x=Array.from({length:base},(_,j)=>j).find(d=>(w+z+d*(base**2+base))%modulus===0);
   const forced=(modulus-(w+z)%modulus)%modulus, correction=x===undefined?forced:0, final=x??0;
   return num(`Операнды записаны в системе по основанию ${base}: 1x${u.toString(base).toUpperCase()}${v.toString(base).toUpperCase()} и ${(g+2).toString(base).toUpperCase()}x1. К их сумме прибавили ${correction} (десятичное число). Найди минимальную цифру x, чтобы результат делился на ${modulus}. Запиши частное в десятичной системе.`,(w+z+correction+final*(base**2+base))/modulus,
    ['Разряды переменной имеют веса b² и b.','Перебери цифры 0…b−1, проверь остаток и вычисли частное.']);
  }
  case 15:{
   const left=4+g,right=left+9+i,start=1+g%3,end=right+7;
   const A=Array.from({length:end+1},(_,j)=>j).find(A=>Array.from({length:end+1},(_,x)=>x<left||x>right||x%start!==0||x<=A)!);
   return num(`Для всех целых x из [0; ${end}] истинно: ((${left} ≤ x ≤ ${right}) ∧ (x mod ${start} = 0)) → (x ≤ A). Найди наименьшее целое A ≥ 0.`,A??0,['Импликация ограничивает A только при истинной левой части.','Максимальное кратное нужного делителя внутри отрезка задаёт нижнюю границу A.']);
  }
  case 16:{
   const S=120+k, span=4+g,c=1+i%9;
   return num(`F(n) = ${c} при n = 1, а при n > 1: F(n) = F(n−1) + ${a}n + ${c}. Чему равно F(${S+span}) − F(${S})?`,Array.from({length:span},(_,j)=>a*(S+j+1)+c).reduce((a,b)=>a+b,0),
    ['Разворачивай рекурсию только до меньшего индекса.','Одинаковое F в обеих частях сократится; останется сумма приращений по индексам.']);
  }
  case 17:{
   const seq=Array.from({length:165+k},()=>rand(220)-103), max=Math.max(...seq.filter(x=>x<0)), bound=max*max;
   const hits=seq.slice(1).flatMap((x,j)=>{const y=seq[j];return (x<0)!==(y<0)&&x*x+y*y>bound?[x+y]:[];});
   return pair(`В файле №${k} целые числа, по одному в строке. Найди число соседних пар, в которых ровно один элемент отрицательный, а сумма квадратов больше квадрата наибольшего отрицательного элемента файла. Затем укажи максимальную сумму элементов среди таких пар.`,[hits.length,Math.max(...hits)],['Отдельным проходом найди наибольшее отрицательное число.','Затем перебирай пары с перекрытием (1,2), (2,3)…; сохраняй их число и максимальную сумму.'],{practical:{files:[f('последовательность.txt',seq.join('\n')+'\n')]}});
  }
  case 18:{
   const height=8+i%5,width=8+g%5, grid=Array.from({length:height},()=>Array.from({length:width},()=>1+rand(45)));
   const dp=grid.map(r=>r.map(()=>[0,0]));
   for(let y=0;y<height;y++)for(let x=0;x<width;x++){
    const pred=[x?dp[y][x-1]:null,y?dp[y-1][x]:null].filter((v):v is number[]=>!!v);
    dp[y][x]=[grid[y][x]+(pred.length?Math.max(...pred.map(v=>v[0])):0),grid[y][x]+(pred.length?Math.min(...pred.map(v=>v[1])):0)];
   }
   return pair(`В таблице №${k} Робот идёт из левой верхней клетки в правую нижнюю только вправо и вниз. В каждой посещённой клетке он собирает указанное число монет, включая обе крайние. Укажи максимальную, затем минимальную возможную сумму.`,dp.at(-1)!.at(-1)!,['Храни по два значения для каждой клетки.','Прибавь число в клетке к максимуму и минимуму достижимых соседей слева и сверху.'],{practical:rowsFile('монеты.csv',grid)});
  }
  case 19: case 20: case 21:{
   const {goal,can,values}=pairsGame(k);
   const cond=(s:number)=>number===19?can(s,2)&&!can(s,1):number===20?can(s,3)&&!can(s,1):can(s,4)&&!can(s,2)&&!can(s,1);
   const candidates=values.filter(cond), query=number===19?'Ваня гарантированно выигрывает первым ходом, а Петя не может выиграть первым':number===20?'Петя может гарантировать победу своим вторым ходом, но не первым':'Ваня гарантирует победу не позднее своего второго хода, но не может гарантировать победу первым ходом';
   const prompt=`В куче S камней (1 ≤ S < ${goal}). Петя ходит первым. Можно добавить 1 или 3 камня либо удвоить количество. Побеждает сделавший ход, после которого камней не меньше ${goal}. Найди ${number===20?'два наименьших S (по возрастанию)':'наименьшее S'}, при котором ${query}.`;
   const why=['Из каждой позиции есть три перехода. Сначала отметь позиции выигрыша за один ход.','На своём ходе достаточно одного перехода с нужным свойством; на ходе соперника должны подходить все переходы.'];
   return number===20?pair(prompt,candidates.slice(0,2),why):num(prompt,candidates[0],why);
  }
  case 22:{
   const N=14+i, durations=Array.from({length:N},()=>1+rand(16));
   const dependencies=durations.map((_,j)=>j===0?[]:[...new Set(Array.from({length:1+j%3},()=>rand(j)))]);
   const ends:number[]=[];for(let j=0;j<N;j++)ends[j]=durations[j]+Math.max(0,...dependencies[j].map(k=>ends[k]));
   return num(`В файле №${k} даны процессы, их длительности и номера зависимостей. Процесс стартует только после завершения всех зависимостей. Независимые могут выполняться параллельно, процессоров достаточно. Каково минимальное время завершения всех процессов?`,Math.max(...ends),
    ['Для процесса найди самое позднее завершение среди предшественников.','Прибавь его длительность; ответ — максимальное время завершения.'],{practical:rowsFile('процессы.csv',[['ID','Время','Зависимости'],...durations.map((t,j)=>[j+1,t,dependencies[j].map(p=>p+1).join(',')||0])])});
  }
  case 23:{
   const finish=24+3*g+(i%4), forbidden=13+Math.floor(i/4), required=6+g%5;
   const ways=(lo:number,hi:number)=>{const a=Array(hi+1).fill(0);a[lo]=1;for(let x=lo+1;x<=hi;x++)if(x!==forbidden)a[x]=(a[x-1]??0)+(a[x-3]??0)+(x%2===0?(a[x/2]??0):0);return a[hi];};
   return num(`Исполнитель начинает с 2. Команды: +1, +3 и ×2. Сколько программ приводят к ${finish}, проходят через ${required} и не проходят через ${forbidden}? Программы различаются последовательностью команд.`,ways(2,required)*ways(required,finish),
    ['Любой допустимый путь проходит обязательное значение один раз: команды строго увеличивают число.','Посчитай пути до обязательного числа и от него до цели; запрещённое значение получает 0 путей. Перемножь.']);
  }
  case 24:{
   const alphabet=g%2?'0012356789-**':'0002456789--*', chars=Array.from({length:1900+9*k},()=>alphabet[rand(alphabet.length)]).join('');
   const best=longestExpression(chars);
   return num(`В файле №${k} строка из цифр, минусов и звёздочек. Найди максимальную длину непрерывного фрагмента, являющегося выражением из неотрицательных целых чисел и бинарных операций «−», «*». Одиночное число тоже выражение. Ведущие нули и знаки перед числами запрещены.`,best,
    ['Выдели непрерывные группы цифр. Ноль допустим отдельно, но перед другими цифрами нельзя оставлять ведущие нули.','Продлевай выражение после ровно одного знака, если следующее число корректно от начала до конца. Иначе начинай новую цепочку; следи за максимумом.'],{practical:{files:[f('строка.txt',chars)]}});
  }
  case 25:{
   const digits=String(1+g), prime=(x:number)=>{if(x<2)return false;for(let d=2;d*d<=x;d++)if(x%d===0)return false;return true;};
   const chosen=Array.from({length:470},(_,j)=>j+11).filter(x=>prime(x)&&String(x).split(digits).length===2);
   const lo=2400+85*i+310*g, valid:number[][]=[];
   for(const [j,p] of chosen.entries())for(const q of chosen.slice(j))if(p*q>lo)valid.push([p*q,p]);
   const answer=valid.sort((a,b)=>a[0]-b[0]).slice(0,5).flat();
   return pair(`Найди первые пять чисел больше ${lo}, которые можно представить как произведение ровно двух простых множителей (в том числе равных) не больше 480. В записи каждого множителя цифра ${digits} встречается ровно один раз. Для каждого числа запиши его и меньший множитель; всего десять чисел, пары в порядке возрастания произведения.`,answer,
    ['Отбери простые числа до 480 с указанной цифрой ровно один раз.','Перебери пары p ≤ q, сохрани произведения выше границы и отсортируй по произведению.']);
  }
  case 26:{
   if(g%2){
    const cap=2300+7*k, records=Array.from({length:155+2*i},(_,j)=>[10*j+rand(7),1+rand(19),15+rand(160)]);
    let used=0, removed=0, read=0;
    for(let last=0;last<records.length;last++){
     while(used+records[last][2]>cap){used-=records[read++][2];removed++;}
     used+=records[last][2];
    }
    return pair(`Журнал сервера №${k} содержит время, ID клиента и объём запроса в Кбайт. Сервер хранит данные запросов в памяти ${cap} Кбайт. Обрабатывай запросы по возрастанию времени. Перед записью удаляй самые старые из хранящихся запросов целиком, пока новый не поместится. Укажи количество удалённых запросов и объём данных в памяти после последней записи.`,[removed,used],
     ['Сортируй по времени; два указателя задают первый сохранённый и текущий запрос.','Следи за занятым объёмом. Пока места не хватает, передвигай левый указатель и вычитай размер его записи.'],
     {practical:rowsFile('журнал.csv',[['Время','Клиент','Объём'],...shuffled(records,random)])});
   }
   const files=Array.from({length:180+i+k},()=>10+rand(170)), cap=1750+5*k, sorted=[...files].sort((a,b)=>a-b);
   let total=0, count=0;while(count<sorted.length&&total+sorted[count]<=cap)total+=sorted[count++];
   const best=Math.max(...sorted.filter(x=>x+total-sorted[count-1]<=cap));
   return pair(`Архиватор должен разместить файлы из списка №${k} на диске ёмкостью ${cap} Кбайт. Сначала максимизируй число помещённых файлов; среди таких наборов — размер самого большого выбранного файла. В ответе: количество и размер наибольшего.`,[count,best],
    ['Отсортируй размеры по возрастанию и набери максимум файлов с наименьшим суммарным объёмом.','Оставь минимальные k−1. Для последнего места выбери максимальный размер, который ещё помещается.'],{practical:{files:[f('размеры.txt',[cap+' '+files.length,...files].join('\n')+'\n')]}});
  }
  default:{
   const cluster=(dx:number,dy:number)=>Array.from({length:21+i},()=>[dx+rand(17),dy+rand(17)]), left=cluster(5+g,10),right=cluster(85+g,80), points=shuffled([...left,...right,[50,45],[51,2]],random);
   const centroid=(p:number[][])=>p.reduce((best,q,i)=>{const cost=p.reduce((s,q2)=>s+Math.hypot(q[0]-q2[0],q[1]-q2[1]),0);return cost<best.cost-1e-9||Math.abs(cost-best.cost)<1e-9&&(q[0]<p[best.index][0]||q[0]===p[best.index][0]&&q[1]<p[best.index][1])?{cost,index:i}:best;},{cost:Infinity,index:0}).index;
   const A=left[centroid(left)],B=right[centroid(right)];
   return pair(`Файл №${k} содержит координаты точек двух кластеров и шум. У первого кластера x < 40, у второго x > 70; остальные точки исключи. Центр кластера — его точка с минимальной суммой расстояний до остальных точек. При равенстве бери меньшие x, затем y. Укажи 100·среднее x центров и 100·среднее y центров в одной строке.`,[(A[0]+B[0])*50,(A[1]+B[1])*50],
    ['Раздели точки по x, отбросив шум. Для каждого кандидата внутри кластера сложи евклидовы расстояния.','Выбери обе опорные точки и отдельно усредни их x и y, применив заданный множитель.'],{practical:{files:[f('точки.txt',points.map(row=>row.join('\t')).join('\n')+'\n')]}});
  }
 }
}
const digit=(n:number)=>1+n%5;
const variants:string[][]=[
 ['Матрица и рисунок'],['Импликации'],['Операции и справочники'],['Префиксные коды'],['Двоичное преобразование'],['Черепаха и пересечение фигур'],['Графика и звук'],['Слова с ограничением'],['Числовые таблицы'],['Поиск целого слова'],['Идентификаторы и округление'],['Исполнитель Редактор и машина Тьюринга'],['IPv4: границы сети и единицы'],['Цифра и делимость'],['Импликация на отрезке'],['Разность рекуррентных значений'],['Соседние пары в файле'],['Динамика по таблице'],['Выигрыш после первого хода соперника'],['Выигрыш к своему второму ходу'],['Гарантия победы вторым ходом'],['Процессы и зависимости'],['Программы с обязательным значением'],['Непрерывный фрагмент строки'],['Отбор целых чисел'],['Отбор по объёму и журнал запросов'],['Разделение кластеров и их центры'],
];
export const egeInfoGroupTitle=(number:number, group:number)=>`${variants[number-1][0]} · набор ${group}`;
export const egeInfoTasks=variants.flatMap((_,n)=>Array.from({length:10},(_,g)=>Array.from({length:20},(_,i)=>task(n+1,g+1,i,{...exercise(n+1,g,i),exam:'ege',category:0,sourceIds:[]}))).flat());
