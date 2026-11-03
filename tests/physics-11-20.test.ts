import assert from 'node:assert/strict';
import test from 'node:test';
import { allPhysicsTasks, correctAnswer, physicsCorrect, physicsCourse, physicsCourses, physicsReady, physicsSolution, physicsTask } from '../src/science/courses.ts';
import { fmt, rng, type PhysicsTask } from '../src/science/physics-model.ts';
import { physicsDrawing } from '../src/science/physics-drawing.ts';
import { emptyScience, parseScience, practiceOptions, reduceScience, sciencePending, scienceTotals, type ScienceState } from '../src/science/state.ts';
import { createScienceWriter, loadScience, SCIENCE_KEY } from '../src/science/storage.ts';
const added=allPhysicsTasks.filter(t=>t.number>=11);
const num=(v:string)=>Number(v.replace('−','-').replace(',','.'));
test('11–20 contain 2000 unique authored conditions, ten groups of twenty, and all twenty modules are connected',()=>{
 assert.equal(allPhysicsTasks.length,4000);assert.equal(added.length,2000);assert.equal(physicsCourses.length,20);const seen=new Set();
 for(let n=11;n<=20;n++){const c=physicsCourse(`physics-oge-${n}`)!;assert.equal(c.tasks.length,200);assert.equal(c.groups.length,10);assert.equal(c.lesson.length,3);assert.ok(c.sources.length);for(let g=1;g<=10;g++)assert.equal(c.tasks.filter(t=>t.group===g).length,20);}
 for(const t of added){const key=JSON.stringify([t.number,t.prompt,t.passage,t.targets,t.figure,t.options.map(o=>o.text).sort()]);assert.ok(!seen.has(key),t.id);seen.add(key);assert.equal(t.colorIndex,Number(t.id.split('-').at(-1))-1);assert.ok(![66,80,81,84].includes(t.category),'Empty catalog categories cannot provide exercises');}
 assert.equal(new Set(added.map(t=>t.id)).size,2000);
});
function nuclearOracle(t:PhysicsTask){const [a,b,c,d,e]=t.model!.values;switch(t.model!.rule){case 'identity':return a;case 'nuclear-difference':return a-b;case 'nuclear-sum':return a+b;case 'ion-electrons':return a-b;case 'decay-chain':return e?(a-4*c)-(b-2*c+d):b-2*c+d;case 'reaction-balance':return a+b-c;case 'half-life':return a*.5**(b/c);default:throw Error('Unknown nuclear relation');}}
test('all nuclear answers conserve mass and charge numbers and preserve nonnegative particle counts',()=>{
 for(const t of added.filter(t=>t.number===11)){assert.equal(t.value,nuclearOracle(t),t.id);assert.ok(t.value!>=0&&Number.isInteger(t.value));assert.ok(physicsCorrect(t,fmt(t.value!),[]));}
});
test('change problems retain the fixed 1/2/3 code and independently calculated directions, including repeated codes',()=>{
 for(const t of added.filter(t=>t.fixedOptions)){const [a,b,c,d]=t.model!.values,dir=(x:number,y:number)=>Math.abs(y-x)<1e-8?'same':y>x?'up':'down';assert.deepEqual(t.keys,[dir(a,b),dir(c,d)]);assert.deepEqual(practiceOptions(t.id,rng(1)),['up','down','same']);assert.ok(physicsCorrect(t,correctAnswer(t),['up','down','same']));}
 for(const t of added.filter(t=>t.number===12&&t.group===10))assert.deepEqual(t.keys,['up','same'],'Cold body warms; isolated total energy is unchanged');
});
test('analysis has exactly two distinct true statements and accepts either selected order, never duplicate digits',()=>{
 const multi=added.filter(t=>t.kind==='multi');assert.equal(multi.length,400);
 for(const t of multi){assert.equal(t.options.length,5);assert.deepEqual(t.keys,['claim-0','claim-1']);assert.equal(new Set(t.options.map(o=>o.text)).size,5);const opts=practiceOptions(t.id,rng(11)),answer=correctAnswer(t,opts);assert.equal(new Set(answer).size,2);assert.ok(physicsCorrect(t,[...answer].reverse().join(''),opts));assert.ok(!physicsReady(t,answer[0]+answer[0]));assert.ok(!physicsReady(t,answer+'3'));}
});
test('motion, oscillation and Hooke statements are consistent with their graph or measured table',()=>{
 for(const t of added.filter(t=>t.number===14&&t.group<=3)){const f=t.figure!;assert.equal(f.kind,'plot');if(f.kind!=='plot')continue;
  const statement=(id:string)=>t.options.find(o=>o.id===id)!.text;
  if(t.group===1){const p=f.points[0],q=f.points.at(-1)!,v=(q[1]-p[1])/(q[0]-p[0]);assert.equal(statement('claim-0'),`Скорость тела равна ${v} м/с.`);assert.ok(statement('claim-1').includes(`${(q[1]-p[1])} м`));}
  if(t.group===2){const [a,b]=f.points,v=b[1],time=b[0]-a[0];assert.equal(statement('claim-0'),`Ускорение равно ${v/time} м/с².`);assert.ok(statement('claim-1').includes(fmt(v*time/2)));}
  if(t.group===3){const A=Math.max(...f.points.map(p=>p[1])),T=f.points[50][0]-f.points[10][0];assert.equal(statement('claim-0'),`Амплитуда равна ${A} см.`);assert.equal(statement('claim-1'),`Период равен ${fmt(T)} с.`);}
 }
 for(const t of added.filter(t=>t.number===16&&t.group===1)){const f=t.figure!;assert.equal(f.kind,'table');if(f.kind!=='table')continue;const ratios=f.rows.map(r=>num(r[1])/num(r[2]));assert.ok(ratios.every(r=>Math.abs(r-ratios[0])<.03));const expected=50+10*(Number(t.id.split('-').at(-1)));assert.ok(Math.abs(ratios[0]-expected)<.03);}
});
test('every measurement option follows its displayed scale and declared half-division uncertainty',()=>{
 for(const t of added.filter(t=>t.number===15&&t.group<=7)){const f=t.figure!;assert.equal(f.kind,'scale');if(f.kind!=='scale')continue;const step=(f.max-f.min)/f.divisions,right=t.options.find(o=>o.id==='right')!.text;
  assert.ok(f.reading>=f.min&&f.reading<=f.max);assert.ok(Math.abs((f.reading-f.min)/step-Math.round((f.reading-f.min)/step))<1e-8);assert.equal(new Set(t.options.map(o=>o.text)).size,4);
  if(t.group===1){assert.ok(right.startsWith(fmt(step)+' Н;'));assert.ok(right.endsWith(fmt(f.max)+' Н'));}
  else{const match=right.match(/^\(([-−\d,]+) ± ([\d,]+)\)/);assert.ok(match,right);assert.ok(Math.abs(num(match[1])-(f.reading-(f.start??0)))<1e-8);assert.ok(Math.abs(num(match[2])-step/2)<1e-8);}
 }
});
function writtenOracle(t:PhysicsTask):number{const [a,b,c,d,e,f]=t.model!.values;switch(t.model!.rule){
 case 'lab-density':return a/(c-b)*1000;case 'lab-friction':return a/b;case 'lab-stiffness':return a/b;case 'lab-buoyancy':return (a-b)/(c*d)*1e6;case 'lab-lever':return a*b/c;case 'lab-resistance':return a/b;case 'lab-power':return a*b;case 'lab-series':return (a+b)/c;case 'lab-focus':return 1/(1/a+1/b);case 'lab-magnification':return a/b;
 case 'written-traction':return a*b/c+a*d*e;case 'written-height':return b-c/(a*d);case 'written-lifting':return a*b*c/(d*e);case 'written-condense':return a*b+a*c*d;case 'written-ice-mixture':return (a*d*c-b*e)/(d*(a+b));case 'written-vessel-time':return (a*4200+b*920)*c/(d*e);case 'written-charge-heat':return a*a*b*c;case 'written-second-resistor':return b*b*(a/b-c)*d;case 'written-electric-heating':return a*b*c/(d*e*f);case 'written-motor':return 100*a*b*c/(d*e*f);default:throw Error('Unknown laboratory/calculation model '+t.model!.rule);
}}
test('all laboratory and long calculation samples satisfy independent physical equations and physical limits',()=>{
 const tasks=added.filter(t=>t.number===17||t.number===20);assert.equal(tasks.length,400);
 for(const t of tasks){assert.ok(Number.isFinite(t.value));assert.ok(Math.abs(writtenOracle(t)-t.value!)<1e-6,t.id);assert.ok(t.value!>0);if(t.model!.rule==='written-ice-mixture'){const [mh,mi,Th,c,L]=t.model!.values;assert.ok(mh*c*Th>mi*L);assert.ok(t.value!<Th);}if(t.model!.rule==='written-motor')assert.ok(t.value!<100);assert.equal(t.kind,'written');assert.ok(!physicsReady(t,fmt(t.value!)));}
});
test('reading tasks carry self-contained passages and physically plausible temperature/pressure data',()=>{
 const tasks=added.filter(t=>t.number===18);assert.equal(tasks.length,200);
 for(const t of tasks){assert.ok(t.passage&&t.passage.body.length>600);assert.equal(t.kind,'written');assert.equal(t.written!.criteria.length,2);if(t.model!.rule==='reading-boiling'){const [p,T]=t.model!.values;assert.ok(T>85&&T<100);const pressure=100*10**(5.08354-1663.125/(T+273.15-45.622));assert.ok(Math.abs(pressure-p)<.3);}}
});
test('new apparatus and scales draw finite geometry without clipping; unknown resistor answers stay hidden',()=>{
 for(const t of added.filter(t=>t.figure)){const draw=physicsDrawing(t.figure!);assert.ok(draw.items.length>0||t.figure!.kind==='table');for(const p of draw.items){if(p.kind==='line'){assert.ok([p.x1,p.x2,p.y1,p.y2].every(Number.isFinite));assert.ok(Math.min(p.x1,p.x2)>=0&&Math.max(p.x1,p.x2)<=390,t.id);assert.ok(Math.min(p.y1,p.y2)>=0&&Math.max(p.y1,p.y2)<=280,t.id);}if(p.kind==='text')assert.ok(p.x-p.width/2>=-1&&p.x+p.width/2<=391,t.id+': '+p.value);}
  if(t.figure!.kind==='circuit'&&t.figure!.unknown){const labels=draw.items.filter(p=>p.kind==='text'&&p.value.startsWith('R'));if(t.figure!.unknown===true)assert.ok(labels.every(p=>p.kind==='text'&&p.value.includes('?')));else{assert.ok(labels.some(p=>p.kind==='text'&&p.value.startsWith('R₂ = ?')));assert.ok(labels.some(p=>p.kind==='text'&&p.value.startsWith('R₁ = ')&&!p.value.includes('?')));}}
 }
});
function practice(n:number,g=1){let s=reduceScience(emptyScience(),{type:'start',course:`physics-oge-${n}`,group:g,random:rng(n)},1000);while(s.active?.phase==='view'){const a=s.active;s=reduceScience(s,{type:'view-next',session:a.id,task:a.ids[a.position]},1001);}return s;}
const base=(s:ScienceState)=>({session:s.active!.id,task:s.active!.order[s.active!.position]});
function selfCheck(s:ScienceState,full=true){let b=base(s);s=reduceScience(s,{...b,type:'draft',value:'Моё решение: физическая формула, подстановка, единицы и вывод.'},2000);s=reduceScience(s,{...b,type:'open-sample'},2001);const t=physicsTask(b.task)!;if(full)for(let i=0;i<t.written!.criteria.length;i++)s=reduceScience(s,{...b,type:'criterion',index:i,checked:true},2002);return reduceScience(s,{...b,type:'self-grade'},2003);}
test('written answers require a draft and comparison; never enter the automatic accuracy counters',()=>{
 let s=practice(17),b=base(s);const original=s;for(const type of ['open-sample','self-grade','submit']as const)assert.equal(reduceScience(s,{...b,type}),original);assert.equal(reduceScience(s,{...b,type:'criterion',index:0,checked:true}),original);
 s=reduceScience(s,{...b,type:'draft',value:'Сначала измерю F и P, затем вычислю отношение.'});assert.deepEqual(parseScience(JSON.parse(JSON.stringify(s))),s);assert.deepEqual(s.stats,{});
 s=selfCheck(s);assert.equal(s.stats[b.task].attempts,0);assert.equal(s.stats[b.task].correct,0);assert.equal(s.stats[b.task].selfAttempts,1);assert.equal(s.stats[b.task].selfPoints,4);assert.equal(scienceTotals(s).attempts,0);assert.equal(scienceTotals(s).selfAttempts,1);assert.deepEqual(parseScience(JSON.parse(JSON.stringify(s))),s);assert.equal(reduceScience(s,{...b,type:'self-grade'}),s);
});
test('self-check flags and text survive restart; edits after sample are marked assisted and incomplete work is queued',()=>{
 let s=practice(19),b=base(s);s=reduceScience(s,{...b,type:'draft',value:'Сила Архимеда растёт, давление уменьшается.'});s=reduceScience(s,{...b,type:'open-sample'});s=reduceScience(s,{...b,type:'criterion',index:0,checked:true});assert.deepEqual(parseScience(JSON.parse(JSON.stringify(s))),s);
 s=reduceScience(s,{...b,type:'draft',value:'Доработано: N = mg − FА, p = N/S; давление уменьшается.'},3000);assert.equal(s.active!.work[b.task].hint,1);s=reduceScience(s,{...b,type:'self-grade'},3001);assert.equal(s.active!.work[b.task].score,1);assert.equal(sciencePending(s,3001).length,1);assert.equal(scienceTotals(s).attempts,0);
 const raw=JSON.parse(JSON.stringify(s));raw.active.work[b.task].score=100;raw.active.work[b.task].correct=true;const restored=parseScience(raw);assert.equal(restored.active!.work[b.task].score,1);assert.equal(restored.active!.work[b.task].correct,false);
});
test('manual repeat requires three due independent self-check passes and remains separated by course',()=>{
 let s=selfCheck(practice(18),false),b=base(s);s=reduceScience(s,{type:'finish',session:b.session});let now=3000;
 for(let pass=1;pass<=3;pass++){s=reduceScience(s,{type:'start',course:'physics-oge-18',group:1,review:true,random:rng(pass)},now);const a=s.active!;assert.equal(a.ids.length,1);s=reduceScience(s,{...base(s),type:'draft',value:'Ответ и объяснение по правилу из текста.'},now);s=reduceScience(s,{...base(s),type:'open-sample'},now);for(let j=0;j<2;j++)s=reduceScience(s,{...base(s),type:'criterion',index:j,checked:true},now);s=reduceScience(s,{...base(s),type:'self-grade'},now);s=reduceScience(s,{type:'finish',session:a.id});assert.equal(s.stats[b.task].streak,pass);if(pass<3){assert.equal(s.stats[b.task].dueAt!-now,pass===1?86400000:259200000);assert.equal(sciencePending(s,now).length,0);now=s.stats[b.task].dueAt!;}}
 assert.equal(sciencePending(s).length,0);assert.equal(scienceTotals(s).attempts,0);assert.equal(scienceTotals(s).selfAttempts,4);
});
test('all ten new module formats complete and restore full ten-task sessions',()=>{
 for(let n=11;n<=20;n++){let s=practice(n);assert.deepEqual(s.stats,{});for(let i=0;i<10;i++){const b=base(s),a=s.active!,t=physicsTask(b.task)!;if(t.kind==='written')s=selfCheck(s);else{s=reduceScience(s,{...b,type:'input',value:correctAnswer(t,a.options[t.id])},2000);s=reduceScience(s,{...b,type:'submit'},2001);}assert.ok(s.active!.work[t.id].submitted);s=reduceScience(s,{...b,type:'next'},2004);}assert.equal(s.active!.phase,'result');assert.deepEqual(parseScience(JSON.parse(JSON.stringify(s))),s);assert.equal(scienceTotals(s).attempts,n>=17?0:10);assert.equal(scienceTotals(s).selfAttempts,n>=17?10:0);}
});
test('invalid fixed-code or written snapshots cannot skip work or erase valid progress',()=>{
 let s=practice(12),raw=JSON.parse(JSON.stringify(s));raw.active.options[raw.active.ids[0]].reverse();assert.equal(parseScience(raw).active,null);
 s=selfCheck(practice(20));raw=JSON.parse(JSON.stringify(s));const id=s.active!.order[0];raw.active.work[id].draft='';raw.active.phase='result';raw.active.position=10;const restored=parseScience(raw);assert.equal(restored.active!.phase,'practice');assert.equal(restored.active!.position,0);assert.equal(restored.stats[id].selfAttempts,1);
});
test('written progress storage is isolated from mathematics and round-trips self-check evidence',async()=>{
 const map=new Map([['math-sprint/progress/v2','unchanged-math']]),storage={getItem:async(k:string)=>map.get(k)??null,setItem:async(k:string,v:string)=>{assert.equal(k,SCIENCE_KEY);map.set(k,v);}};const s=selfCheck(practice(20));await createScienceWriter(storage)(s);assert.deepEqual(await loadScience(storage),s);assert.equal(map.get('math-sprint/progress/v2'),'unchanged-math');
});
