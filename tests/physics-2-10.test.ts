import assert from 'node:assert/strict';
import test from 'node:test';
import { createHash } from 'node:crypto';
import { allPhysicsTasks, correctAnswer, physicsCorrect, physicsCourse, physicsCourses, physicsReady, physicsTask, physicsSolution, validPhysicsInput } from '../src/science/courses.ts';
import { rng, fmt, type PhysicsTask } from '../src/science/physics-model.ts';
import { physicsDrawing } from '../src/science/physics-drawing.ts';
import { emptyScience, parseScience, practiceOptions, reduceScience, sciencePending, scienceTotals, type ScienceState } from '../src/science/state.ts';
const added=allPhysicsTasks.filter(t=>t.number>=2);
test('nine real banks contain 1800 different conditions and diagrams, exactly 10 groups of 20 per course',()=>{
 assert.equal(createHash('sha256').update(JSON.stringify(added)).digest('hex'),'7e1cdfb8396372a9a36f65784486b6ca38fef38048e425f928e5f4d911761002','Published IDs must retain their original content');
 assert.equal(added.length,1800);assert.equal(physicsCourses.length,10);const seen=new Set();
 for(const c of physicsCourses){assert.equal(c.tasks.length,200);assert.equal(c.groups.length,10);assert.equal(c.lesson.length,3);assert.ok(c.sources.length);for(const g of c.groups)assert.equal(c.tasks.filter(t=>t.group===g.number).length,20);}
 for(const t of added){assert.equal(physicsTask(t.id),t);assert.equal(t.colorIndex,Number(t.id.split('-').at(-1))-1);assert.ok(t.prompt.length>15&&t.steps.length>=2&&t.category>0);const signature=JSON.stringify([t.number,t.prompt,t.targets,t.figure,t.options.map(o=>o.text).sort()]);assert.ok(!seen.has(signature),t.id);seen.add(signature);}
 assert.equal(new Set(added.map(t=>t.id)).size,1800);
});
test('all answer forms have complete unambiguous options and independently re-numbered correct answers',()=>{
 for(const t of added){
  const opts=practiceOptions(t.id,rng(71));assert.deepEqual([...opts].sort(),t.options.map(o=>o.id).sort());
  if(t.kind==='number'){assert.equal(t.options.length,0);assert.ok(Number.isFinite(t.value));continue;}
  assert.equal(new Set(t.options.map(o=>o.text)).size,t.options.length,t.id);assert.equal(new Set(t.options.map(o=>o.id)).size,t.options.length,t.id);
  assert.equal(t.options.length,t.number===4?8:4);assert.equal(t.keys.length,t.number===2?2:t.number===4?4:1);
  for(const key of t.keys)assert.equal(t.options.filter(o=>o.id===key).length,1);
  const independent=t.keys.map(key=>opts.indexOf(key)+1).join('');assert.equal(correctAnswer(t,opts),independent);assert.notEqual(correctAnswer(t),independent,t.id);assert.ok(physicsCorrect(t,independent,opts));
 }
});
function oracle(t:PhysicsTask):number{
 const [a,b,c,d]=t.model!.values;let value:number;
 switch(t.model!.rule){
  case 'centripetal':value=a*a/b;break;case 'collision':value=a*b/(a+c);break;case 'hot-mass':value=a*(c-b)/(d-c);break;case 'two-bodies':value=(a*4200+b*920)*c;break;case 'identity':value=a;break;case 'relative':value=a+b*c;break;case 'accelerated-path':value=(a+b)*c*.5;break;case 'slope':value=(a-b)/c;break;case 'triangle-path':value=a*b*.5;break;case 'density':value=a/b;break;case 'newton':value=Math.abs(a+d*b)/c;break;case 'hooke':value=a*b;break;case 'friction':value=a*b*c;break;case 'pressure':value=a/b;break;case 'hydrostatic':value=a*b*c;break;case 'buoyancy-volume':value=(a-b)*1e6/(c*d);break;case 'hydraulic':value=a*b;break;
  case 'frequency-rounded':value=Number((1/a).toFixed(3));break;case 'divide-rounded':value=Number((a/b).toFixed(3));break;case 'work':value=a*b;break;case 'power':value=a*b/c;break;case 'kinetic':value=a*b*b/2;break;case 'potential':value=a*b*c;break;case 'lever':value=a*b/c;break;case 'spring-energy':value=a*b*b/2;break;
  case 'heating':value=a*b*c;break;case 'specific-heat':value=a/(b*c);break;case 'latent':value=a*b/c;break;case 'mixture-rounded':value=Number(((a*b+c*d)/(a+c)).toFixed(3));break;case 'multiply':value=a*b;break;case 'efficiency-rounded':value=Number((100*a/b).toFixed(3));break;case 'heating-power':value=a*b*c/d;break;case 'heat-melt':value=a*(b*c+d)/1000;break;
  case 'shared-charge':value=(a+b)*.5;break;case 'double-contact':value=(a+b)*.25+c*.5;break;case 'electrons':value=a+b*c;break;case 'divide':value=a/b;break;case 'wire':value=a*b/c;break;case 'wire-scale':value=a*b/c;break;case 'charge-direction':value=c<0?2:b>a?1:2;break;case 'parallel-current':value=a*(b+c)/(b*c);break;
  case 'optical-rounded':value=Number((b/a).toFixed(3));break;case 'lens-rounded':value=Number((1/(1/a-1/b)).toFixed(3));break;case 'mirror':value=2*a-2*b;break;case 'shadow':value=a*b/c;break;case 'reflection':value=90-a;break;case 'deviation':value=a-b;break;case 'radio-rounded':value=Number((3e8/(a*1e6)).toFixed(3));break;case 'electric-work':value=a*b*c;break;case 'electric-power':value=a*a/b;break;case 'joule':value=a*a*b*c;break;case 'parallel-rounded':value=Number((1/(1/a+1/b)).toFixed(3));break;case 'series':value=a+b;break;
  default:throw Error('Untested physical rule '+t.model!.rule);
 }
 return Math.abs(Number(value.toFixed(3))-value)>1e-7?Number(value.toFixed(3)):value;
}
test('all 1000 numerical answers satisfy independent physical equations and unit conversions',()=>{
 const numeric=added.filter(t=>t.kind==='number');assert.equal(numeric.length,1000);
 for(const t of numeric){assert.ok(Math.abs(oracle(t)-t.value!)<1e-7,t.id);assert.ok(physicsCorrect(t,fmt(t.value!),[]),t.id);assert.ok(physicsReady(t,fmt(t.value!)));assert.ok(!physicsCorrect(t,fmt(t.value!+1),[]));if(t.value!<0)assert.ok(physicsCorrect(t,String(t.value).replace('.',','),[]));}
});
test('numeric validation accepts decimal commas and signs while rejecting malformed, missing, infinite and excessive answers',()=>{
 const t=added.find(t=>t.kind==='number'&&t.value===-.5)??{...added.find(t=>t.kind==='number')!,value:-.5};
 for(const input of ['-0,5','−0.500000','-00.5'])assert.ok(physicsCorrect(t,input,[]));
 for(const input of ['','−','1,','Infinity','NaN','1e10','1/2','0,5,1','--1','1 2','12345678901234567'])assert.ok(!physicsReady(t,input),input);
 assert.ok(validPhysicsInput(t,'−'));assert.ok(validPhysicsInput(t,'0,'));assert.ok(!physicsCorrect(t,'0,5',[]));
});
test('graphs retain true tick coordinates, ordered axes, finite bounded drawing geometry and correct oscillation scales',()=>{
 for(const t of added.filter(t=>t.figure)){
  const f=t.figure!,draw=physicsDrawing(f);assert.equal(draw.width,390);assert.equal(draw.height,280);
  for(const item of draw.items){const coords=item.kind==='line'?[item.x1,item.x2,item.y1,item.y2]:[item.x,item.y];assert.ok(coords.every(Number.isFinite),t.id);if(item.kind==='line'){assert.ok(item.x1>=0&&item.x2>=0&&item.x1<=390&&item.x2<=390,t.id);assert.ok(item.y1>=0&&item.y2>=0&&item.y1<=280&&item.y2<=280,t.id);}if(item.kind==='text'){assert.ok(item.x-item.width/2>=-1&&item.x+item.width/2<=391,t.id+': '+item.value);}}
  if(f.kind==='rays'){
   const candidates=draw.items.filter(p=>p.kind==='line'&&p.x1===190&&p.y1===105&&p.x2===340);
   const crossing=candidates.filter(p=>p.kind==='line'&&Math.abs(p.y1+(p.y2-p.y1)*(f.focal*1.2)/(p.x2-p.x1)-150)<1e-7);
   assert.equal(crossing.length,1,t.id);const ray=crossing[0];assert.ok(ray.kind==='line');
   const label=draw.items.find(p=>p.kind==='text'&&p.x===359&&Math.abs(p.y-ray.y2-1)<1e-7);assert.ok(label?.kind==='text');assert.equal(Number(label.value),t.value);
  }
  if(f.kind==='plot'){
   assert.ok(f.xTicks.every((v,i)=>i===0||v>f.xTicks[i-1]));assert.ok(f.yTicks.every((v,i)=>i===0||v>f.yTicks[i-1]));
   for(const [x,y]of f.points){assert.ok(x>=Math.min(...f.xTicks)-1e-6&&x<=Math.max(...f.xTicks)+1e-6);assert.ok(y>=Math.min(...f.yTicks)-1e-6&&y<=Math.max(...f.yTicks)+1e-6);}
   if(t.number===7&&t.group===1)assert.ok(Math.abs((Math.max(...f.xTicks)-Math.min(...f.xTicks))/2-t.value!)<1e-7);
   if(t.number===7&&t.group===4)assert.equal(Math.max(...f.points.map(p=>p[1])),t.value);
  }
 }
});
function practice(course:string,group=1){let s=reduceScience(emptyScience(),{type:'start',course:course as `physics-oge-${number}`,group,random:rng(31)},1000);while(s.active?.phase==='view')s=reduceScience(s,{type:'view-next',session:s.active.id,task:s.active.ids[s.active.position]},1001);return s;}
function solve(s:ScienceState,answer?:string){const a=s.active!,id=a.order[a.position],t=physicsTask(id)!;s=reduceScience(s,{type:'input',session:a.id,task:id,value:answer??correctAnswer(t,a.options[id])},2000);return reduceScience(s,{type:'submit',session:a.id,task:id},2000);}
test('all nine courses complete ten guided and ten checked cards with restored options and no false attempts',()=>{
 for(let n=2;n<=10;n++){let s=practice(`physics-oge-${n}`);assert.deepEqual(s.stats,{});assert.equal(s.active!.course,`physics-oge-${n}`);assert.deepEqual(parseScience(JSON.parse(JSON.stringify(s))),s);for(let i=0;i<10;i++){s=solve(s);assert.ok(s.active!.work[s.active!.order[i]].correct);const a=s.active!;s=reduceScience(s,{type:'next',session:a.id,task:a.order[i]},2001);}assert.equal(s.active!.phase,'result');assert.equal(scienceTotals(s).independent,10);assert.deepEqual(parseScience(JSON.parse(JSON.stringify(s))),s);}
});
test('multi-course progress and due queues cannot cross course boundaries or accept an injected saved task',()=>{
 const one=practice('physics-oge-2'),two=practice('physics-oge-9');const id1=one.active!.order[0],id2=two.active!.order[0];const stat={attempts:1,correct:0,independent:0,assisted:0,dueAt:0,streak:0};let s={...emptyScience(),stats:{[id1]:stat,[id2]:stat}};
 assert.equal(sciencePending(s,1,'physics-oge-2').length,1);assert.equal(scienceTotals(s,undefined,'physics-oge-9').attempts,1);
 s=reduceScience(s,{type:'start',course:'physics-oge-9',group:1,review:true},1000);assert.deepEqual(s.active!.ids,[id2]);
 const corrupt=JSON.parse(JSON.stringify(one));corrupt.active.ids[0]=id2;assert.equal(parseScience(corrupt).active,null);assert.equal(Object.keys(parseScience({...corrupt,stats:s.stats}).stats).length,2);
});
test('incorrect and assisted numerical answers survive restore and require spaced independent review',()=>{
 let s=practice('physics-oge-9'),a=s.active!,id=a.order[0];s=reduceScience(s,{type:'hint',session:a.id,task:id,level:1},1500);s=solve(s);assert.equal(s.stats[id].assisted,1);assert.equal(s.stats[id].independent,0);assert.deepEqual(parseScience(JSON.parse(JSON.stringify(s))),s);s=reduceScience(s,{type:'finish',session:a.id});
 s=reduceScience(s,{type:'start',course:'physics-oge-9',group:1,review:true},2000);s=solve(s);a=s.active!;s=reduceScience(s,{type:'finish',session:a.id});assert.equal(s.stats[id].streak,1);assert.equal(sciencePending(s,2001,'physics-oge-9').length,0);assert.equal(sciencePending(s,undefined,'physics-oge-9').length,1);
});
test('guided and standalone solutions agree after answer-option changes, without changing published bank one',()=>{
 for(const t of added){const opts=practiceOptions(t.id,rng(17));const solution=physicsSolution(t,opts);assert.ok(solution.at(-1)!.startsWith('Ответ: '+correctAnswer(t,opts)));}
 assert.equal(physicsCourse('physics-oge-11'),undefined);assert.equal(physicsCourse(['physics-oge-2']),undefined);
});
