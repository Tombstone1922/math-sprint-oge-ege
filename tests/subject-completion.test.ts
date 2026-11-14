import assert from 'node:assert/strict';
import test from 'node:test';
import { spawnSync } from 'node:child_process';
import { subjectModules } from '../src/subjects.ts';
import { informaticsDrawing } from '../src/informatics/drawing.ts';
import { correctAnswer, physicsCorrect, physicsCourse, physicsSolution, physicsReady, taskCourse } from '../src/science/courses.ts';
import { emptyScience, parseScience, reduceScience, scienceTotals } from '../src/science/state.ts';
import { informaticsCorrect, informaticsCourse, informaticsTask, informaticsTaskCourse } from '../src/informatics/courses.ts';
import { emptyInformatics, parseInformatics, reduceInformatics, informaticsTotals } from '../src/informatics/state.ts';
import { robotProgram, runRobot, packTrainingFiles } from '../src/informatics/practical-model.ts';
import { practicalTasks } from '../src/informatics/bank-practical.ts';
import { longestExpression, egeInfoTasks } from '../src/informatics/bank-ege.ts';

test('91 independently addressed banks and 200 different tasks per new number',()=>{
 const ids=new Set();
 for(const module of subjectModules){
  const id=module.courseId, physics=module.subject==='physics';
  const c=physics?physicsCourse(id):informaticsCourse(id);
  assert.ok(c, module.id);assert.equal(c.tasks.length,200);assert.equal(c.groups.length,10);assert.ok(c.lesson.length>=3);
  const signatures=new Set();
  for(const g of c.groups)assert.equal(c.tasks.filter(t=>t.group===g.number).length,20,c.id);
  for(const t of c.tasks){
   assert.equal(t.number,module.number);assert.equal(t.exam??'oge',module.exam);assert.ok(t.hint&&t.firstStep&&t.steps.length>=2,t.id);
   assert.ok(!ids.has(t.id),t.id);ids.add(t.id);
   if ('figures' in t){
    assert.equal(informaticsTaskCourse(t.id)?.id,c.id);
    if(t.kind!=='written')assert.ok(informaticsCorrect(t,t.answer),t.id);
    if(t.exam||t.number>=11) signatures.add(JSON.stringify([t.prompt,t.figures,t.practical?.files,t.practical?.robot?.preview,t.code]));
   }else{
    assert.equal(taskCourse(t.id)?.id,c.id);
    if(t.kind==='written')assert.ok(t.written!.criteria.length>=2,t.id);
    else assert.ok(physicsCorrect(t,correctAnswer(t),t.options.map(o=>o.id)),t.id);
    if(t.exam||t.number>=21)signatures.add(JSON.stringify([t.prompt,t.figure,t.options.map(o=>o.text).sort()]));
   }
  }
  if(module.exam==='ege'||module.number>(physics?20:10))assert.equal(signatures.size,200,c.id);
 }
 assert.equal(ids.size,18200);
});
test('the EGE graph uses seven distinct positions and all edge endpoints are finite',()=>{
 const t=egeInfoTasks.find(t=>t.number===1)!;
 const graph=t.figures.find(f=>f.kind==='graph')!;
 const canvas=informaticsDrawing(graph);
 const circles=canvas.items.filter(x=>x.kind==='circle');
 assert.equal(circles.length,7);
 assert.equal(new Set(circles.map(c=>c.x+':'+c.y)).size,7);
 for(const e of canvas.items.filter(v=>v.kind==='line')) for(const n of [e.x1,e.x2,e.y1,e.y2]) assert.ok(Number.isFinite(n)&&n>=0);
});
test('authored search results agree with the actual archive contents',()=>{
 for(const t of practicalTasks.filter(t=>t.number===11||t.number===12)){
  const files=t.practical!.files!;
  if(t.number===11){
   const {token,label}=t.model.data as {token:string;label:string};
   const matches=files.filter(f=>f.text.includes(token));assert.equal(matches.length,1,t.id);
   assert.equal(matches[0].text.split('\n').find(l=>l.startsWith(label+': '))?.slice(label.length+2),t.answer);
  }else{
   const d=t.model.data as {base:string;dir:string;specific:boolean;suffixes:string[];prefix:string;excluding:boolean};
   const oracle=files.filter(f=>{
    const [,folder,sub,name]=f.path.split('/');
    if((folder===d.base)===d.excluding||d.specific&&d.dir!==sub||!name.startsWith(d.prefix))return false;
    return d.suffixes.some(s=>name.toLowerCase().slice(-s.length-1)==='.'+s);
   });
   assert.equal(Number(t.answer),oracle.length,t.id);
  }
 }
});
test('Robot samples solve every visible and sampled field, a hardcoded route fails, and loops cannot hang',()=>{
 for(const t of practicalTasks.filter(t=>t.number===15)){
  const robot=t.practical!.robot!, code=robotProgram(robot.sample);
  for(const field of [robot.preview,...robot.tests])assert.ok(runRobot(code,field).correct,t.id);
 }
 const sample=practicalTasks.find(t=>t.number===15)!.practical!.robot!;
 assert.ok(runRobot(robotProgram('закрасить\nвправо\nзакрасить\nвправо\nзакрасить'),sample.preview).correct);
 assert.equal(runRobot(robotProgram('закрасить\nвправо\nзакрасить\nвправо\nзакрасить'),sample.tests[0]).correct,false);
 assert.match(runRobot(robotProgram('нц пока справа свободно\nзакрасить\nкц'),sample.preview).reason!,/6000/);
 assert.throws(()=>robotProgram('кц'));
});
test('download packages are valid ZIPs with UTF-8 paths and matching files',()=>{
 const files=[{path:'Данные/тест.txt',text:'Русский текст → 123\n'},{path:'empty.csv',text:''}], bytes=packTrainingFiles(files);
 const proc=spawnSync('python3',['-c','import sys, zipfile, io, json; z=zipfile.ZipFile(io.BytesIO(sys.stdin.buffer.read())); assert z.testzip() is None; print(json.dumps({p:z.read(p).decode() for p in z.namelist()}))'],{input:bytes,encoding:'utf8'});
 assert.equal(proc.status,0,proc.stderr);assert.deepEqual(JSON.parse(proc.stdout),Object.fromEntries(files.map(f=>[f.path,f.text])));
});
test('Python reference programs match all published examples and control cases',()=>{
 const questions=practicalTasks.filter(t=>t.number===16).map(t=>t.practical!.program!);
 const runner=`import json,sys,io,contextlib
inp=sys.stdin
for q in json.load(inp):
 for item in q['examples']+q['checks']:
  sys.stdin=io.StringIO('\\n'.join(map(str,item['input']))+'\\n')
  target=io.StringIO()
  with contextlib.redirect_stdout(target): exec(q['sample'],{})
  assert target.getvalue().strip()==str(item['output']), (target.getvalue(),item['output'],q['sample'])
`;
 const proc=spawnSync('python3',['-c',runner],{input:JSON.stringify(questions),encoding:'utf8',maxBuffer:1024*1024});
 assert.equal(proc.status,0,proc.stderr);
});
test('scanner finds legal expressions including partial zero tokens and repeated operations',()=>{
 const legal=/^(?:0|[1-9]\d*)(?:[-*](?:0|[1-9]\d*))*$/;
 const alphabet='00173*-';
 for(let n=0;n<500;n++){
  let seed=n+17;
  const s=Array.from({length:21},()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return alphabet[seed%alphabet.length];}).join('');
  let best=0;
  for(let i=0;i<s.length;i++)for(let j=i+1;j<=s.length;j++)if(legal.test(s.slice(i,j)))best=Math.max(best,j-i);
  assert.equal(longestExpression(s),best,s);
 }
 assert.equal(longestExpression('4-000*73'),4);
});
test('number 19 physics accepts the actual reading and uncertainty and keeps their order',()=>{
 for(const t of physicsCourse('physics-ege-19')!.tasks){
  assert.equal(t.figure?.kind,'scale');const graph=t.figure;if(graph?.kind!=='scale')throw Error(t.id);
  const step=(graph.max-graph.min)/graph.divisions, err=t.group%2?step:step/2;
  const expected=graph.reading.toFixed(2)+' '+err.toFixed(2);
  assert.ok(physicsCorrect(t,expected,[]),t.id);
  assert.ok(!physicsCorrect(t,expected.split(' ').reverse().join(' '),[]),t.id);
  assert.ok(!physicsReady(t,'--1 2'));
 }
});
test('EGE games, networks and ordered compound answers have feasible nonempty results',()=>{
 for(const t of egeInfoTasks){
  if(t.number===20||t.number===25||t.number===27){
   const a=t.answer.split(' ');assert.equal(a.length,t.number===25?10:2);
   assert.ok(a.every(x=>Number.isSafeInteger(Number(x))),t.id);
   assert.ok(!informaticsCorrect(t,a.slice(0,-1).join(' ')));
  }
  if([19,21,23].includes(t.number))assert.ok(Number(t.answer)>0,t.id);
 }
});
test('new theory, Robot self-assessment and EGE written solutions survive real rounds without altering automatic accuracy',()=>{
 let info=reduceInformatics(emptyInformatics(),{type:'start',course:'informatics-oge-15',group:3,random:()=>.37},100);
 while(info.active?.phase==='view'){const a=info.active;info=reduceInformatics(info,{type:'view-next',session:a.id,task:a.ids[a.position]},110);}
 for(let n=0;n<10;n++){
  const a=info.active!,id=a.order[a.position], task=informaticsTask(id)!,base={session:a.id,task:id};
  info=reduceInformatics(info,{...base,type:'draft',value:task.practical!.robot!.sample});
  info=reduceInformatics(info,{...base,type:'open-sample'});
  task.written!.criteria.forEach((_,index)=>{info=reduceInformatics(info,{...base,type:'criterion',index,checked:true});});
  info=reduceInformatics(info,{...base,type:'self-grade'});
  assert.deepEqual(parseInformatics(JSON.parse(JSON.stringify(info))),info);
  info=reduceInformatics(info,{...base,type:'next'});
 }
 assert.equal(info.active?.phase,'result');assert.equal(informaticsTotals(info).attempts,0);assert.equal(informaticsTotals(info).selfFull,10);
 let phys=reduceScience(emptyScience(),{type:'start',course:'physics-ege-26',group:3,random:()=>.37},100);
 while(phys.active?.phase==='view'){const a=phys.active;phys=reduceScience(phys,{type:'view-next',session:a.id,task:a.ids[a.position]},110);}
 const a=phys.active!,id=a.order[0],task=physicsCourse('physics-ege-26')!.tasks.find(t=>t.id===id)!,base={session:a.id,task:id};
 phys=reduceScience(phys,{...base,type:'draft',value:physicsSolution(task).join('\n')});
 phys=reduceScience(phys,{...base,type:'open-sample'});
 phys=reduceScience(phys,{...base,type:'criterion',index:0,checked:true});
 phys=reduceScience(phys,{...base,type:'self-grade'});
 assert.equal(scienceTotals(phys).selfPoints,1);assert.equal(scienceTotals(phys).attempts,0);
 assert.deepEqual(parseScience(JSON.parse(JSON.stringify(phys))),phys);
});
