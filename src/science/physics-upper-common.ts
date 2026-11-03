import { rng, shuffled, taskId, type PhysicsTask, type PhysicsPlot } from './physics-model.ts';
export type TaskBody = Omit<PhysicsTask,'id'|'number'|'group'|'colorIndex'>;
export function upperTask(number:number,group:number,index:number,body:TaskBody):PhysicsTask{return {id:taskId(number,group,index),number,group,colorIndex:index,...body};}
export function numberTask(prompt:string,value:number,unit:string,steps:string[],rule:string,values:number[],category:number,sourceIds:number[]):TaskBody{
 return {kind:'number',prompt,value,unit,targets:[],options:[],keys:[],steps,hint:'Выдели известные величины и запиши закон, связывающий их с искомой.',firstStep:steps[0],model:{rule,values},category,sourceIds};
}
export function chooseTask(prompt:string,correct:string,wrong:string[],seed:number,steps:string[],category:number,sourceIds:number[]):TaskBody{
 return {kind:'choice',prompt,targets:[],options:shuffled([{id:'right',text:correct},...wrong.map((text,i)=>({id:`wrong-${i}`,text}))],rng(seed)),keys:['right'],steps,hint:'Отдели показание прибора от цены деления, а проверяемый фактор — от остальных условий.',firstStep:steps[0],category,sourceIds};
}
export function multipleTask(prompt:string,statements:{text:string;true:boolean;why:string}[],seed:number,category:number,sourceIds:number[]):TaskBody{
 if(statements.length!==5||statements.filter(s=>s.true).length!==2)throw Error('Two of five statements required');
 const options=shuffled(statements.map((s,i)=>({id:`claim-${i}`,text:s.text})),rng(seed));
 return {kind:'multi',prompt:prompt+' Выбери два верных утверждения. Порядок выбранных номеров не важен.',targets:[],options,keys:statements.flatMap((s,i)=>s.true?[`claim-${i}`]:[]),steps:statements.map(s=>`${s.text} — ${s.true?'верно':'неверно'}. ${s.why}`),hint:'Для каждого утверждения найди подтверждение в исходных данных. Не делай вывод о факторе, который в опыте не изменяли.',firstStep:'Отдельно проверь каждое из пяти утверждений; верных должно быть ровно два.',category,sourceIds};
}
export const plot=(xLabel:string,yLabel:string,points:[number,number][],xTicks:number[],yTicks:number[],caption:string):PhysicsPlot=>({kind:'plot',xLabel,yLabel,points,xTicks,yTicks,caption});
export const change=(before:number,after:number)=>Math.abs(after-before)<1e-8?'same':after>before?'up':'down';
export const changeOptions=[{id:'up',text:'увеличится'},{id:'down',text:'уменьшится'},{id:'same',text:'не изменится'}];
export function writtenTask(prompt:string,steps:string[],criteria:{title:string;detail:string}[],mode:NonNullable<PhysicsTask['written']>['mode'],category:number,sourceIds:number[]):TaskBody{
 return {kind:'written',prompt,targets:[],options:[],keys:[],steps,hint:mode==='experiment'?'Назови приборы, схему, измеряемые величины и формулу. Отдельно укажи условия опыта и погрешности.':mode==='reading'?'Найди в тексте правило, которое относится к вопросу. Свяжи это правило с новым условием.':'Начни с физического закона, затем последовательно объясни или вычисли искомое.',firstStep:steps[0],written:{mode,criteria},category,sourceIds};
}
