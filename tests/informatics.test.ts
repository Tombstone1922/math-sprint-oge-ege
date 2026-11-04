import assert from 'node:assert/strict';
import test from 'node:test';
import { allInformaticsTasks, informaticsCourses, informaticsCourse, informaticsTask, informaticsAnswer, informaticsCorrect, informaticsReady, validInformaticsInput } from '../src/informatics/courses.ts';
import { informaticsDrawing } from '../src/informatics/drawing.ts';
import { rng, type Expression, type Command, type InfoGraph } from '../src/informatics/model.ts';
import { emptyInformatics, reduceInformatics, parseInformatics, informaticsTotals, informaticsPending, type InformaticsState } from '../src/informatics/state.ts';
import { createInformaticsWriter, loadInformatics, INFORMATICS_KEY } from '../src/informatics/storage.ts';
import { emptyScience, reduceScience, parseScience } from '../src/science/state.ts';
import { SCIENCE_KEY } from '../src/science/storage.ts';
import { searchSubjectModules } from '../src/subjects.ts';
test('OGE informatics 1–10 have 2000 unique conditions, 100 groups and complete lessons, explanations and source references',()=>{
 assert.equal(allInformaticsTasks.length,2000);assert.equal(informaticsCourses.length,10);const seen=new Set();
 for(const c of informaticsCourses){assert.equal(c.tasks.length,200);assert.equal(c.groups.length,10);assert.equal(c.lesson.length,3);for(let g=1;g<=10;g++)assert.equal(c.tasks.filter(t=>t.group===g).length,20);}
 for(const t of allInformaticsTasks){const key=JSON.stringify([t.number,t.prompt,t.code,t.figures]);assert.ok(!seen.has(key),t.id);seen.add(key);assert.ok(t.steps.length>=2&&t.hint&&t.firstStep);assert.ok(t.sourceIds.length&&t.category!==39);assert.equal(t.colorIndex,Number(t.id.split('-').at(-1))-1);assert.ok(informaticsCorrect(t,t.answer,[]));}
 assert.equal(new Set(allInformaticsTasks.map(t=>t.id)).size,2000);assert.equal(searchSubjectModules('informatics','oge').filter(m=>m.status==='ready').length,10);assert.ok(searchSubjectModules('informatics','ege').every(m=>m.status==='planned'));
});
test('text information answers account for actual removed/added punctuation, replacement and bit/byte units',()=>{
 for(const t of allInformaticsTasks.filter(t=>t.number===1)){const d=t.model.data as any;let expected:string|number;
  if(t.model.rule==='text-edit'){assert.equal(new Set(d.list.map((s:string)=>s.length)).size,d.list.length);const text=d.list.join(', ')+' — слова.',short=d.list.filter((_:string,k:number)=>k!==d.index).join(', ')+' — слова.';const delta=d.mode==='заменили'?(d.word.length-d.old.length)*d.bits/8:(text.length-short.length)*d.bits/8;assert.equal(delta,d.delta);expected=d.word.toUpperCase();}
  else if(t.model.rule==='text-volume')expected=d.pages*d.lines*d.chars*d.bits/8;
  else if(t.model.rule==='recode')expected=d.count*(d.to-d.from)/8;
  else expected=d.count*Math.ceil(Math.log2(d.alphabet))/8;
  assert.equal(t.answer,String(expected),t.id);
 }
});
test('every cipher has exactly one valid decoding under the displayed repeat rule and round-trips its visible table',()=>{
 for(const t of allInformaticsTasks.filter(t=>t.number===2)){const d=t.model.data as any,codes=d.codes as[string,string][];assert.equal(new Set(codes.map(c=>c[1])).size,codes.length);let queue=[{at:0,word:''}],solutions:string[]=[];
  while(queue.length){const p=queue.shift()!;if(p.at===d.stream.length){solutions.push(p.word);continue;}for(const[l,c]of codes)if(d.stream.slice(p.at,p.at+c.length)===c&&(!d.nonprefix||!p.word.includes(l)))queue.push({at:p.at+c.length,word:p.word+l});}
  assert.deepEqual(solutions,[d.message],t.id);const text=[...d.message].map(l=>codes.find(c=>c[0]===l)![1]).join('');assert.equal(text,d.stream);assert.deepEqual(t.figures[0].kind==='table'?t.figures[0].rows:[],codes);
  const expected=d.mode==='encode'?d.stream:d.mode==='length'?String(d.message.length):d.mode==='distinct'?String(new Set(d.message).size):d.message;assert.equal(t.answer,expected);
 }
});
function truth(e:Expression,v:Record<string,number>):boolean{
 switch(e.op){case'and':return truth(e.a,v)&&truth(e.b,v);case'or':return truth(e.a,v)||truth(e.b,v);case'not':return!truth(e.a,v);case'mod':return (v[e.variable]%e.divisor===e.remainder)===e.equal;case'cmp':{const a=v[e.variable],b=e.value;return e.sign==='<'?a<b:e.sign==='<='?a<=b:e.sign==='>'?a>b:e.sign==='>='?a>=b:e.sign==='=='?a===b:a!==b;}}
}
test('logic boundaries, negation, parity and solution counts agree with exhaustive integer evaluation',()=>{
 for(const t of allInformaticsTasks.filter(t=>t.number===3)){const d=t.model.data as any,valid=[];for(let x=d.min;x<=d.max;x++)if(truth(d.expr,{x}))valid.push(x);const expected=d.ask==='count'?valid.length:d.ask==='min'?Math.min(...valid):Math.max(...valid);assert.equal(Number(t.answer),expected,t.id);}
});
function routeOracle(g:InfoGraph,start:number,end:number,blocked:number[]=[],via:number|null=null,exact:number|null=null){const n=g.labels.length,dp=Array.from({length:1<<n},()=>Array(n).fill(Infinity));dp[1<<start][start]=0;let best=Infinity;
 for(let mask=0;mask<(1<<n);mask++)for(let v=0;v<n;v++){const distance=dp[mask][v];if(!Number.isFinite(distance)||blocked.includes(v))continue;if(v===end&&(via===null||mask&(1<<via))&&(exact===null||mask.toString(2).split('1').length-2===exact))best=Math.min(best,distance);for(const e of g.edges){const w=e.from===v?e.to:e.to===v?e.from:-1;if(w>=0&&!(mask&(1<<w))&&!blocked.includes(w))dp[mask|(1<<w)][w]=Math.min(dp[mask|(1<<w)][w],distance+e.weight!);}}
 return best;
}
test('all road answers are shortest valid paths in the displayed symmetric distance matrix',()=>{
 for(const t of allInformaticsTasks.filter(t=>t.number===4)){const d=t.model.data as any,g=d.graph as InfoGraph,expected=d.difference?Math.abs(routeOracle(g,0,5)-routeOracle(g,0,4)):routeOracle(g,d.start,d.end,d.blocked,d.via,d.exact);assert.equal(Number(t.answer),expected,t.id);const f=t.figures[0];assert.equal(f.kind,'table');if(f.kind!=='table')continue;for(const e of g.edges){assert.equal(f.rows[e.from][e.to+1],String(e.weight));assert.equal(f.rows[e.to][e.from+1],String(e.weight));}}
});
function run(start:number,commands:Command[],program:string,b:number){let n=start;const trace=[n];for(const c of program){const cmd=commands[Number(c)-1],v=cmd.arg==='b'?b:cmd.arg;switch(cmd.op){case'add':n+=v;break;case'sub':n-=v;break;case'mul':n*=v;break;case'div':n/=v;break;}trace.push(n);}return trace;}
test('actor parameters are uniquely recoverable, and all forward, inverse and intermediate answers agree with execution',()=>{
 for(const t of allInformaticsTasks.filter(t=>t.number===5)){const d=t.model.data as any,trace=run(d.start,d.commands,d.program,d.b);assert.ok(Math.abs(trace.at(-1)!-d.finish)<1e-8);if(d.ask==='b'){const valid=Array.from({length:19},(_,i)=>i+2).filter(b=>Math.abs(run(d.start,d.commands,d.program,b).at(-1)!-d.finish)<1e-8);assert.deepEqual(valid,[Number(t.answer)],t.id);}else assert.equal(Number(t.answer),d.ask==='start'?d.start:d.ask==='middle'?trace[3]:trace.at(-1));}
});
test('program launch counts handle strict bounds, independent inputs and two possible YES outputs',()=>{
 for(const t of allInformaticsTasks.filter(t=>t.number===6)){const d=t.model.data as any;const expected=d.pairs.reduce((sum:number,[s,t]:number[])=>sum+Number(truth(d.expr,{s,t}))+(d.second?Number(truth(d.second,{s,t})):0),0);assert.equal(Number(t.answer),expected);assert.equal(d.pairs.length,9);assert.ok(t.code!.includes('s = int(input())\nt = int(input())'));const table=t.figures[0];assert.equal(table.kind,'table');if(table.kind==='table')assert.deepEqual(table.rows.map(row=>row.slice(1).map(Number)),d.pairs);}
});
function orders(a:string[]):string[][]{if(!a.length)return[[]];const result:string[][]=[];a.forEach((x,i)=>orders(a.filter((_,j)=>i!==j)).forEach(p=>result.push([x,...p])));return result;}
const ip=(s:string)=>{const parts=s.split('.');return parts.length===4&&parts.every(p=>/^\d{1,3}$/.test(p)&&String(Number(p))===p&&Number(p)<=255);};
test('address fragments reconstruct exactly the specified URL/email and IPv4 puzzles have a unique valid permutation',()=>{
 for(const t of allInformaticsTasks.filter(t=>t.number===7)){const d=t.model.data as any,order=[...t.answer].map(n=>d.fragments[Number(n)-1]);assert.equal(order.join(''),d.target);assert.equal(new Set(t.answer).size,d.fragments.length);if(d.g>=9)assert.deepEqual(orders(d.fragments).map(p=>p.join('')).filter(ip),[d.target]);else if(d.g>=7)assert.match(d.target,/^[a-z0-9]+@[a-z0-9.]+\.ru$/);else assert.match(d.target,/^(http|https|ftp):\/\/[a-z0-9]+\.ru(?::8080)?\/[a-z0-9/]+\.[a-z]+$/);}
});
test('query answers match explicit disjoint Venn regions and all supplied intersections are feasible',()=>{
 for(const t of allInformaticsTasks.filter(t=>t.number===8)){const d=t.model.data as any;let atoms:[number,number][];
  if(d.g<=6)atoms=[[1,d.A-d.I],[2,d.B-d.I],[3,d.I],[0,d.total-d.U]];else atoms=[[1,d.A-d.AB-d.AC+d.ABC],[2,d.B-d.AB-d.BC+d.ABC],[4,d.C-d.AC-d.BC+d.ABC],[3,d.AB-d.ABC],[5,d.AC-d.ABC],[6,d.BC-d.ABC],[7,d.ABC]];
  assert.ok(atoms.every(([,n])=>Number.isInteger(n)&&n>=0));const counts=atoms.flatMap(([mask,n])=>Array(n).fill(mask));const has=(m:number,b:number)=>Boolean(m&b);
  const predicate=(m:number)=>d.g===1?has(m,1)||has(m,2):d.g===2?has(m,1)&&has(m,2):d.g===3?has(m,1):d.g===4?m===1:d.g===5?m===1||m===2:d.g===6?m===0:d.g===7?m!==0:d.g===8?m===7:d.g===9?[3,5,6].includes(m):m===1;
  assert.equal(Number(t.answer),counts.filter(predicate).length,t.id);
 }
});
test('directed route counts independently enumerate paths with required, forbidden, OR and exact-length constraints',()=>{
 for(const t of allInformaticsTasks.filter(t=>t.number===9)){const d=t.model.data as any,g=d.graph as InfoGraph;assert.ok(g.directed);assert.equal(new Set(g.edges.map(e=>e.from+'-'+e.to)).size,g.edges.length);assert.ok(g.edges.every(e=>e.from<e.to));const queue=[[0]],paths:number[][]=[];while(queue.length){const path=queue.shift()!,v=path.at(-1)!;if(v===7){paths.push(path);continue;}for(const e of g.edges)if(e.from===v)queue.push([...path,e.to]);}const valid=paths.filter(p=>!d.blocked.some((v:number)=>p.includes(v))&&d.required.every((v:number)=>p.includes(v))&&(!d.any.length||d.any.some((v:number)=>p.includes(v)))&&(d.exact===null||p.length-1===d.exact));assert.equal(Number(t.answer),valid.length,t.id);assert.ok(valid.length>0,t.id);}
});
test('base conversions, digit counts, sums and interval enumeration agree with independent positional arithmetic',()=>{
 const decimal=(s:string,b:number)=>[...s].reduce((n,d)=>n*b+Number(d),0);
 for(const t of allInformaticsTasks.filter(t=>t.number===10)){const d=t.model.data as any;let expected:number|string;if(d.g<=4){assert.equal(decimal(d.source,d.from),d.n);if(d.to===10)expected=d.n;else{assert.equal(decimal(t.answer,d.to),d.n);assert.ok([...t.answer].every(v=>Number(v)<d.to));continue;}}else if(d.g<=7){let x=d.n,digits:number[]=[];while(x){digits.push(x%d.base);x=Math.floor(x/d.base);}expected=d.g===6?digits.reduce((s,n)=>s+n,0):digits.filter(n=>n===d.digit).length;}else if(d.g===8)expected=d.max?Math.max(...d.nums):Math.min(...d.nums);else if(d.g===9)expected=d.a+d.b;else{expected=0;for(let n=d.lo;n<=d.hi;n++){let x=n,count=0;while(x){count+=x&1;x>>=1;}if(count===d.k)expected++;}}assert.equal(t.answer,String(expected),t.id);}
});
test('drawn graphs encode every connection, arrow and road length without clipping or crossing an unintended city',()=>{
 for(const t of allInformaticsTasks)for(const f of t.figures)if(f.kind==='graph'){const d=informaticsDrawing(f),labels=d.items.filter(p=>p.kind==='text'&&f.labels.includes(p.value));assert.equal(labels.length,f.labels.length);assert.equal(d.items.filter(p=>p.kind==='circle').length,f.labels.length);assert.equal(d.items.filter(p=>p.kind==='line').length,f.edges.length*(f.directed?3:1));for(const p of d.items){const xy=p.kind==='line'?[p.x1,p.x2,p.y1,p.y2]:[p.x,p.y];assert.ok(xy.every(Number.isFinite));if(p.kind==='text')assert.ok(p.x-p.width/2>=0&&p.x+p.width/2<=390);}
  for(const e of f.edges){const a=labels[e.from],b=labels[e.to];assert.ok(a.kind==='text'&&b.kind==='text');for(const[v,p]of labels.entries()){if(v===e.from||v===e.to||p.kind!=='text')continue;const dx=b.x-a.x,dy=b.y-a.y,r=((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy);if(r<=0||r>=1)continue;const dist=Math.hypot(p.x-(a.x+r*dx),p.y-(a.y+r*dy));assert.ok(dist>14,t.id+' edge through city '+p.value);}}
 }
});
test('answer validation respects numeric equivalence, Cyrillic case, leading zero codes and rejects executable syntax',()=>{
 const number=allInformaticsTasks.find(t=>t.kind==='number')!,word=allInformaticsTasks.find(t=>t.number===1&&t.kind==='text')!,code=allInformaticsTasks.find(t=>t.number===2&&t.group===7&&t.answer.startsWith('0'))!;assert.ok(informaticsCorrect(number,'00'+number.answer));assert.ok(informaticsCorrect(word,word.answer.toLowerCase()));assert.ok(informaticsCorrect(code,code.answer));assert.ok(!informaticsCorrect(code,code.answer.slice(1)));for(const s of['',' ','-','Infinity','1e5','1;alert(1)','__import__("os")','1,2'])assert.ok(!informaticsReady(number,s));assert.ok(!validInformaticsInput(word,'x'.repeat(81)));assert.equal(informaticsCourse('physics-oge-1'),undefined);assert.equal(informaticsCourse(['informatics-oge-1']),undefined);
});
function practice(number:number){let s=reduceInformatics(emptyInformatics(),{type:'start',course:`informatics-oge-${number}`,group:1,random:rng(number)},1000);while(s.active!.phase==='view'){const a=s.active!;s=reduceInformatics(s,{type:'view-next',session:a.id,task:a.ids[a.position]},1001);}return s;}
function solve(s:InformaticsState,wrong=false,now=2000){const a=s.active!,id=a.order[a.position],t=informaticsTask(id)!;s=reduceInformatics(s,{type:'input',session:a.id,task:id,value:wrong?'999999':informaticsAnswer(t)},now);return reduceInformatics(s,{type:'submit',session:a.id,task:id},now);}
test('all ten courses finish and restore ten-task rounds; previews and duplicate submissions cannot invent progress',()=>{
 for(let n=1;n<=10;n++){let s=practice(n);assert.deepEqual(s.stats,{});for(let i=0;i<10;i++){s=solve(s);const a=s.active!,id=a.order[a.position];assert.ok(a.work[id].correct);assert.equal(reduceInformatics(s,{type:'submit',session:a.id,task:id}),s);assert.deepEqual(parseInformatics(JSON.parse(JSON.stringify(s))),s);s=reduceInformatics(s,{type:'next',session:a.id,task:id});}assert.equal(s.active!.phase,'result');assert.equal(informaticsTotals(s).independent,10);assert.deepEqual(parseInformatics(JSON.parse(JSON.stringify(s))),s);}
});
test('informatics errors require three due independent passes and cannot enter physics or another course',()=>{
 let s=solve(practice(3),true),id=s.active!.order[0];s=reduceInformatics(s,{type:'finish',session:s.active!.id});let now=3000;
 for(let pass=1;pass<=3;pass++){s=reduceInformatics(s,{type:'start',course:'informatics-oge-3',group:1,review:true},now);assert.deepEqual(s.active!.ids,[id]);s=solve(s,false,now);s=reduceInformatics(s,{type:'finish',session:s.active!.id});assert.equal(s.stats[id].streak,pass);if(pass<3){assert.equal(s.stats[id].dueAt!-now,pass===1?86400000:259200000);now=s.stats[id].dueAt!;}}
 assert.equal(informaticsPending(s).length,0);assert.equal(informaticsPending(s,undefined,'informatics-oge-4').length,0);const corrupt=JSON.parse(JSON.stringify(s));corrupt.stats['physics1-v1-g1-1']=s.stats[id];assert.equal(Object.keys(parseInformatics(corrupt).stats).length,1);const physics=reduceScience(emptyScience(),{type:'start',course:'physics-oge-14',group:3,random:rng(1)},10);assert.equal(parseInformatics(physics).active,null);assert.equal(parseScience(practice(1)).active,null);
});
test('a wrong or hinted answer restores exactly; malformed snapshots cannot skip unchecked work',()=>{
 let s=practice(1),a=s.active!,id=a.order[0];s=reduceInformatics(s,{type:'hint',session:a.id,task:id,level:1},1500);s=solve(s);assert.equal(s.stats[id].assisted,1);assert.equal(s.stats[id].independent,0);assert.deepEqual(parseInformatics(JSON.parse(JSON.stringify(s))),s);const bad=JSON.parse(JSON.stringify(s));bad.active.phase='result';bad.active.position=10;assert.equal(parseInformatics(bad).active!.position,1);assert.equal(parseInformatics(bad).active!.phase,'practice');bad.active.options[id]=['injected'];assert.equal(parseInformatics(bad).active,null);assert.throws(()=>parseInformatics({version:99}));
});
test('storage serializes drafts and retries while preserving byte-identical mathematics and physics snapshots',async()=>{
 const rows=new Map([[SCIENCE_KEY,'physics-unchanged'],['math-sprint/progress/v2','math-unchanged']]);let fail=false;const storage={getItem:async(k:string)=>rows.get(k)??null,setItem:async(k:string,v:string)=>{assert.equal(k,INFORMATICS_KEY);if(fail){fail=false;throw Error('disk');}rows.set(k,v);}};const write=createInformaticsWriter(storage),one=practice(7),a=one.active!,id=a.order[0],two=reduceInformatics(one,{type:'input',session:a.id,task:id,value:'12'});await Promise.all([write(one),write(two)]);assert.deepEqual(await loadInformatics(storage),two);fail=true;await assert.rejects(write(one));await write(two);assert.deepEqual(await loadInformatics(storage),two);assert.equal(rows.get(SCIENCE_KEY),'physics-unchanged');assert.equal(rows.get('math-sprint/progress/v2'),'math-unchanged');rows.set(INFORMATICS_KEY,'{bad');await assert.rejects(loadInformatics(storage));assert.equal(rows.get(INFORMATICS_KEY),'{bad');
});
